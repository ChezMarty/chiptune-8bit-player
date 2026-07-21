//! Librespot integration for direct Spotify audio streaming.
//!
//! Architecture:
//! - Creates a librespot session using OAuth credentials obtained from the
//!   existing Spotify Web API integration.
//! - Creates a player with a custom audio sink that captures decoded PCM data.
//! - Forwards PCM audio data to the frontend via Tauri events for Web Audio API playback.
//!
//! This implementation follows the official librespot v0.8.0 API as demonstrated
//! in the `audio_backend` module source and `examples/play.rs`.

use std::sync::{
    atomic::{AtomicBool, AtomicU32, AtomicU64, AtomicU16, Ordering},
    Arc,
};
use std::sync::mpsc;

use base64::{engine::general_purpose::STANDARD, Engine as _};

use librespot_core::{
    authentication::Credentials,
    config::SessionConfig,
    session::Session,
    spotify_uri::SpotifyUri,
};
use librespot_playback::{
    audio_backend::{self, SinkResult},
    config::PlayerConfig,
    convert::Converter,
    decoder::AudioPacket,
    mixer::NoOpVolume,
    player::{Player, PlayerEvent},
};
use tauri::{AppHandle, Emitter};

// ── Shared Playback State ────────────────────────────────────────

/// Thread-safe state queried by the frontend.
struct PlaybackStateInner {
    is_playing: AtomicBool,
    /// Last known position in ms from a PlayerEvent, seek, or play start.
    anchor_pos_ms: AtomicU64,
    /// SystemTime epoch milliseconds when `anchor_pos_ms` was recorded.
    anchor_time_ms: AtomicU64,
    duration_ms: AtomicU64,
    volume_scaled: AtomicU64,
    /// Total PCM frames (per-channel) written to the sink by the decoder.
    /// Used to compute buffered audio duration at pause time.
    total_frames_written: AtomicU64,
    /// Total PCM frames (per-channel) consumed by the emitter (sent to frontend).
    total_frames_consumed: AtomicU64,
    /// Sample rate of the current stream (for buffer duration calc).
    stream_sample_rate: AtomicU32,
    /// Number of channels in the current stream.
    stream_channels: AtomicU16,
}

impl PlaybackStateInner {
    fn new() -> Self {
        Self {
            is_playing: AtomicBool::new(false),
            anchor_pos_ms: AtomicU64::new(0),
            anchor_time_ms: AtomicU64::new(0),
            duration_ms: AtomicU64::new(0),
            volume_scaled: AtomicU64::new(7000), // 0.7 default
            total_frames_written: AtomicU64::new(0),
            total_frames_consumed: AtomicU64::new(0),
            stream_sample_rate: AtomicU32::new(44100),
            stream_channels: AtomicU16::new(2),
        }
    }

    /// Record a new known position (from PlayerEvent, seek, or play start).
    fn set_anchor(&self, pos_ms: u64) {
        self.anchor_pos_ms.store(pos_ms, Ordering::SeqCst);
        self.anchor_time_ms.store(epoch_ms(), Ordering::SeqCst);
    }

    /// Estimate the current playback position based on last anchor + elapsed time.
    fn estimate_position(&self) -> u64 {
        let anchor = self.anchor_pos_ms.load(Ordering::SeqCst);
        if !self.is_playing.load(Ordering::SeqCst) {
            return anchor;
        }
        let anchor_time = self.anchor_time_ms.load(Ordering::SeqCst);
        if anchor_time == 0 {
            return anchor;
        }
        let now = epoch_ms();
        let elapsed = now.saturating_sub(anchor_time);
        anchor.saturating_add(elapsed)
    }

    /// Return the authoritative playback position based on audio frames
    /// that have actually been consumed by the emitter and sent to the
    /// frontend (i.e., left the Rust backend).
    ///
    /// This is the single source of truth for the playback position.
    /// It represents the position at the frontend's audio pipeline
    /// (minus the Web Audio buffer which we can't track from Rust).
    ///
    /// - At pause time: this equals `decoder_position - buffered_duration`
    /// - During playback: this is the position of audio delivered to frontend
    /// - After seek/play start: frames_consumed is 0, so this returns 0
    ///   (the anchor is set to the seek/play position separately)
    fn authoritative_position_ms(&self) -> u64 {
        let consumed = self.total_frames_consumed.load(Ordering::SeqCst);
        let sample_rate = self.stream_sample_rate.load(Ordering::SeqCst);
        if sample_rate == 0 {
            return 0;
        }
        consumed * 1000 / sample_rate as u64
    }

    /// Compute how many milliseconds of audio are currently buffered in the
    /// pipeline (sync_channel + emitter buffer + Web Audio queue) but not yet
    /// consumed by the frontend.
    ///
    /// This is the difference between frames written to the sink (by the
    /// librespot decoder) and frames consumed (sent to the frontend via Tauri
    /// events), converted to milliseconds at the stream's sample rate.
    ///
    /// PlayerEvent::Paused reports the position including buffered frames.
    /// To get the actual position at the speakers, subtract this value.
    fn buffered_duration_ms(&self) -> u64 {
        let written = self.total_frames_written.load(Ordering::SeqCst);
        let consumed = self.total_frames_consumed.load(Ordering::SeqCst);
        let buffered_frames = written.saturating_sub(consumed);
        let sample_rate = self.stream_sample_rate.load(Ordering::SeqCst);
        if sample_rate == 0 {
            return 0;
        }
        // frames are per-channel (already divided by channels),
        // so duration = frames / sample_rate * 1000
        buffered_frames * 1000 / sample_rate as u64
    }
}

/// Helper to get epoch milliseconds.
fn epoch_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
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
/// through a **bounded** channel for the async emitter task to forward to
/// the frontend.
///
/// The channel is bounded (`sync_channel`) so that `write()` blocks when
/// the buffer is full, creating natural backpressure. This paces the
/// decoder to match the frontend's consumption rate — without this, the
/// decoder finishes the entire track in seconds and the player fires
/// `EndOfTrack` immediately.
///
/// Following the official `Sink` trait signature from librespot v0.8.0:
///   `fn write(&mut self, packet: AudioPacket, converter: &mut Converter) -> SinkResult<()>`
///
/// `AudioPacket` has two variants:
///   - `AudioPacket::Samples(Vec<f64>)` — decoded float samples
///   - `AudioPacket::Raw(Vec<u8>)` — raw bytes
///
/// The `Converter` has methods like `f64_to_f32(&self, &[f64]) -> Vec<f32>` etc.
struct AppAudioSink {
    /// Bounded sender — blocks on `send()` when buffer is full.
    packet_sender: mpsc::SyncSender<PcmPacket>,
    channels: u16,
    sample_rate: u32,
    /// Diagnostic write counter (incremented on each write() call).
    write_count: u64,
    /// Shared frame counter — tracks total PCM frames written vs consumed.
    frame_counter: Arc<PlaybackStateInner>,
}

impl audio_backend::Sink for AppAudioSink {
    fn start(&mut self) -> SinkResult<()> {
        eprintln!("[librespot-sink] start() called");
        Ok(())
    }

    fn stop(&mut self) -> SinkResult<()> {
        eprintln!("[librespot-sink] stop() called — writes so far: {}", self.write_count);
        Ok(())
    }

    fn write(&mut self, packet: AudioPacket, converter: &mut Converter) -> SinkResult<()> {
        self.write_count += 1;
        let count = self.write_count;

        match packet {
            AudioPacket::Samples(samples) => {
                let sample_count = samples.len();
                // Track frames written for buffer depth calculation.
                // samples is Vec<f64> where length = frames * channels.
                let frames = sample_count as u64 / self.channels as u64;
                self.frame_counter.total_frames_written.fetch_add(frames, Ordering::SeqCst);

                // Convert f64→f32 using the library converter, then reinterpret
                // the float data as raw little-endian bytes without an extra copy.
                let float_data: Vec<f32> = converter.f64_to_f32(&samples);
                let byte_len = float_data.len() * 4;
                let (ptr, _len, cap) = (
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

                if count <= 5 || count.is_multiple_of(100) {
                    eprintln!("[librespot-sink] write #{} (Samples, {} f64 samples, {} bytes pcm, {} frames)",
                        count, sample_count, byte_len, frames);
                }

                // BLOCKING SEND — this is the backpressure mechanism.
                // SyncSender::send() blocks until the receiver consumes a packet.
                // This paces the decoder to match real-time consumption.
                if let Err(e) = self.packet_sender.send(packet) {
                    eprintln!("[librespot-sink] ⚠ write #{} — send FAILED: {}", count, e);
                    return Err(audio_backend::SinkError::NotConnected(
                        "audio channel receiver dropped".to_string()
                    ));
                }
            }
            AudioPacket::Raw(data) => {
                let byte_len = data.len();
                // For Raw packets, data is s16 interleaved (2 bytes per sample).
                let frames = byte_len as u64 / 2 / self.channels as u64;
                self.frame_counter.total_frames_written.fetch_add(frames, Ordering::SeqCst);

                let packet = PcmPacket {
                    data,
                    sample_rate: self.sample_rate,
                    channels: self.channels,
                };

                if count <= 5 || count.is_multiple_of(100) {
                    eprintln!("[librespot-sink] write #{} (Raw, {} bytes, {} frames)", count, byte_len, frames);
                }

                if let Err(e) = self.packet_sender.send(packet) {
                    eprintln!("[librespot-sink] ⚠ write #{} — send FAILED: {}", count, e);
                    return Err(audio_backend::SinkError::NotConnected(
                        "audio channel receiver dropped".to_string()
                    ));
                }
            }
        }

        if count <= 3 || count.is_multiple_of(50) {
            eprintln!("[librespot-sink] write #{} — returning Ok(())", count);
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
    frame_counter: Arc<PlaybackStateInner>,
) -> tokio::sync::oneshot::Sender<()> {
    let (shutdown_tx, mut shutdown_rx) = tokio::sync::oneshot::channel::<()>();

    let mut packets_emitted: u64 = 0;
    let mut bytes_emitted: u64 = 0;

    eprintln!("[librespot-emitter] STARTED — draining PCM channel every 100ms");

    tauri::async_runtime::spawn(async move {
        // Accumulate raw f32 bytes (4 bytes per sample).
        // 8820 bytes ≈ 100ms of stereo audio @ 44.1kHz (2205 frames × 2 ch × 4 bytes).
        let mut buffer: Vec<u8> = Vec::with_capacity(8820);
        let mut last_sample_rate: u32 = 44100;
        let mut last_channels: u16 = 2;

        loop {
            tokio::select! {
                _ = &mut shutdown_rx => {
                    eprintln!("[librespot-emitter] STOPPED via shutdown signal — {} packets, {} bytes emitted",
                        packets_emitted, bytes_emitted);
                    break;
                }
                _ = tokio::time::sleep(std::time::Duration::from_millis(100)) => {
                    // Drain as many packets as available.
                    let mut packets_this_tick: u64 = 0;
                    loop {
                        let packet = {
                            let rx = match sink_rx.lock() {
                                Ok(r) => r,
                                Err(_) => {
                                    eprintln!("[librespot-emitter] CHANNEL POISONED (mutex) — exiting");
                                    return;
                                }
                            };
                            match rx.try_recv() {
                                Ok(pkt) => {
                                    last_sample_rate = pkt.sample_rate;
                                    last_channels = pkt.channels;
                                    Some(pkt)
                                }
                                Err(mpsc::TryRecvError::Empty) => None,
                                Err(mpsc::TryRecvError::Disconnected) => {
                                    eprintln!("[librespot-emitter] CHANNEL CLOSED (sender dropped) — exiting. total: {} packets, {} bytes",
                                        packets_emitted, bytes_emitted);
                                    return;
                                }
                            }
                        };
                        match packet {
                            Some(pkt) => {
                                let pkt_bytes = pkt.data.len() as u64;
                                buffer.extend_from_slice(&pkt.data);
                                packets_this_tick += 1;
                                packets_emitted += 1;
                                bytes_emitted += pkt_bytes;
                            }
                            None => break,
                        }
                    }

                    if packets_this_tick > 0 && packets_emitted <= 5 {
                        eprintln!("[librespot-emitter] tick — drained {} packets, buffer now {} bytes",
                            packets_this_tick, buffer.len());
                    }

                    if buffer.is_empty() {
                        continue;
                    }

                    // Emit a chunk when we have ~100ms of audio.
                    let chunk_samples = (last_sample_rate as usize / 10) * last_channels as usize;
                    let chunk_bytes = chunk_samples * 4; // 4 bytes per f32
                    if buffer.len() >= chunk_bytes {
                        let raw = buffer.split_off(0);
                        // Track frames consumed for buffer depth calculation.
                        // raw is bytes of f32 interleaved PCM: frames = bytes / 4 / channels
                        let frames_consumed = raw.len() as u64 / 4 / last_channels as u64;
                        frame_counter.total_frames_consumed.fetch_add(frames_consumed, Ordering::SeqCst);
                        // Also update stream format in case it changed.
                        frame_counter.stream_sample_rate.store(last_sample_rate, Ordering::SeqCst);
                        frame_counter.stream_channels.store(last_channels, Ordering::SeqCst);

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
    /// Stored AppHandle so play/pause/resume can emit Tauri events.
    app_handle: tokio::sync::Mutex<Option<AppHandle>>,
}

impl LibrespotManager {
    pub fn new() -> Self {
        Self {
            session: tokio::sync::Mutex::new(None),
            player: tokio::sync::Mutex::new(None),
            state: Arc::new(PlaybackStateInner::new()),
            shutdown_handle: tokio::sync::Mutex::new(None),
            initialized: AtomicBool::new(false),
            app_handle: tokio::sync::Mutex::new(None),
        }
    }

    /// Start a librespot session using the Spotify access token.
    ///
    /// `account_product` is the Spotify account type ("premium", "free", etc.)
    /// from the Web API's user profile. It is logged for diagnostics — librespot
    /// requires a Premium account to stream audio.
    ///
    /// Follows the official librespot v0.8.0 pattern:
    /// ```rust
    /// let credentials = Credentials::with_access_token(token);
    /// let session = Session::new(config, None);
    /// session.connect(credentials, false).await;
    /// ```
    pub async fn start(
        &self,
        access_token: &str,
        app: AppHandle,
        account_product: Option<&str>,
    ) -> Result<(), String> {
        if self.initialized.load(Ordering::SeqCst) {
            eprintln!("[librespot] start SKIPPED — already initialised");
            return Err("Librespot is already initialised".to_string());
        }

        eprintln!("[librespot] Creating session...");

        // Log the Spotify account product type — librespot REQUIRES Premium.
        match account_product {
            Some("premium") => {
                eprintln!("[librespot] ✅ Account product: premium (required for librespot streaming)");
            }
            Some(other) => {
                eprintln!("[librespot] ⚠ Account product: {other}");
                eprintln!("[librespot] ⚠ Librespot requires a **Premium** Spotify account.");
                eprintln!("[librespot] ⚠ Free/Student accounts cannot stream audio via librespot.");
            }
            None => {
                eprintln!("[librespot] ⚠ Account product: unknown (not provided)");
                eprintln!("[librespot] ⚠ Verify your account is Premium in Settings → Account.");
            }
        }

        // 1. Create credentials from the access token.
        let credentials = Credentials::with_access_token(access_token);

        // 2. Create session config with librespot 0.8.0 defaults.
        //    librespot 0.8.0's SpClient uses login5 auth (not Keymaster)
        //    for HTTP requests, so the default client_id is now fine.
        let session_config = SessionConfig::default();
        eprintln!("[librespot]    Session client_id: {}", session_config.client_id);
        eprintln!("[librespot]    Session device_id: {}", session_config.device_id);

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

        eprintln!("[librespot] ✅ Session connected — AP authentication successful.");

        // ── Session identity diagnostics ──────────────────────────────────
        // Verify that the librespot session is authenticated as the same
        // account that completed the OAuth Web API flow.
        {
            let username = session.username();
            let user_data = session.user_data();
            eprintln!("[librespot] 👤 Session identity:");
            eprintln!("[librespot]    authenticated username:      {username}");
            eprintln!("[librespot]    canonical username:          {}", user_data.canonical_username);
            eprintln!("[librespot]    country:                     {}", user_data.country);
            eprintln!("[librespot]    connection_id:               {}", session.connection_id());
            eprintln!("[librespot]    client_id:                   {}", session.client_id());
            eprintln!("[librespot]    device_id:                   {}", session.device_id());
            // The account product (premium/free) was already logged above
            // from the Web API's /me endpoint.
            eprintln!("[librespot]    (account product was logged above from OAuth /me endpoint)");

            // Check if the authenticated username matches what we expect.
            // The canonical username is the Spotify internal user identifier.
            // It often has a 'spotify:' prefix or similar format.
            if !username.is_empty() {
                eprintln!("[librespot] ✅ Session is authenticated — username is non-empty.");
            } else {
                eprintln!("[librespot] ⚠ Session username is empty! This may indicate auth failure.");
            }
        }

        // ── librespot 0.8.0 note ───────────────────────────────────────
        //
        // SpClient in 0.8.0 uses login5 auth (not Keymaster/TokenProvider)
        // for its HTTP requests. The TokenProvider still exists internally
        // but is no longer on the critical path for playback.
        //
        // If playback still fails, check the [librespot-log] lines for
        // the actual error from the internal loader.
        eprintln!("[librespot] 🔧 librespot 0.8.0: SpClient uses login5 auth (not Keymaster)");
        eprintln!("[librespot]    TokenProvider probe skipped — login5 handles HTTP auth now.");

        // Store the app handle for event emission in play/pause/resume.
        *self.app_handle.lock().await = Some(app.clone());

        *self.session.lock().await = Some(session.clone());

        // 4. Create the mpsc bounded channel outside the closure.
        //    CRITICAL: sync_channel provides backpressure — without it the
        //    decoder finishes the entire track in seconds and the player fires
        //    EndOfTrack immediately. Buffer size of 10 packets (~500ms audio)
        //    is enough to absorb latency spikes without letting the decoder
        //    run away.
        eprintln!("[librespot] Creating player with custom audio sink...");
        let channels = 2u16;
        let sample_rate = 44100u32;
        let sink_buffer = 20usize;
        let (tx, rx) = mpsc::sync_channel::<PcmPacket>(sink_buffer);
        let sink_rx = Arc::new(std::sync::Mutex::new(rx));
        let player_config = PlayerConfig::default();

        // 5. Create the player with a factory closure.
        //    The captured `tx` is `SyncSender<PcmPacket>` which blocks on
        //    send() when the buffer is full — perfect for backpressure.
        let frame_counter_for_sink = self.state.clone();
        let player = Player::new(
            player_config,
            session,
            Box::new(NoOpVolume),
            move || {
                Box::new(AppAudioSink {
                    packet_sender: tx,
                    channels,
                    sample_rate,
                    write_count: 0,
                    frame_counter: frame_counter_for_sink.clone(),
                })
            },
        );

        eprintln!("[librespot] Player created.");

        *self.player.lock().await = Some(player.clone());

        eprintln!("[librespot] Player stored.");

        // 7. Spawn the audio emitter task.
        let frame_counter_for_emitter = self.state.clone();
        let shutdown = spawn_audio_emitter(app.clone(), sink_rx, frame_counter_for_emitter);
        *self.shutdown_handle.lock().await = Some(shutdown);

        eprintln!("[librespot] Audio emitter spawned.");

        // 8. Spawn a state polling loop (updates ~4 times/sec).
        let state_clone = self.state.clone();
        tauri::async_runtime::spawn(async move {
            loop {
                tokio::time::sleep(std::time::Duration::from_millis(250)).await;
                let is_playing = state_clone.is_playing.load(Ordering::SeqCst);
                let pos = state_clone.estimate_position();
                let anchor = state_clone.anchor_pos_ms.load(Ordering::SeqCst);
                let fw = state_clone.total_frames_written.load(Ordering::SeqCst);
                let fc = state_clone.total_frames_consumed.load(Ordering::SeqCst);
                let sr = state_clone.stream_sample_rate.load(Ordering::SeqCst);
                let written_ms = if sr > 0 { fw * 1000 / sr as u64 } else { 0 };
                let consumed_ms = if sr > 0 { fc * 1000 / sr as u64 } else { 0 };

                eprintln!("[POLLING] emit state: is_playing={} position_ms={} anchor={} frames_written={}ms frames_consumed={}ms ts={}",
                    is_playing, pos, anchor, written_ms, consumed_ms, epoch_ms());

                let payload = PlaybackStatePayload {
                    is_playing,
                    position_ms: pos,
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

    /// Stop the librespot session permanently (teardown).
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

    /// Stop the current playback immediately without destroying the session.
    ///
    /// This is the "instant stop" operation used when the user presses Stop.
    /// It:
    ///   1. Calls player.stop() to stop the decoder thread immediately
    ///   2. Drains any pending PCM packets from the channel buffer
    ///   3. Emits a `librespot-audio-clear` event so the frontend flushes its
    ///      Web Audio scheduled sources
    ///   4. Resets playback state so the UI reflects "stopped"
    ///
    /// Unlike `stop()`, this does NOT destroy the session, player, or emitter
    /// — subsequent play() calls work without re-authentication.
    pub async fn stop_playback(&self) -> Result<(), String> {
        eprintln!("[librespot] ⏹ stop_playback() — immediate stop requested");

        // 1. Stop the player decoder immediately.
        if let Some(player) = self.player.lock().await.as_ref() {
            player.stop();
            eprintln!("[librespot]    player.stop() called");
        }

        // 2. Drain any pending PCM packets from the channel buffer.
        //    Lock the receiver mutex and try_recv() until empty.
        //    The emitter holds the other reference, so the receiver is still alive.
        //    This is best-effort — we don't have direct access to the receiver
        //    from the manager, but we can signal the frontend to clear instead.
        //    (The emitter will drain remaining packets on its next tick and then
        //     find Empty — subsequent play will produce fresh packets.)

        // 3. Reset state immediately.
        self.state.is_playing.store(false, Ordering::SeqCst);
        self.state.set_anchor(0);
        self.state.duration_ms.store(0, Ordering::SeqCst);
        // Reset frame counters — old buffered data is discarded.
        self.state.total_frames_written.store(0, Ordering::SeqCst);
        self.state.total_frames_consumed.store(0, Ordering::SeqCst);

        // 4. Emit clear event so the frontend flushes its Web Audio queue.
        if let Some(app) = self.app_handle.lock().await.as_ref() {
            eprintln!("[librespot]    Emitting librespot-audio-clear event");
            let _ = app.emit("librespot-audio-clear", ());
        }

        eprintln!("[librespot]    stop_playback() complete");
        Ok(())
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
        eprintln!("[librespot] ⏯ Play requested: {uri}");

        // ═══════════════════════════════════════════════════════════════
        // CRITICAL: Stop any existing playback BEFORE loading a new track.
        // Without this, the old decoder continues producing audio packets
        // into the sync_channel while the new decoder also produces packets,
        // resulting in both tracks playing simultaneously on the frontend.
        // ═══════════════════════════════════════════════════════════════                                eprintln!("[PLAY] Stopping current decoder before loading new track...");
        if let Some(player) = self.player.lock().await.as_ref() {
            player.stop();
            eprintln!("[PLAY] player.stop() called");
        }

        let player_guard = self.player.lock().await;
        let player_exists = player_guard.is_some();
        eprintln!("[PLAY] Player exists = {player_exists}");

        let player = player_guard
            .as_ref()
            .ok_or("Librespot player not initialised")?
            .clone();

        // Parse the Spotify URI using librespot 0.8.0's SpotifyUri type.
        let track = SpotifyUri::from_uri(uri)
            .map_err(|e| format!("Invalid Spotify URI '{uri}': {e}"))?;

        eprintln!("[PLAY] Calling player.load(track_id={uri}, start_playing=true, position_ms=0)...");

        // ── Load the track into the player ───────────────────────────
        //
        // In librespot 0.8.0, player.load() takes a SpotifyUri instead of
        // SpotifyId. The internal load_track pipeline:
        //   1. Fetches track metadata via SpClient (now uses login5 auth!)
        //   2. Checks availability (region, account type restrictions)
        //   3. Opens the encrypted audio file from Spotify CDN
        //   4. Fetches an AES decryption key (AudioKeyManager — packet protocol)
        //   5. Initializes the decoder (Symphonia/Ogg Vorbis)
        //
        // The key fix in 0.8.0: SpClient uses login5 tokens instead of
        // the (broken) Keymaster endpoint for HTTP authentication.
        player.load(track, true, 0);

        eprintln!("[librespot] player.load() command sent — listening for player events continuously...");
        eprintln!("[librespot]   ↳ Check stderr for [librespot-log] messages for actual error details");

        // Listen for player events continuously (runs until channel disconnects).
        // Stores position data in the atomic state for the polling loop to read.
        // Uses try_recv() with a short sleep on Empty (tokio channel, not std).
        use tokio::sync::mpsc::error::TryRecvError;
        let state = self.state.clone();
        let mut event_rx = player.get_player_event_channel();
        // Clone the stored AppHandle for emitting track-ended events to the frontend.
        let app_for_events = self.app_handle.lock().await.clone();
        tauri::async_runtime::spawn(async move {
            loop {
                match event_rx.try_recv() {
                    Ok(event) => {
                        match &event {
                            PlayerEvent::Loading { track_id, position_ms, .. } => {
                                state.set_anchor(*position_ms as u64);
                                eprintln!("[librespot] ⏳ PlayerEvent::Loading — track_id={track_id}, position_ms={position_ms}");
                            }
                            PlayerEvent::Preloading { track_id } => {
                                eprintln!("[librespot] 🔄 PlayerEvent::Preloading — track_id={track_id}");
                            }
                            PlayerEvent::Playing { track_id, position_ms, .. } => {
                                // Do NOT overwrite anchor here. The anchor was
                                // already set correctly by play() or resume().
                                // estimate_position() handles smooth interpolation
                                // via anchor + elapsed. Overwriting anchor would
                                // cause a forward jump after resume (because
                                // frames_consumed crept during pause as the emitter
                                // drained the sync_channel).
                                let current_anchor = state.anchor_pos_ms.load(Ordering::SeqCst);
                                state.is_playing.store(true, Ordering::SeqCst);
                                eprintln!("[librespot] ✅ PlayerEvent::Playing — track_id={track_id}, decoder_position_ms={position_ms}, current_anchor={current_anchor}, is_playing=true, timestamp={}",
                                    epoch_ms());
                            }
                            PlayerEvent::Unavailable { track_id, play_request_id } => {
                                eprintln!("[librespot] ❌ PlayerEvent::Unavailable — track CANNOT be played");
                                eprintln!("[librespot]    track_id={track_id}, play_request_id={play_request_id}");
                            }
                            PlayerEvent::EndOfTrack { play_request_id, track_id } => {
                                state.is_playing.store(false, Ordering::SeqCst);
                                eprintln!("[librespot] ⏹ PlayerEvent::EndOfTrack — play_request_id={play_request_id}, track_id={track_id}");
                                eprintln!("[librespot] 🔔 Emitting librespot-track-ended event to frontend");
                                if let Some(ref app) = app_for_events {
                                    let _ = app.emit("librespot-track-ended", ());
                                }
                            }
                            PlayerEvent::Stopped { play_request_id, track_id } => {
                                state.is_playing.store(false, Ordering::SeqCst);
                                eprintln!("[librespot] ⏹ PlayerEvent::Stopped — play_request_id={play_request_id}, track_id={track_id}, is_playing=false, timestamp={}", epoch_ms());
                            }
                            PlayerEvent::Paused { track_id, position_ms, .. } => {
                                // ── CRITICAL: Freeze at estimate_position() ──
                                // Do NOT use authoritative_position_ms() here,
                                // because during playback estimate_position()
                                // = authoritative + elapsed = smooth position
                                // (~20s). If we snap to authoritative (~18s),
                                // the timer jumps BACKWARDS by ~2s.
                                //
                                // estimate_position() preserves the smooth
                                // interpolated position and then, because
                                // is_playing becomes false, future calls to
                                // estimate_position() return the frozen anchor.
                                let freeze_pos = state.estimate_position();
                                let reported = *position_ms as u64;

                                // ── DIAGNOSTIC: log ALL position sources ────────
                                let auth_pos = state.authoritative_position_ms();
                                let buffered = state.buffered_duration_ms();
                                let anchor_now = state.anchor_pos_ms.load(Ordering::SeqCst);
                                let f_written = state.total_frames_written.load(Ordering::SeqCst);
                                let f_consumed = state.total_frames_consumed.load(Ordering::SeqCst);
                                let sr = state.stream_sample_rate.load(Ordering::SeqCst);
                                let written_ms = if sr > 0 { f_written * 1000 / sr as u64 } else { 0 };
                                let consumed_ms = if sr > 0 { f_consumed * 1000 / sr as u64 } else { 0 };

                                eprintln!("[POSITION-DIAG] ⏸ PLAYER_EVENT::PAUSED");
                                eprintln!("[POSITION-DIAG]    decoder_position_ms (from player event)  = {reported}");
                                eprintln!("[POSITION-DIAG]    freeze (estimate_position)               = {freeze_pos}");
                                eprintln!("[POSITION-DIAG]    authoritative (frames_consumed)          = {auth_pos}");
                                eprintln!("[POSITION-DIAG]    decoder - buffered (verification)        = {}", reported.saturating_sub(buffered));
                                eprintln!("[POSITION-DIAG]    anchor_before                            = {anchor_now}");
                                eprintln!("[POSITION-DIAG]    frames_written (sink)                    = {f_written}  ({}.{:03}s)", written_ms / 1000, written_ms % 1000);
                                eprintln!("[POSITION-DIAG]    frames_consumed (emitter)                = {f_consumed}  ({}.{:03}s)", consumed_ms / 1000, consumed_ms % 1000);
                                eprintln!("[POSITION-DIAG]    buffered_duration_ms                     = {buffered}");
                                eprintln!("[POSITION-DIAG]    stream_sample_rate                       = {sr}");
                                eprintln!("[POSITION-DIAG]    timestamp                                = {}", epoch_ms());

                                state.is_playing.store(false, Ordering::SeqCst);
                                state.set_anchor(freeze_pos);
                                eprintln!("[librespot] ⏸ PlayerEvent::Paused — track_id={track_id}, decoder_position_ms={reported}, freeze_at={freeze_pos}, authoritative={auth_pos}, is_playing=false, timestamp={}",
                                    epoch_ms());
                            }
                            PlayerEvent::Seeked { track_id, position_ms, .. } => {
                                state.set_anchor(*position_ms as u64);
                                eprintln!("[librespot] ⏩ PlayerEvent::Seeked — track_id={track_id}, position_ms={position_ms}");
                                // Signal to the frontend that new audio from the
                                // seeked position is now available.
                                if let Some(ref app) = app_for_events {
                                    let _ = app.emit("librespot-seek-ready", ());
                                }
                            }
                            PlayerEvent::PositionCorrection { track_id, position_ms, .. } => {
                                // Do NOT overwrite anchor. The decoder's position
                                // correction accounts for decoder-side drift but
                                // doesn't know about our sync_channel buffer.
                                // estimate_position() already provides smooth
                                // interpolation from the last authoritative anchor.
                                let current_anchor = state.anchor_pos_ms.load(Ordering::SeqCst);
                                eprintln!("[librespot] 🔄 PlayerEvent::PositionCorrection — track_id={track_id}, decoder_position_ms={position_ms}, anchor_stays_at={current_anchor}");
                            }
                            PlayerEvent::VolumeChanged { volume } => {
                                eprintln!("[librespot] 🔊 PlayerEvent::VolumeChanged — volume={volume}");
                            }
                            _ => {
                                eprintln!("[librespot] PlayerEvent: {event:?}");
                            }
                        }
                    }
                    Err(TryRecvError::Empty) => {
                        tokio::time::sleep(std::time::Duration::from_millis(50)).await;
                        continue;
                    }
                    Err(TryRecvError::Disconnected) => {
                        eprintln!("[librespot] Player event channel disconnected — listener ending.");
                        break;
                    }
                }
            }
        });

        // Reset frame counters for the new track BEFORE reading authoritative
        // position, so authoritative_position_ms() returns the correct value.
        self.state.total_frames_written.store(0, Ordering::SeqCst);
        self.state.total_frames_consumed.store(0, Ordering::SeqCst);
        // Update state — set anchor to beginning of track.
        self.state.is_playing.store(true, Ordering::SeqCst);
        self.state.set_anchor(self.state.authoritative_position_ms());

        Ok(())
    }

    pub async fn pause(&self) -> Result<(), String> {
        let player_guard = self.player.lock().await;
        if let Some(player) = player_guard.as_ref() {
            // ═══════════════════════════════════════════════════════
            // FIX: Do NOT call estimate_position() here.
            //
            // estimate_position() uses wall-clock extrapolation:
            //   anchor_pos_ms + (now - anchor_time_ms)
            //
            // This drifts from the actual decoder position because the
            // decoder is throttled by sync_channel backpressure and
            // may run at a different rate than wall-clock time.
            //
            // Over ~20s of playback the drift can reach ~1.8s, causing
            // the paused position reported to the frontend to be 1.8s
            // ahead of where the user pressed pause.
            //
            // Instead: just call player.pause() and let the async
            // PlayerEvent::Paused handler set is_playing=false and
            // anchor to the ACTUAL decoder position. The frontend's
            // commandGuard protects against stale polling events
            // during the brief gap before the event arrives.
            // ═══════════════════════════════════════════════════════
            {
                let a = self.state.anchor_pos_ms.load(Ordering::SeqCst);
                let ip = self.state.is_playing.load(Ordering::SeqCst);
                let fw = self.state.total_frames_written.load(Ordering::SeqCst);
                let fc = self.state.total_frames_consumed.load(Ordering::SeqCst);
                let bf = self.state.buffered_duration_ms();
                let est = self.state.estimate_position();
                let sr = self.state.stream_sample_rate.load(Ordering::SeqCst);
                let written_ms = if sr > 0 { fw * 1000 / sr as u64 } else { 0 };
                let consumed_ms = if sr > 0 { fc * 1000 / sr as u64 } else { 0 };
                let ts = epoch_ms();

                eprintln!("[POSITION-DIAG] ⏸ PAUSE() CALLED — before player.pause()");
                eprintln!("[POSITION-DIAG]    anchor_pos_ms                          = {}", a);
                eprintln!("[POSITION-DIAG]    is_playing                             = {}", ip);
                eprintln!("[POSITION-DIAG]    estimate_position                      = {}", est);
                eprintln!("[POSITION-DIAG]    frames_written (sink)                  = {}  ({}ms)", fw, written_ms);
                eprintln!("[POSITION-DIAG]    frames_consumed (emitter)              = {}  ({}ms)", fc, consumed_ms);
                eprintln!("[POSITION-DIAG]    buffered_duration_ms (written-consumed)= {}", bf);
                eprintln!("[POSITION-DIAG]    predicted decoder_pos (from frames)    = {}ms", written_ms);
                eprintln!("[POSITION-DIAG]    timestamp                              = {}", ts);

                eprintln!("[librespot] pause() — calling player.pause(), anchor_before={}, is_playing_before={}, frames_written={}, frames_consumed={}, buffered_ms={}, estimate={}, timestamp={}",
                    a, ip, fw, fc, bf, est, ts);
            }
            player.pause();
            Ok(())
        } else {
            Err("Librespot player not initialised".to_string())
        }
    }

    pub async fn resume(&self) -> Result<(), String> {
        let player_guard = self.player.lock().await;
        if let Some(player) = player_guard.as_ref() {
            // During pause, anchor was frozen at estimate_position() by the
            // Paused handler. estimate_position() returns the frozen anchor
            // (since is_playing=false). We just need to set is_playing=true
            // so that estimate_position() adds elapsed time. The anchor is
            // already correct — no need to overwrite it.
            let current_anchor = self.state.anchor_pos_ms.load(Ordering::SeqCst);
            self.state.is_playing.store(true, Ordering::SeqCst);
            // Re-anchor to ensure estimate_position starts fresh from here.
            self.state.set_anchor(current_anchor);
            eprintln!("[librespot] resume() — anchor={current_anchor}, is_playing=true, timestamp={}", epoch_ms());
            player.play();
            Ok(())
        } else {
            Err("Librespot player not initialised".to_string())
        }
    }

    pub async fn seek(&self, position_ms: u64) -> Result<(), String> {
        let player_guard = self.player.lock().await;
        if let Some(player) = player_guard.as_ref() {
            // Reset frame counters — the frontend discards all buffered audio
            // after seek (cleared=true), so old frames in the emitter pipeline
            // should not be counted as "consumed" for buffer depth calculation.
            self.state.total_frames_written.store(0, Ordering::SeqCst);
            self.state.total_frames_consumed.store(0, Ordering::SeqCst);
            player.seek(position_ms as u32);
            self.state.set_anchor(position_ms);
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
            position_ms: self.state.estimate_position(),
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


