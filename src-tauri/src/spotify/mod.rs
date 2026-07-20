pub mod api;
pub mod auth;
pub mod models;
pub mod token_store;

use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

use auth::SpotifyAuthConfig;
use token_store::TokenStore;

use self::api::SpotifyApiClient;
use self::models::*;

/// Fallback client ID used when the user hasn't configured one yet.
const DEFAULT_CLIENT_ID: &str = "";

const CLIENT_ID_FILENAME: &str = "spotify_client_id.txt";

/// Core Spotify service data, shared via Arc for use in async tasks.
pub struct SpotifyCore {
    /// The client ID is Mutex-protected so it can be updated at runtime
    /// via the Settings UI without restarting the app.
    pub config: Mutex<SpotifyAuthConfig>,
    pub tokens: Mutex<Option<StoredTokens>>,
    /// Cached user profile (set after login or refresh).
    pub cached_user: Mutex<Option<SpotifyUser>>,
    pub token_store: TokenStore,
    pub api_client: SpotifyApiClient,
}

/// Main Spotify service, managed as Tauri state.
pub struct SpotifyService {
    pub core: Arc<SpotifyCore>,
}

fn client_id_path() -> Result<std::path::PathBuf, String> {
    let dir = dirs_data().ok_or("Cannot determine app data directory")?;
    std::fs::create_dir_all(&dir).map_err(|e| format!("Create dir: {e}"))?;
    Ok(dir.join(CLIENT_ID_FILENAME))
}

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

impl SpotifyService {
    pub fn new() -> Self {
        let client_id = Self::load_client_id_from_disk()
            .unwrap_or_else(|_| DEFAULT_CLIENT_ID.to_string());

        let core = SpotifyCore {
            config: Mutex::new(SpotifyAuthConfig { client_id }),
            tokens: Mutex::new(None),
            cached_user: Mutex::new(None),
            token_store: TokenStore::new("Chiptune8BitPlayer"),
            api_client: SpotifyApiClient::new(),
        };

        SpotifyService {
            core: Arc::new(core),
        }
    }

    fn load_client_id_from_disk() -> Result<String, String> {
        let path = client_id_path()?;
        if !path.exists() {
            return Ok(DEFAULT_CLIENT_ID.to_string());
        }
        let raw =
            std::fs::read_to_string(&path).map_err(|e| format!("Read client ID: {e}"))?;
        Ok(raw.trim().to_string())
    }

    /// Get the current client ID.
    pub fn client_id(&self) -> String {
        self.core
            .config
            .lock()
            .unwrap_or_else(|e| e.into_inner())
            .client_id
            .clone()
    }

    /// Check whether a client ID has been configured (non-empty).
    pub fn is_configured(&self) -> bool {
        let guard = self.core.config.lock().unwrap_or_else(|e| e.into_inner());
        !guard.client_id.is_empty()
    }

    /// Set a new client ID. Persists to disk and updates the in-memory config.
    pub fn set_client_id(&self, client_id: String) -> Result<(), String> {
        let trimmed = client_id.trim().to_string();

        // Persist to disk.
        let path = client_id_path()?;
        std::fs::write(&path, trimmed.as_bytes())
            .map_err(|e| format!("Write client ID: {e}"))?;

        // Update in-memory config.
        if let Ok(mut guard) = self.core.config.lock() {
            guard.client_id = trimmed;
        }

        Ok(())
    }

    /// Initialize: try to load tokens from secure storage.
    pub fn init(&self) {
        match self.core.token_store.load() {
            Ok(Some(tokens)) => {
                if let Ok(mut guard) = self.core.tokens.lock() {
                    *guard = Some(tokens);
                }
            }
            Ok(None) => {}
            Err(e) => {
                eprintln!("[spotify] Failed to load tokens: {e}");
            }
        }
    }

    /// Clone the Arc for use in async tasks.
    pub fn core_arc(&self) -> Arc<SpotifyCore> {
        self.core.clone()
    }

    // ── Auth ────────────────────────────────────────────────────

    /// Build the authorization URL for the given redirect URI.
    pub fn begin_login(&self, redirect_uri: &str) -> Result<(String, String, String), String> {
        let client_id = self.client_id();
        if client_id.is_empty() {
            return Err("Spotify Client ID not configured. Please set it in Settings.".to_string());
        }
        let verifier = auth::generate_code_verifier();
        let challenge = auth::generate_code_challenge(&verifier);
        let url = auth::build_authorize_url(&client_id, redirect_uri, &challenge);
        Ok((url, verifier, challenge))
    }

    /// Complete the PKCE flow by exchanging the code for tokens.
    pub async fn complete_login(
        &self,
        redirect_uri: &str,
        code: &str,
        verifier: &str,
    ) -> Result<SpotifyAccountStatus, String> {
        let client_id = self.client_id();
        let result =
            auth::exchange_code(&client_id, redirect_uri, code, verifier).await?;

        self.core
            .token_store
            .save(&result.tokens)
            .map_err(|e| format!("Failed to save tokens: {e}"))?;

        let status = auth::build_account_status(Some(&result.tokens), Some(&result.user));

        if let Ok(mut guard) = self.core.tokens.lock() {
            *guard = Some(result.tokens);
        }
        if let Ok(mut guard) = self.core.cached_user.lock() {
            *guard = Some(result.user);
        }

        Ok(status)
    }

    /// Log out: delete stored tokens and clear in-memory state.
    pub fn logout(&self) -> Result<(), String> {
        self.core.token_store.delete()?;
        if let Ok(mut guard) = self.core.tokens.lock() {
            *guard = None;
        }
        if let Ok(mut guard) = self.core.cached_user.lock() {
            *guard = None;
        }
        Ok(())
    }

    /// Get the current account status.
    pub fn account_status(&self) -> SpotifyAccountStatus {
        let tokens = self.core.tokens.lock().unwrap_or_else(|e| e.into_inner());
        let user = self.core.cached_user.lock().unwrap_or_else(|e| e.into_inner());
        auth::build_account_status(tokens.as_ref(), user.as_ref())
    }

    // ── Token management ────────────────────────────────────────

    /// Get a valid access token, refreshing if necessary.
    pub async fn get_valid_token(&self) -> Result<String, String> {
        let (needs_refresh, refresh_token_opt) = {
            let guard = self.core.tokens.lock().unwrap_or_else(|e| e.into_inner());
            match &*guard {
                Some(t) => {
                    let now = SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap()
                        .as_secs();
                    let expired = t.expires_at <= now;
                    (expired, Some(t.refresh_token.clone()))
                }
                None => return Err("Not authenticated".to_string()),
            }
        };

        if needs_refresh {
            eprintln!("[TOKEN] Token expired — refreshing...");
            let refresh_token = refresh_token_opt.unwrap();
            let client_id = self.client_id();
            let new_tokens = auth::refresh_access_token(&client_id, &refresh_token).await?;
            // Extract values BEFORE moving new_tokens
            let prefix: String = new_tokens.access_token.chars().take(20).collect();
            let scope = new_tokens.scope.clone();
            let expires_at = new_tokens.expires_at;
            let access_token = new_tokens.access_token.clone();

            self.core
                .token_store
                .save(&new_tokens)
                .map_err(|e| format!("Failed to save refreshed tokens: {e}"))?;
            if let Ok(mut guard) = self.core.tokens.lock() {
                *guard = Some(new_tokens);
            }
            eprintln!("[TOKEN] Refreshed: prefix={prefix}..., scope={scope}, expires_at={expires_at}");
            return Ok(access_token);
        }

        let guard = self.core.tokens.lock().unwrap_or_else(|e| e.into_inner());
        match &*guard {
            Some(t) => {
                let prefix: String = t.access_token.chars().take(20).collect();
                let now = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs();
                let expires_in_secs = t.expires_at.saturating_sub(now);
                eprintln!("[TOKEN] ─── Token details ───");
                eprintln!("[TOKEN]   prefix: {prefix}...");
                eprintln!("[TOKEN]   token_type: Bearer (from Spotify OAuth Token endpoint)");
                eprintln!("[TOKEN]   expires_in: {expires_in_secs}s (at unix ts {})", t.expires_at);
                eprintln!("[TOKEN]   scope: {}", t.scope);
                eprintln!("[TOKEN]   source: PKCE OAuth (authorization_code grant, refresh_token flow)");
                eprintln!("[TOKEN]   ─────────────────────");
                Ok(t.access_token.clone())
            }
            None => Err("Not authenticated".to_string()),
        }
    }

    // ── Library methods ─────────────────────────────────────────

    pub async fn get_liked_songs(&self, offset: u64, limit: u64) -> Result<PaginatedSpotifyTracks, String> {
        let token = self.get_valid_token().await?;
        self.core.api_client.get_liked_songs(&token, offset, limit).await
    }

    pub async fn get_my_playlists(&self, offset: u64, limit: u64) -> Result<(Vec<SpotifyPlaylistInfo>, u64, bool), String> {
        let token = self.get_valid_token().await?;
        self.core.api_client.get_my_playlists(&token, offset, limit).await
    }

    pub async fn get_playlist_tracks(&self, playlist_id: &str, offset: u64, limit: u64) -> Result<PaginatedSpotifyTracks, String> {
        let token = self.get_valid_token().await?;
        self.core.api_client.get_playlist_tracks(&token, playlist_id, offset, limit).await
    }

    pub async fn get_my_albums(&self, offset: u64, limit: u64) -> Result<(Vec<SpotifyAlbumInfo>, u64, bool), String> {
        let token = self.get_valid_token().await?;
        self.core.api_client.get_my_albums(&token, offset, limit).await
    }

    pub async fn get_album_tracks(&self, album_id: &str) -> Result<PaginatedSpotifyTracks, String> {
        let token = self.get_valid_token().await?;
        self.core.api_client.get_album_tracks(&token, album_id).await
    }

    pub async fn get_followed_artists(&self, after: Option<String>, limit: u64) -> Result<(Vec<SpotifyArtistInfo>, Option<String>), String> {
        let token = self.get_valid_token().await?;
        self.core.api_client.get_followed_artists(&token, after.as_deref(), limit).await
    }

    pub async fn get_recently_played(&self, limit: u64) -> Result<Vec<SpotifyTrackInfo>, String> {
        let token = self.get_valid_token().await?;
        self.core.api_client.get_recently_played(&token, limit).await
    }

    pub async fn get_top_tracks(&self, offset: u64, limit: u64) -> Result<PaginatedSpotifyTracks, String> {
        let token = self.get_valid_token().await?;
        self.core.api_client.get_top_tracks(&token, offset, limit).await
    }

    pub async fn search(&self, query: &str, types: Vec<String>, limit: u64) -> Result<SpotifySearchResults, String> {
        // Double-check limit is valid.
        let limit = limit.clamp(1, 50);
        eprintln!("[SEARCH] SpotifyService.search: query={query:?}, types={types:?}, limit={limit} (type: u64)");
        let token = self.get_valid_token().await?;
        eprintln!("[SEARCH] Token obtained ({} chars), calling API client...", token.len());
        let type_refs: Vec<&str> = types.iter().map(|s| s.as_str()).collect();
        let result = self.core.api_client.search(&token, query, &type_refs, limit).await;
        match &result {
            Ok(ref results) => {
                eprintln!("[SEARCH] API client returned: {} tracks, {} albums, {} artists, {} playlists",
                    results.tracks.len(), results.albums.len(), results.artists.len(), results.playlists.len());
            }
            Err(e) => {
                eprintln!("[SEARCH] API client FAILED: {e}");
            }
        }
        result
    }

    // ── Playback methods ───────────────────────────────────────

    /// Start playing one or more track URIs.
    pub async fn play_uris(&self, uris: Vec<String>, device_id: Option<String>) -> Result<(), String> {
        let token = self.get_valid_token().await?;
        let device_ref = device_id.as_deref();
        self.core.api_client.play_uris(&token, &uris, device_ref).await
    }

    /// Resume playback.
    pub async fn resume_playback(&self, device_id: Option<String>) -> Result<(), String> {
        let token = self.get_valid_token().await?;
        let device_ref = device_id.as_deref();
        self.core.api_client.resume_playback(&token, device_ref).await
    }

    /// Pause playback.
    pub async fn pause_playback(&self) -> Result<(), String> {
        let token = self.get_valid_token().await?;
        self.core.api_client.pause_playback(&token).await
    }

    /// Skip to next track.
    pub async fn next_track(&self) -> Result<(), String> {
        let token = self.get_valid_token().await?;
        self.core.api_client.next_track(&token).await
    }

    /// Skip to previous track.
    pub async fn prev_track(&self) -> Result<(), String> {
        let token = self.get_valid_token().await?;
        self.core.api_client.prev_track(&token).await
    }

    /// Get available Spotify Connect devices.
    pub async fn get_devices(&self) -> Result<Vec<SpotifyDevice>, String> {
        let token = self.get_valid_token().await?;
        self.core.api_client.get_devices(&token).await
    }
}
