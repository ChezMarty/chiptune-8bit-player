mod commands;
mod librespot;
mod spotify;

use librespot::LibrespotManager;
use log::LevelFilter;
use spotify::SpotifyService;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {name}! You've been greeted from Rust!")
}

/// Custom logger that forwards `log` crate output (used by librespot internally)
/// to stderr with a `[librespot-log]` prefix so the user can see the actual
/// error details that librespot's `error!()` / `warn!()` / `debug!()` macros emit.
struct LibrespotLogRedirector;

impl log::Log for LibrespotLogRedirector {
    fn enabled(&self, _metadata: &log::Metadata) -> bool {
        true
    }

    fn log(&self, record: &log::Record) {
        // Only forward librespot's own log messages so we don't flood stderr
        // with noise from other crates.
        if record.target().starts_with("librespot") {
            eprintln!("[librespot-log][{}] {}", record.level(), record.args());
        }
    }

    fn flush(&self) {}
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialise the Rustls CryptoProvider before any TLS code runs.
    // Both reqwest (rustls-tls) and librespot (via its HTTP client)
    // depend on rustls 0.23+, which requires an explicit provider.
    rustls::crypto::ring::default_provider()
        .install_default()
        .expect("failed to install rustls CryptoProvider");

    // Initialise a custom logger to capture librespot's internal log output.
    // librespot uses the `log` crate (error!, warn!, debug! macros) for its
    // internal diagnostics, but without a logger these messages are silently
    // discarded. By capturing them we can see the actual reason for errors
    // like `PlayerEvent::Unavailable`.
    static LOGGER: LibrespotLogRedirector = LibrespotLogRedirector;
    log::set_logger(&LOGGER)
        .map(|()| log::set_max_level(LevelFilter::Debug))
        .unwrap_or_else(|_| {
            // Logger already set — ignore (e.g. if running tests).
        });

    let spotify_service = SpotifyService::new();
    spotify_service.init();
    let librespot_manager = LibrespotManager::new();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(spotify_service)
        .manage(librespot_manager)
        .invoke_handler(tauri::generate_handler![
            greet,
            // Spotify config
            commands::spotify_get_client_id,
            commands::spotify_set_client_id,
            commands::spotify_is_configured,
            // Spotify auth
            commands::spotify_begin_login,
            commands::spotify_complete_login,
            commands::spotify_logout,
            commands::spotify_account_status,
            // Spotify library
            commands::spotify_liked_songs,
            commands::spotify_playlists,
            commands::spotify_playlist_tracks,
            commands::spotify_top_tracks,
            commands::spotify_search,
            // Spotify token access (SDK)
            commands::get_spotify_access_token,
            // Spotify playback
            commands::spotify_play_uris,
            commands::spotify_resume,
            commands::spotify_pause,
            commands::spotify_next,
            commands::spotify_prev,
            commands::spotify_get_devices,
            // Librespot (direct Spotify audio streaming)
            commands::librespot_is_initialised,
            commands::librespot_version,
            commands::librespot_start,
            commands::librespot_stop,
            commands::librespot_play,
            commands::librespot_pause,
            commands::librespot_resume,
            commands::librespot_seek,
            commands::librespot_set_volume,
            commands::librespot_stop_playback,
            commands::librespot_get_state,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
