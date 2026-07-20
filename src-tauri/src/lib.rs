mod commands;
mod librespot;
mod spotify;

use librespot::LibrespotManager;
use spotify::SpotifyService;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {name}! You've been greeted from Rust!")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialise the Rustls CryptoProvider before any TLS code runs.
    // Both reqwest (rustls-tls) and librespot (via its HTTP client)
    // depend on rustls 0.23+, which requires an explicit provider.
    rustls::crypto::ring::default_provider()
        .install_default()
        .expect("failed to install rustls CryptoProvider");

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
            commands::spotify_albums,
            commands::spotify_album_tracks,
            commands::spotify_artists,
            commands::spotify_recently_played,
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
            commands::librespot_get_state,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
