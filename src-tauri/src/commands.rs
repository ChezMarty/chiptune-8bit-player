use crate::librespot::LibrespotManager;
use crate::spotify::auth;
use crate::spotify::models::*;
use crate::spotify::SpotifyService;
use tauri::{AppHandle, Emitter, State};

// ── Config commands ──────────────────────────────────────────────

#[tauri::command]
pub fn spotify_get_client_id(service: State<'_, SpotifyService>) -> String {
    service.client_id()
}

#[tauri::command]
pub fn spotify_set_client_id(
    service: State<'_, SpotifyService>,
    client_id: String,
) -> Result<(), String> {
    service.set_client_id(client_id)
}

#[tauri::command]
pub fn spotify_is_configured(service: State<'_, SpotifyService>) -> bool {
    service.is_configured()
}

// ── Auth commands ────────────────────────────────────────────────

#[tauri::command]
pub async fn spotify_begin_login(
    app: AppHandle,
    service: State<'_, SpotifyService>,
) -> Result<LoginStartResponse, String> {
    // 1. Bind the callback server on an OS-assigned ephemeral port.
    let (listener, port) = auth::bind_callback_server().await?;
    let redirect_uri = format!("http://127.0.0.1:{port}/callback");
    eprintln!("[spotify] OAuth redirect_uri = {redirect_uri}");

    // 2. Build the authorization URL with the dynamic redirect URI.
    let (auth_url, verifier, _challenge) = service.begin_login(&redirect_uri)?;
    eprintln!("[spotify] OAuth authorize URL = {auth_url}");

    // 3. Clone values that must be shared with the async task.
    let verifier_for_task = verifier.clone();
    let redirect_uri_for_task = redirect_uri.clone();
    let core = service.core_arc();
    let client_id = service.client_id();

    // 4. Spawn a non-blocking task to accept the callback.
    //    Each login attempt binds a fresh ephemeral port; previous
    //    listeners sit idle on their old ports and are cleaned up
    //    when the app exits. No explicit cancellation needed.
    tauri::async_runtime::spawn(async move {
        match auth::accept_callback(listener).await {
            Ok(code) => {
                match auth::exchange_code(&client_id, &redirect_uri_for_task, &code, &verifier_for_task)
                    .await
                {
                    Ok(result) => {
                        eprintln!("[spotify] Token exchange succeeded for redirect_uri = {redirect_uri_for_task}");
                        let _ = core.token_store.save(&result.tokens);

                        let status = auth::build_account_status(
                            Some(&result.tokens),
                            Some(&result.user),
                        );

                        if let Ok(mut guard) = core.tokens.lock() {
                            *guard = Some(result.tokens);
                        }
                        if let Ok(mut guard) = core.cached_user.lock() {
                            *guard = Some(result.user);
                        }

                        let _ = app.emit("spotify-auth-complete", status);
                    }
                    Err(e) => {
                        let _ = app.emit("spotify-auth-error", e);
                    }
                }
            }
            Err(e) => {
                let _ = app.emit("spotify-auth-error", e);
            }
        }
        // Listener is dropped here — port is freed.
    });

    Ok(LoginStartResponse {
        auth_url,
        verifier,
        redirect_uri,
    })
}

#[tauri::command]
pub async fn spotify_complete_login(
    service: State<'_, SpotifyService>,
    redirect_uri: String,
    code: String,
    verifier: String,
) -> Result<SpotifyAccountStatus, String> {
    service.complete_login(&redirect_uri, &code, &verifier).await
}

#[tauri::command]
pub fn spotify_logout(service: State<'_, SpotifyService>) -> Result<(), String> {
    service.logout()
}

#[tauri::command]
pub fn spotify_account_status(service: State<'_, SpotifyService>) -> SpotifyAccountStatus {
    service.account_status()
}

// ── Library commands ─────────────────────────────────────────────

#[tauri::command]
pub async fn spotify_liked_songs(
    service: State<'_, SpotifyService>,
    offset: u64,
    limit: u64,
) -> Result<PaginatedSpotifyTracks, String> {
    service.get_liked_songs(offset, limit).await
}

#[tauri::command]
pub async fn spotify_playlists(
    service: State<'_, SpotifyService>,
    offset: u64,
    limit: u64,
) -> Result<PlaylistListResponse, String> {
    let (items, total, has_more) = service.get_my_playlists(offset, limit).await?;
    Ok(PlaylistListResponse {
        items,
        total,
        has_more,
    })
}

#[tauri::command]
pub async fn spotify_playlist_tracks(
    service: State<'_, SpotifyService>,
    playlist_id: String,
    offset: u64,
    limit: u64,
) -> Result<PaginatedSpotifyTracks, String> {
    service
        .get_playlist_tracks(&playlist_id, offset, limit)
        .await
}

#[tauri::command]
pub async fn spotify_albums(
    service: State<'_, SpotifyService>,
    offset: u64,
    limit: u64,
) -> Result<AlbumListResponse, String> {
    let (items, total, has_more) = service.get_my_albums(offset, limit).await?;
    Ok(AlbumListResponse { items, total, has_more })
}

#[tauri::command]
pub async fn spotify_album_tracks(
    service: State<'_, SpotifyService>,
    album_id: String,
) -> Result<PaginatedSpotifyTracks, String> {
    service.get_album_tracks(&album_id).await
}

#[tauri::command]
pub async fn spotify_artists(
    service: State<'_, SpotifyService>,
    after: Option<String>,
    limit: u64,
) -> Result<ArtistListResponse, String> {
    let (items, next_after) = service.get_followed_artists(after, limit).await?;
    Ok(ArtistListResponse { items, next_after })
}

#[tauri::command]
pub async fn spotify_recently_played(
    service: State<'_, SpotifyService>,
    limit: u64,
) -> Result<Vec<SpotifyTrackInfo>, String> {
    service.get_recently_played(limit).await
}

#[tauri::command]
pub async fn spotify_top_tracks(
    service: State<'_, SpotifyService>,
    offset: u64,
    limit: u64,
) -> Result<PaginatedSpotifyTracks, String> {
    service.get_top_tracks(offset, limit).await
}

#[tauri::command]
pub async fn spotify_search(
    service: State<'_, SpotifyService>,
    query: String,
    types: Vec<String>,
    limit: u64,
) -> Result<SpotifySearchResults, String> {
    eprintln!("[SEARCH] Tauri command spotify_search called: query={query:?}, types={types:?}, limit={limit} (type: u64)");
    // Clamp and validate limit before passing to service.
    let clamped_limit = limit.clamp(1, 50);
    if clamped_limit != limit {
        eprintln!("[SEARCH] WARNING: limit {limit} clamped to {clamped_limit}");
    }
    let result = service.search(&query, types, clamped_limit).await;
    match &result {
        Ok(ref results) => {
            eprintln!("[SEARCH] Command succeeded: {} tracks, {} albums, {} artists, {} playlists",
                results.tracks.len(), results.albums.len(), results.artists.len(), results.playlists.len());
        }
        Err(e) => {
            eprintln!("[SEARCH] Command FAILED: {e}");
        }
    }
    result
}

// ── Response wrappers ────────────────────────────────────────────

#[derive(serde::Serialize, Clone)]
pub struct LoginStartResponse {
    pub auth_url: String,
    pub verifier: String,
    pub redirect_uri: String,
}

#[derive(serde::Serialize, Clone)]
pub struct PlaylistListResponse {
    pub items: Vec<SpotifyPlaylistInfo>,
    pub total: u64,
    pub has_more: bool,
}

#[derive(serde::Serialize, Clone)]
pub struct AlbumListResponse {
    pub items: Vec<SpotifyAlbumInfo>,
    pub total: u64,
    pub has_more: bool,
}

#[derive(serde::Serialize, Clone)]
pub struct ArtistListResponse {
    pub items: Vec<SpotifyArtistInfo>,
    pub next_after: Option<String>,
}

// ── Token access for Web Playback SDK ────────────────────────────

/// Returns only the access token (never the refresh token) so the
/// Spotify Web Playback SDK can authenticate without secrets.
#[tauri::command]
pub async fn get_spotify_access_token(
    service: State<'_, SpotifyService>,
) -> Result<String, String> {
    service.get_valid_token().await
}

// ── Librespot playback commands ──────────────────────────────────

/// Check whether the librespot engine is available.
#[tauri::command]
pub fn librespot_is_initialised(
    manager: State<'_, LibrespotManager>,
) -> bool {
    manager.is_initialised()
}

/// Get the librespot crate version string.
#[tauri::command]
pub fn librespot_version() -> String {
    crate::librespot::librespot_version().to_string()
}

/// Start a librespot session.
/// `auth_data` is the authentication data (access token) used to authenticate
/// with the Spotify streaming protocol.
/// `account_product` is optional — pass "premium", "free", etc. from the
/// Spotify Web API user profile for helpful diagnostics.
#[tauri::command]
pub async fn librespot_start(
    app: AppHandle,
    manager: State<'_, LibrespotManager>,
    auth_data: String,
    account_product: Option<String>,
) -> Result<(), String> {
    manager
        .start(&auth_data, app, account_product.as_deref())
        .await
}

/// Stop the librespot session (teardown — destroys session and player).
#[tauri::command]
pub async fn librespot_stop(
    manager: State<'_, LibrespotManager>,
) -> Result<(), String> {
    manager.stop().await;
    Ok(())
}

/// Stop the current playback immediately without destroying the session.
/// Clears audio buffers in both Rust and the frontend.
#[tauri::command]
pub async fn librespot_stop_playback(
    manager: State<'_, LibrespotManager>,
) -> Result<(), String> {
    manager.stop_playback().await
}

/// Play a Spotify track by URI.
#[tauri::command]
pub async fn librespot_play(
    manager: State<'_, LibrespotManager>,
    uri: String,
) -> Result<(), String> {
    manager.play(&uri).await
}

/// Pause playback.
#[tauri::command]
pub async fn librespot_pause(
    manager: State<'_, LibrespotManager>,
) -> Result<(), String> {
    manager.pause().await
}

/// Resume playback.
#[tauri::command]
pub async fn librespot_resume(
    manager: State<'_, LibrespotManager>,
) -> Result<(), String> {
    manager.resume().await
}

/// Seek to a position (milliseconds).
#[tauri::command]
pub async fn librespot_seek(
    manager: State<'_, LibrespotManager>,
    position_ms: u64,
) -> Result<(), String> {
    manager.seek(position_ms).await
}

/// Set volume (0..1).
#[tauri::command]
pub async fn librespot_set_volume(
    manager: State<'_, LibrespotManager>,
    volume: f64,
) -> Result<(), String> {
    manager.set_volume(volume).await
}

/// Get current playback state.
#[tauri::command]
pub async fn librespot_get_state(
    manager: State<'_, LibrespotManager>,
) -> Result<crate::librespot::PlaybackStatePayload, String> {
    Ok(manager.get_state())
}

// ── Other playback commands ──────────────────────────────────────

#[tauri::command]
pub async fn spotify_play_uris(
    service: State<'_, SpotifyService>,
    uris: Vec<String>,
    device_id: Option<String>,
) -> Result<(), String> {
    service.play_uris(uris, device_id).await
}

#[tauri::command]
pub async fn spotify_resume(
    service: State<'_, SpotifyService>,
    device_id: Option<String>,
) -> Result<(), String> {
    service.resume_playback(device_id).await
}

#[tauri::command]
pub async fn spotify_pause(service: State<'_, SpotifyService>) -> Result<(), String> {
    service.pause_playback().await
}

#[tauri::command]
pub async fn spotify_next(service: State<'_, SpotifyService>) -> Result<(), String> {
    service.next_track().await
}

#[tauri::command]
pub async fn spotify_prev(service: State<'_, SpotifyService>) -> Result<(), String> {
    service.prev_track().await
}

#[tauri::command]
pub async fn spotify_get_devices(
    service: State<'_, SpotifyService>,
) -> Result<Vec<SpotifyDevice>, String> {
    service.get_devices().await
}
