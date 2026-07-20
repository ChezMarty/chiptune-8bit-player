//! Librespot integration for direct Spotify audio streaming.
//!
//! Architecture:
//! - Creates a librespot session using OAuth credentials obtained from the
//!   existing Spotify Web API integration.
//! - Creates a player with a custom audio sink that captures decoded PCM data.
//! - Forwards PCM audio data to the frontend via Tauri events for Web Audio API playback.
//!
//! This implementation follows the official librespot v0.5.0 API as demonstrated
//! in `examples/play.rs` and the `audio_backend` module source.

use std::sync::{
    atomic::{AtomicBool, AtomicU64, Ordering},
    Arc,
};
use std::sync::mpsc;

use base64::{engine::general_purpose::STANDARD, Engine as _};

use librespot_core::{
    authentication::Credentials,
    config::SessionConfig,
    session::Session,
    spotify_id::{SpotifyId, SpotifyItemType},
};
use librespot_playback::{
    audio_backend::{self, Sink, SinkResult},
    config::PlayerConfig,
    convert::Converter,
    decoder::AudioPacket,
    mixer::{NoOpVolume, VolumeGetter},
    player::Player,
};
use tauri::{AppHandle, Emitter};

// ── Shared Playback State ────────────────────────────────────────

/// Thread-safe state queried by the frontend.
struct PlaybackStateInner {
    is_playing: AtomicBool,
    position_ms: AtomicU64,
    duration_ms: AtomicU64,
    volume_scaled: AtomicU64,
}

impl PlaybackStateInner {
    fn new() -> Self {
        Self {
            is_playing: AtomicBool::new(false),
            position_ms: AtomicU64::new(0),
            duration_ms: AtomicU64::new(0),
            volume_scaled: AtomicU64::new(7000), // 0.7 default
        }
    }
}

// ── Audio Packet Channel ─────────────────────────────────────────

/// PCM audio packet sent from the librespot sink to the emitter task.
///
/// The `data` field contains raw f32 bytes (little-endian, interleaved)
/// so the emitter can base64-encode them without an extra copy.
struct PcmPacket {
    /// Interleaved f32 samples encoded as raw little-endian bytes.
    data: Vec<u8>,
    sample_rate: u32,
    channels: u16,
}

/// A custom audio sink that captures decoded PCM data and sends it
/// through a channel for the async emitter task to forward to the frontend.
///
/// Following the official `Sink` trait signature from librespot v0.5.0:
///   `fn write(&mut self, packet: AudioPacket, converter: &mut Converter) -> SinkResult<()>`
///
/// `AudioPacket` has two variants:
///   - `AudioPacket::Samples(Vec<f64>)` — decoded float samples
///   - `AudioPacket::Raw(Vec<u8>)` — raw bytes
///
/// The `Converter` has methods like `f64_to_f32(&self, &[f64]) -> Vec<f32>` etc.
struct AppAudioSink {
    packet_sender: mpsc::Sender<PcmPacket>,
    channels: u16,
    sample_rate: u32,
}

impl audio_backend::Sink for AppAudioSink {
    fn start(&mut self) -> SinkResult<()> {
        Ok(())
    }

    fn stop(&mut self) -> SinkResult<()> {
        Ok(())
    }

    fn write(&mut self, packet: AudioPacket, converter: &mut Converter) -> SinkResult<()> {
        match packet {
            AudioPacket::Samples(samples) => {
                // Convert f64→f32 using the library converter, then reinterpret
                // the float data as raw little-endian bytes without an extra copy.
                let float_data: Vec<f32> = converter.f64_to_f32(&samples);
                let byte_len = float_data.len() * 4;
                let (ptr, len, cap) = (
                    float_data.as_ptr() as *mut u8,
                    float_data.len(),
                    float_data.capacity(),
                );
                std::mem::forget(float_data);
                let bytes: Vec<u8> = unsafe { Vec::from_raw_parts(ptr, byte_len, cap * 4) };

                let packet = PcmPacket {
                    data: bytes,
                    sample_rate: self.sample_rate,
                    channels: self.channels,
                };
                let _ = self.packet_sender.send(packet);
            }
            AudioPacket::Raw(data) => {
                // Raw bytes — forward directly.
                let packet = PcmPacket {
                    data,
                    sample_rate: self.sample_rate,
                    channels: self.channels,
                };
                let _ = self.packet_sender.send(packet);
            }
        }
        Ok(())
    }
}


// ─── Event emission task ─────────────────────────────────────────

/// Spawn an async task that periodically drains the PCM packet channel
/// and emits audio chunks to the frontend via Tauri events.
///
/// Uses base64-encoded raw f32 bytes instead of JSON number arrays
/// for ~2.25x smaller payloads and faster frontend decode.
fn spawn_audio_emitter(
    app: AppHandle,
    sink_rx: Arc<std::sync::Mutex<mpsc::Receiver<PcmPacket>>>,
) -> tokio::sync::oneshot::Sender<()> {
    let (shutdown_tx, mut shutdown_rx) = tokio::sync::oneshot::channel::<()>();

    tauri::async_runtime::spawn(async move {
        // Accumulate raw f32 bytes (4 bytes per sample).
        // 8820 bytes ≈ 100ms of stereo audio @ 44.1kHz (2205 frames × 2 ch × 4 bytes).
        let mut buffer: Vec<u8> = Vec::with_capacity(8820);
        let mut last_sample_rate: u32 = 44100;
        let mut last_channels: u16 = 2;

        loop {
            tokio::select! {
                _ = &mut shutdown_rx => break,
                _ = tokio::time::sleep(std::time::Duration::from_millis(100)) => {
                    // Drain as many packets as available.
                    loop {
                        let packet = {
                            let rx = match sink_rx.lock() {
                                Ok(r) => r,
                                Err(_) => return,
                            };
                            match rx.try_recv() {
                                Ok(pkt) => {
                                    last_sample_rate = pkt.sample_rate;
                                    last_channels = pkt.channels;
                                    Some(pkt)
                                }
                                Err(mpsc::TryRecvError::Empty) => None,
                                Err(mpsc::TryRecvError::Disconnected) => return,
                            }
                        };
                        match packet {
                            Some(pkt) => buffer.extend_from_slice(&pkt.data),
                            None => break,
                        }
                    }

                    if buffer.is_empty() {
                        continue;
                    }

                    // Emit a chunk when we have ~100ms of audio.
                    let chunk_samples = (last_sample_rate as usize / 10) * last_channels as usize;
                    let chunk_bytes = chunk_samples * 4; // 4 bytes per f32
                    if buffer.len() >= chunk_bytes {
                        let raw = buffer.split_off(0);
                        let b64 = STANDARD.encode(&raw);
                        let payload = AudioChunkPayload {
                            samples: b64,
                            sample_rate: last_sample_rate,
                            channels: last_channels,
                        };
                        let _ = app.emit("librespot-audio-data", &payload);
                    }
                }
            }
        }
    });

    shutdown_tx
}

#[derive(serde::Serialize, Clone)]
struct AudioChunkPayload {
    samples: String,
    sample_rate: u32,
    channels: u16,
}

// ── Session Manager ──────────────────────────────────────────────

pub struct LibrespotManager {
    session: tokio::sync::Mutex<Option<Session>>,
    player: tokio::sync::Mutex<Option<Arc<Player>>>,
    state: Arc<PlaybackStateInner>,
    shutdown_handle: tokio::sync::Mutex<Option<tokio::sync::oneshot::Sender<()>>>,
    initialized: AtomicBool,
}

impl LibrespotManager {
    pub fn new() -> Self {
        Self {
            session: tokio::sync::Mutex::new(None),
            player: tokio::sync::Mutex::new(None),
            state: Arc::new(PlaybackStateInner::new()),
            shutdown_handle: tokio::sync::Mutex::new(None),
            initialized: AtomicBool::new(false),
        }
    }

    /// Start a librespot session using the Spotify access token.
    ///
    /// Follows the official librespot v0.5.0 pattern from `examples/play.rs`:
    /// ```rust
    /// let credentials = Credentials::with_access_token(token);
    /// let session = Session::new(config, None);
    /// session.connect(credentials, false).await;
    /// ```
    pub async fn start(
        &self,
        access_token: &str,
        app: AppHandle,
    ) -> Result<(), String> {
        if self.initialized.load(Ordering::SeqCst) {
            eprintln!("[librespot] start SKIPPED — already initialised");
            return Err("Librespot is already initialised".to_string());
        }

        eprintln!("[librespot] Creating session...");

        // 1. Create credentials from the access token.
        let credentials = Credentials::with_access_token(access_token);

        // 2. Create session config and session.
        let session_config = SessionConfig::default();
        let session = Session::new(session_config, None);

        // 3. Connect to Spotify.
        eprintln!("[librespot] Session::connect() — awaiting...");
        session
            .connect(credentials, false)
            .await
            .map_err(|e| {
                eprintln!("[librespot] Session::connect() FAILED: {e}");
                format!("Librespot session error: {e}")
            })?;

        eprintln!("[librespot] Session connected.");

        *self.session.lock().await = Some(session.clone());

        // 4. Create the mpsc channel outside the closure (we need the receiver
        //    for the emitter task), and create player config.
        eprintln!("[librespot] Creating player with custom audio sink...");
        let channels = 2u16;
        let sample_rate = 44100u32;
        let (tx, rx) = mpsc::channel::<PcmPacket>();
        let sink_rx = Arc::new(std::sync::Mutex::new(rx));
        let player_config = PlayerConfig::default();

        // 5. Create the player with a factory closure that constructs the
        //    custom sink INSIDE the closure rather than capturing an existing
        //    boxed sink. This ensures the closure is `Send` (the captured
        //    `mpsc::Sender` is `Send`), matching the official pattern:
        //    `Player::new(config, session, Box::new(NoOpVolume), move || { Box::new(...) })`
        let player = Player::new(
            player_config,
            session,
            Box::new(NoOpVolume),
            move || {
                Box::new(AppAudioSink {
                    packet_sender: tx,
                    channels,
                    sample_rate,
                })
            },
        );

        eprintln!("[librespot] Player created.");

        *self.player.lock().await = Some(player.clone());

        eprintln!("[librespot] Player stored.");

        // 7. Spawn the audio emitter task.
        let shutdown = spawn_audio_emitter(app.clone(), sink_rx);
        *self.shutdown_handle.lock().await = Some(shutdown);

        eprintln!("[librespot] Audio emitter spawned.");

        // 8. Spawn a state polling loop.
        let state_clone = self.state.clone();
        tauri::async_runtime::spawn(async move {
            loop {
                tokio::time::sleep(std::time::Duration::from_millis(250)).await;
                let payload = PlaybackStatePayload {
                    is_playing: state_clone.is_playing.load(Ordering::SeqCst),
                    position_ms: state_clone.position_ms.load(Ordering::SeqCst),
                    duration_ms: state_clone.duration_ms.load(Ordering::SeqCst),
                    volume: state_clone.volume_scaled.load(Ordering::SeqCst) as f64 / 10000.0,
                };
                let _ = app.emit("librespot-state-changed", &payload);
            }
        });

        self.initialized.store(true, Ordering::SeqCst);
        eprintln!("[librespot] Player ready.");
        Ok(())
    }

    /// Stop the librespot session and clean up.
    pub async fn stop(&self) {
        if let Some(shutdown) = self.shutdown_handle.lock().await.take() {
            let _ = shutdown.send(());
        }

        if let Some(player) = self.player.lock().await.take() {
            drop(player);
        }

        if let Some(session) = self.session.lock().await.take() {
            drop(session);
        }

        self.initialized.store(false, Ordering::SeqCst);
    }

    /// Play a Spotify track by URI (e.g. `spotify:track:4iV5W9uYEdYUVa79Axb7Rh`).
    ///
    /// Follows the official pattern from `examples/play.rs`:
    /// ```rust
    /// let mut id = SpotifyId::from_base62(&base62_str).unwrap();
    /// id.item_type = SpotifyItemType::Track;
    /// player.load(id, true, 0);
    /// ```
    pub async fn play(&self, uri: &str) -> Result<(), String> {
        eprintln!("[librespot] Play requested: {uri}");

        let player_guard = self.player.lock().await;
        let player_exists = player_guard.is_some();
        eprintln!("[librespot] Player exists = {player_exists}");

        let player = player_guard
            .as_ref()
            .ok_or("Librespot player not initialised")?
            .clone();

        // Parse the Spotify URI to extract the base62 ID and item type.
        let parts: Vec<&str> = uri.split(':').collect();
        if parts.len() < 3 {
            return Err(format!("Invalid Spotify URI: '{uri}'"));
        }
        let item_type_str = parts.get(1).copied().unwrap_or("track");
        let id_str = parts.get(2).copied().ok_or_else(|| format!("No ID in URI: '{uri}'"))?;

        let item_type = match item_type_str {
            "track" => SpotifyItemType::Track,
            "album" => SpotifyItemType::Album,
            "playlist" => SpotifyItemType::Playlist,
            "artist" => SpotifyItemType::Artist,
            "episode" => SpotifyItemType::Episode,
            _ => SpotifyItemType::Track,
        };

        let mut spotify_id = SpotifyId::from_base62(id_str)
            .map_err(|e| format!("Invalid Spotify ID '{id_str}': {e}"))?;
        spotify_id.item_type = item_type;

        // Load the track into the player.
        player.load(spotify_id, true, 0);

        // Update state.
        self.state.is_playing.store(true, Ordering::SeqCst);
        self.state.position_ms.store(0, Ordering::SeqCst);

        Ok(())
    }

    pub async fn pause(&self) -> Result<(), String> {
        let player_guard = self.player.lock().await;
        if let Some(player) = player_guard.as_ref() {
            player.pause();
            self.state.is_playing.store(false, Ordering::SeqCst);
            Ok(())
        } else {
            Err("Librespot player not initialised".to_string())
        }
    }

    pub async fn resume(&self) -> Result<(), String> {
        let player_guard = self.player.lock().await;
        if let Some(player) = player_guard.as_ref() {
            player.play();
            self.state.is_playing.store(true, Ordering::SeqCst);
            Ok(())
        } else {
            Err("Librespot player not initialised".to_string())
        }
    }

    pub async fn seek(&self, position_ms: u64) -> Result<(), String> {
        let player_guard = self.player.lock().await;
        if let Some(player) = player_guard.as_ref() {
            player.seek(position_ms as u32);
            self.state.position_ms.store(position_ms, Ordering::SeqCst);
            Ok(())
        } else {
            Err("Librespot player not initialised".to_string())
        }
    }

    pub async fn set_volume(&self, volume: f64) -> Result<(), String> {
        let volume = volume.clamp(0.0, 1.0);
        let scaled = (volume * 10000.0) as u64;
        self.state.volume_scaled.store(scaled, Ordering::SeqCst);
        Ok(())
    }

    pub fn get_state(&self) -> PlaybackStatePayload {
        PlaybackStatePayload {
            is_playing: self.state.is_playing.load(Ordering::SeqCst),
            position_ms: self.state.position_ms.load(Ordering::SeqCst),
            duration_ms: self.state.duration_ms.load(Ordering::SeqCst),
            volume: self.state.volume_scaled.load(Ordering::SeqCst) as f64 / 10000.0,
        }
    }

    pub fn is_initialised(&self) -> bool {
        self.initialized.load(Ordering::SeqCst)
    }
}

// ── Serialisable Payloads ────────────────────────────────────────

#[derive(serde::Serialize, Clone, Debug)]
pub struct PlaybackStatePayload {
    pub is_playing: bool,
    pub position_ms: u64,
    pub duration_ms: u64,
    pub volume: f64,
}

// ── Version helper ───────────────────────────────────────────────

/// Returns a descriptive librespot version string.
pub fn librespot_version() -> String {
    format!("embedded (app v{})", env!("CARGO_PKG_VERSION"))
}

// ── Data directory ───────────────────────────────────────────────

fn dirs_data() -> Option<std::path::PathBuf> {
    #[cfg(target_os = "windows")]
    {
        std::env::var("APPDATA")
            .ok()
            .map(|p| std::path::PathBuf::from(p).join("Chiptune8BitPlayer"))
    }
    #[cfg(target_os = "macos")]
    {
        std::env::var("HOME").ok().map(|p| {
            std::path::PathBuf::from(p).join("Library/Application Support/Chiptune8BitPlayer")
        })
    }
    #[cfg(target_os = "linux")]
    {
        std::env::var("XDG_DATA_HOME")
            .ok()
            .map(|p| std::path::PathBuf::from(p).join("Chiptune8BitPlayer"))
            .or_else(|| {
                std::env::var("HOME")
                    .ok()
                    .map(|p| std::path::PathBuf::from(p).join(".local/share/Chiptune8BitPlayer"))
            })
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        None
    }
}
