//! Discord Rich Presence integration.
//!
//! All Discord IPC work (connect, set_activity, heartbeats, close) happens
//! on a dedicated background thread so it can never block the Tauri main
//! thread or the webview. The frontend pushes state changes through two
//! fire-and-forget Tauri commands (`discord_update_activity` /
//! `discord_clear_activity`); this module handles connection lifecycle,
//! lazy connect, reconnect retries and clean shutdown on app exit.
//!
//! If Discord is not running, connection attempts fail harmlessly and are
//! retried every few seconds while an activity is pending — so presence
//! appears shortly after the user launches Discord, without any polling
//! on the frontend side.

use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};
use serde::Deserialize;
use std::sync::mpsc;
use std::time::Duration;

/// Discord Application ID (Rich Presence + art assets).
///
/// Manage the application at https://discord.com/developers/applications
/// and upload these art-asset keys under **Rich Presence → Art Assets**:
///   - `chiptune_audio_lab` — large image (the © Chiptune AudioLab logo)
///   - `spotify`            — small image (Spotify source)
///   - `local_music`        — small image (local music source)
///
/// The ID can be overridden at runtime without rebuilding by setting the
/// `DISCORD_CLIENT_ID` environment variable.
pub const DISCORD_CLIENT_ID: &str = "1535407803773091947";

/// How long the worker waits between reconnect attempts while an activity
/// is pending but Discord is not reachable yet.
const RECONNECT_INTERVAL: Duration = Duration::from_secs(5);

/// A full Rich Presence activity as computed by the frontend.
#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DiscordActivityPayload {
    /// Top line of the presence (e.g. "Listening to Music").
    pub details: String,
    /// Second line (e.g. "Track — Artist — Album").
    pub state: String,
    /// Art-asset key or `mp:external/...` URL for the large image.
    pub large_image: Option<String>,
    /// Tooltip text for the large image.
    pub large_text: Option<String>,
    /// Art-asset key for the small image (`spotify` / `local_music`).
    pub small_image: Option<String>,
    /// Tooltip text for the small image.
    pub small_text: Option<String>,
    /// Unix timestamp (seconds) marking the start of playback. `None` when
    /// paused — Discord then shows no elapsed timer.
    pub start_ts: Option<i64>,
}

enum Command {
    Set(DiscordActivityPayload),
    Clear,
    Shutdown,
}

/// Handle to the Discord presence worker thread. Managed by Tauri as state.
pub struct DiscordPresence {
    tx: mpsc::Sender<Command>,
}

impl DiscordPresence {
    /// Spawn the worker thread. It does NOT connect to Discord until the
    /// first activity is set, so a missing Discord client is harmless.
    pub fn new() -> Self {
        let (tx, rx) = mpsc::channel();
        std::thread::Builder::new()
            .name("discord-presence".to_string())
            .spawn(move || worker(rx))
            .expect("failed to spawn discord presence thread");
        Self { tx }
    }

    /// Push a new activity to Discord (fire-and-forget, non-blocking).
    pub fn update(&self, payload: DiscordActivityPayload) {
        let _ = self.tx.send(Command::Set(payload));
    }

    /// Clear the current activity (e.g. Rich Presence disabled).
    pub fn clear(&self) {
        let _ = self.tx.send(Command::Clear);
    }

    /// Disconnect from Discord and stop the worker thread. Called on exit.
    pub fn shutdown(&self) {
        let _ = self.tx.send(Command::Shutdown);
    }
}

impl Default for DiscordPresence {
    fn default() -> Self {
        Self::new()
    }
}

impl Drop for DiscordPresence {
    fn drop(&mut self) {
        // Best-effort clean shutdown if `shutdown()` was never called.
        let _ = self.tx.send(Command::Shutdown);
    }
}

fn worker(rx: mpsc::Receiver<Command>) {
    // The client id can be overridden at runtime via the environment.
    let client_id = std::env::var("DISCORD_CLIENT_ID")
        .unwrap_or_else(|_| DISCORD_CLIENT_ID.to_string());
    let mut client = match DiscordIpcClient::new(&client_id) {
        Ok(c) => c,
        Err(e) => {
            eprintln!("[discord] failed to create IPC client: {e}");
            return;
        }
    };
    let mut connected = false;
    let mut pending: Option<DiscordActivityPayload> = None;

    loop {
        match rx.recv_timeout(RECONNECT_INTERVAL) {
            Ok(Command::Set(payload)) => {
                pending = Some(payload.clone());
                if !connected {
                    connected = try_connect(&mut client);
                }
                if connected {
                    apply(&mut client, &payload);
                }
            }
            Ok(Command::Clear) => {
                pending = None;
                if connected {
                    let _ = client.clear_activity();
                }
            }
            Ok(Command::Shutdown) | Err(mpsc::RecvTimeoutError::Disconnected) => {
                if connected {
                    // Clear so presence doesn't linger on the profile,
                    // then close the IPC connection cleanly.
                    let _ = client.clear_activity();
                    let _ = client.close();
                }
                break;
            }
            Err(mpsc::RecvTimeoutError::Timeout) => {
                // While an activity is pending but Discord isn't reachable,
                // retry the connection every RECONNECT_INTERVAL so presence
                // appears shortly after the user launches Discord.
                if pending.is_some() && !connected {
                    connected = try_connect(&mut client);
                    if connected {
                        if let Some(payload) = &pending {
                            apply(&mut client, payload);
                        }
                    }
                }
            }
        }
    }
}

fn try_connect(client: &mut DiscordIpcClient) -> bool {
    match client.connect() {
        Ok(()) => {
            eprintln!("[discord] connected to Discord IPC");
            true
        }
        Err(e) => {
            eprintln!("[discord] connect failed (is Discord running?): {e}");
            false
        }
    }
}

fn apply(client: &mut DiscordIpcClient, payload: &DiscordActivityPayload) {
    let mut activity =
        activity::Activity::new().details(&payload.details).state(&payload.state);

    let mut assets = activity::Assets::new();
    if let Some(img) = &payload.large_image {
        assets = assets.large_image(img);
    }
    if let Some(text) = &payload.large_text {
        assets = assets.large_text(text);
    }
    if let Some(img) = &payload.small_image {
        assets = assets.small_image(img);
    }
    if let Some(text) = &payload.small_text {
        assets = assets.small_text(text);
    }
    activity = activity.assets(assets);

    if let Some(start) = payload.start_ts {
        activity = activity.timestamps(activity::Timestamps::new().start(start));
    }

    if let Err(e) = client.set_activity(activity) {
        eprintln!("[discord] set_activity failed: {e}");
    }
}
