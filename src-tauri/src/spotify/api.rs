use super::models::*;

/// Spotify Web API client.
///
/// All methods require a valid access token. Token refresh is handled
/// by the `SpotifyService` layer before calling into this client.
pub struct SpotifyApiClient {
    http: reqwest::Client,
}

const BASE_URL: &str = "https://api.spotify.com/v1";

impl SpotifyApiClient {
    pub fn new() -> Self {
        SpotifyApiClient {
            http: reqwest::Client::new(),
        }
    }

    // -- User --

    pub async fn get_me(&self, token: &str) -> Result<SpotifyUser, String> {
        let url = format!("{BASE_URL}/me");
        self.get(&url, token).await
    }

    // -- Library: Liked Songs --

    pub async fn get_liked_songs(
        &self,
        token: &str,
        offset: u64,
        limit: u64,
    ) -> Result<PaginatedSpotifyTracks, String> {
        let url = format!("{BASE_URL}/me/tracks?limit={limit}&offset={offset}");
        let paging: PagingSavedTrack = self.get(&url, token).await?;
        Ok(PaginatedSpotifyTracks {
            items: paging.items.iter().map(|s| (&s.track).into()).collect(),
            total: paging.total,
            offset: paging.offset,
            has_more: paging.next.is_some(),
        })
    }

    // -- Playlists --

    pub async fn get_my_playlists(
        &self,
        token: &str,
        offset: u64,
        limit: u64,
    ) -> Result<(Vec<SpotifyPlaylistInfo>, u64, bool), String> {
        let url = format!("{BASE_URL}/me/playlists?limit={limit}&offset={offset}");
        let paging: PagingPlaylist = self.get(&url, token).await?;
        let items: Vec<SpotifyPlaylistInfo> =
            paging.items.iter().filter_map(|p| p.as_ref().map(|p| p.into())).collect();
        Ok((items, paging.total, paging.next.is_some()))
    }

    pub async fn get_playlist_tracks(
        &self,
        token: &str,
        playlist_id: &str,
        offset: u64,
        limit: u64,
    ) -> Result<PaginatedSpotifyTracks, String> {
        // As of Feb 2026, Spotify uses /items instead of /tracks.
        let url = format!(
            "{BASE_URL}/playlists/{playlist_id}/items?limit={limit}&offset={offset}"
        );

        let resp = self
            .http
            .get(&url)
            .header("Authorization", format!("Bearer {token}"))
            .send()
            .await
            .map_err(|e| format!("HTTP GET failed: {e}"))?;

        if resp.status() == 401 {
            return Err("TOKEN_EXPIRED".to_string());
        }
        if resp.status() == 429 {
            let retry_after = resp
                .headers()
                .get("Retry-After")
                .and_then(|v| v.to_str().ok())
                .and_then(|s| s.parse::<u64>().ok());
            return Err(format!("RATE_LIMITED:{}", retry_after.unwrap_or(1)));
        }
        if !resp.status().is_success() {
            let status = resp.status();
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("HTTP {status}: {body}"));
        }

        let raw_json = resp.text().await.map_err(|e| format!("Read body: {e}"))?;

        // Parse as serde_json::Value and process items individually
        // to handle per-item deserialization errors gracefully
        let root: serde_json::Value = serde_json::from_str(&raw_json)
            .map_err(|e| format!("JSON parse: {e}"))?;

        let paging_total = root.get("total").and_then(|v| v.as_u64()).unwrap_or(0);
        let paging_offset = root.get("offset").and_then(|v| v.as_u64()).unwrap_or(0);
        let paging_has_more = root.get("next").and_then(|v| v.as_str()).is_some();

        let items_array = match root.get("items") {
            Some(serde_json::Value::Array(arr)) => arr,
            _ => return Err("Missing or invalid 'items' field".to_string()),
        };

        // Process each item individually — skip null/missing tracks
        let mut info_items: Vec<SpotifyTrackInfo> = Vec::with_capacity(items_array.len());

        for item_value in items_array.iter() {
            // Spotify renamed "track" to "item" in Feb 2026.
            // Check both for backward compatibility.
            let track_value = match item_value.get("item").or_else(|| item_value.get("track")) {
                Some(v) if !v.is_null() => v,
                _ => continue,
            };

            if let Ok(track) = serde_json::from_value::<SpotifyTrack>(track_value.clone()) {
                info_items.push((&track).into());
            }
        }

        Ok(PaginatedSpotifyTracks {
            items: info_items,
            total: paging_total,
            offset: paging_offset,
            has_more: paging_has_more,
        })
    }

    // -- Search --

    pub async fn search(
        &self,
        token: &str,
        query: &str,
        types: &[&str],
        limit: u64,
    ) -> Result<SpotifySearchResults, String> {
        // NOTE: Spotify Search API 'limit' range is 0-10 (not 0-50!)
        // https://developer.spotify.com/documentation/web-api/reference/search

        // Clamp limit to Search API's max (1..=10)
        let clamped = limit.clamp(1, 10);
        if clamped != limit {
            eprintln!("[SEARCH] WARNING: limit was {limit}, clamped to {clamped} (Search API max is 10)");
        }

        let encoded = urlencoding(query);
        let types_str = types.join(",");
        let url = format!(
            "{BASE_URL}/search?q={encoded}&type={types_str}&limit={clamped}"
        );
        eprintln!("[SEARCH] Search URL: GET {url}");

        // Diagnostic: Get raw JSON text, log it, THEN parse
        let token_prefix: String = token.chars().take(20).collect();
        eprintln!("[SEARCH] Token prefix: {token_prefix}...");

        let resp = self
            .http
            .get(&url)
            .header("Authorization", format!("Bearer {token}"))
            .send()
            .await
            .map_err(|e| format!("HTTP GET failed: {e}"))?;

        if resp.status() == 401 {
            return Err("TOKEN_EXPIRED".to_string());
        }
        if resp.status() == 429 {
            let retry_after = resp
                .headers()
                .get("Retry-After")
                .and_then(|v| v.to_str().ok())
                .and_then(|s| s.parse::<u64>().ok());
            return Err(format!("RATE_LIMITED:{}", retry_after.unwrap_or(1)));
        }
        if !resp.status().is_success() {
            let status = resp.status();
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("HTTP {status}: {body}"));
        }

        // Get raw JSON text
        let raw_json = resp.text().await.map_err(|e| format!("Read response body: {e}"))?;

        // Truncate for logging if very large
        let preview: String = raw_json.chars().take(2000).collect();
        eprintln!("[SEARCH] === RAW JSON (first 2000 chars) ===");
        for line in preview.lines() {
            eprintln!("[SEARCH]   {line}");
        }
        if raw_json.len() > 2000 {
            eprintln!("[SEARCH]   ... ({} total chars)", raw_json.len());
        }
        eprintln!("[SEARCH] === END RAW JSON ===");

        // Parse JSON
        let result: SearchResponse = match serde_json::from_str(&raw_json) {
            Ok(r) => r,
            Err(e) => {
                eprintln!("[SEARCH] JSON PARSE FAILED");
                eprintln!("[SEARCH]    serde error: {e}");
                eprintln!("[SEARCH]    line: {} col: {}", e.line(), e.column());
                return Err(format!("JSON parse: {e}"));
            }
        };

        let tracks_count = result.tracks.as_ref().map(|p| p.items.len()).unwrap_or(0);
        let albums_count = result.albums.as_ref().map(|p| p.items.len()).unwrap_or(0);
        let artists_count = result.artists.as_ref().map(|p| p.items.len()).unwrap_or(0);
        let playlists_count = result.playlists.as_ref().map(|p| p.items.len()).unwrap_or(0);
        eprintln!("[SEARCH] Parsed: {} tracks, {} albums, {} artists, {} playlists",
            tracks_count, albums_count, artists_count, playlists_count);

        Ok(SpotifySearchResults {
            tracks: result
                .tracks
                .map(|p| p.items.iter().filter_map(|t| t.as_ref().map(|t| t.into())).collect())
                .unwrap_or_default(),
            albums: result
                .albums
                .map(|p| p.items.iter().filter_map(|a| a.as_ref().map(|a| a.into())).collect())
                .unwrap_or_default(),
            artists: result
                .artists
                .map(|p| p.items.iter().filter_map(|a| a.as_ref().map(|a| a.into())).collect())
                .unwrap_or_default(),
            playlists: result
                .playlists
                .map(|p| p.items.iter().filter_map(|p| p.as_ref().map(|p| p.into())).collect())
                .unwrap_or_default(),
        })
    }

    // -- Top Tracks --

    pub async fn get_top_tracks(
        &self,
        token: &str,
        offset: u64,
        limit: u64,
    ) -> Result<PaginatedSpotifyTracks, String> {
        let url = format!(
            "{BASE_URL}/me/top/tracks?limit={limit}&offset={offset}&time_range=medium_term"
        );
        let paging: PagingTrack = self.get(&url, token).await?;
        Ok(PaginatedSpotifyTracks {
            items: paging.items.iter().filter_map(|t| t.as_ref().map(|t| t.into())).collect(),
            total: paging.total,
            offset: paging.offset,
            has_more: paging.next.is_some(),
        })
    }

    // -- Playback --

    /// Start/resume playback with one or more track URIs.
    pub async fn play_uris(
        &self,
        token: &str,
        uris: &[String],
        device_id: Option<&str>,
    ) -> Result<(), String> {
        let mut url = format!("{BASE_URL}/me/player/play");
        if let Some(did) = device_id {
            url.push_str(&format!("?device_id={did}"));
        }

        let body = serde_json::json!({"uris": uris});
        eprintln!("[spotify] PUT {url} body={body}");

        let resp = self
            .http
            .put(&url)
            .header("Authorization", format!("Bearer {token}"))
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Play request failed: {e}"))?;

        let status = resp.status();
        if status == 204 {
            eprintln!("[spotify] Playback started successfully (204)");
            return Ok(());
        }
        if status == 401 {
            return Err("TOKEN_EXPIRED".to_string());
        }
        let body = resp.text().await.unwrap_or_default();
        eprintln!("[spotify] Play failed: HTTP {status}: {body}");
        Err(format!("Playback failed (HTTP {status}): {body}"))
    }

    /// Resume playback (empty body).
    pub async fn resume_playback(&self, token: &str, device_id: Option<&str>) -> Result<(), String> {
        let mut url = format!("{BASE_URL}/me/player/play");
        if let Some(did) = device_id {
            url.push_str(&format!("?device_id={did}"));
        }
        eprintln!("[spotify] PUT {url} (resume)");

        let resp = self
            .http
            .put(&url)
            .header("Authorization", format!("Bearer {token}"))
            .send()
            .await
            .map_err(|e| format!("Resume request failed: {e}"))?;

        let status = resp.status();
        if status == 204 {
            return Ok(());
        }
        if status == 401 {
            return Err("TOKEN_EXPIRED".to_string());
        }
        let body = resp.text().await.unwrap_or_default();
        Err(format!("Resume failed (HTTP {status}): {body}"))
    }

    /// Pause playback.
    pub async fn pause_playback(&self, token: &str) -> Result<(), String> {
        let url = format!("{BASE_URL}/me/player/pause");
        eprintln!("[spotify] PUT {url}");

        let resp = self
            .http
            .put(&url)
            .header("Authorization", format!("Bearer {token}"))
            .send()
            .await
            .map_err(|e| format!("Pause request failed: {e}"))?;

        let status = resp.status();
        if status == 204 {
            return Ok(());
        }
        if status == 401 {
            return Err("TOKEN_EXPIRED".to_string());
        }
        let body = resp.text().await.unwrap_or_default();
        Err(format!("Pause failed (HTTP {status}): {body}"))
    }

    /// Skip to next track.
    pub async fn next_track(&self, token: &str) -> Result<(), String> {
        let url = format!("{BASE_URL}/me/player/next");
        eprintln!("[spotify] POST {url}");

        let resp = self
            .http
            .post(&url)
            .header("Authorization", format!("Bearer {token}"))
            .send()
            .await
            .map_err(|e| format!("Next request failed: {e}"))?;

        let status = resp.status();
        if status == 204 {
            return Ok(());
        }
        if status == 401 {
            return Err("TOKEN_EXPIRED".to_string());
        }
        let body = resp.text().await.unwrap_or_default();
        Err(format!("Next failed (HTTP {status}): {body}"))
    }

    /// Skip to previous track.
    pub async fn prev_track(&self, token: &str) -> Result<(), String> {
        let url = format!("{BASE_URL}/me/player/previous");
        eprintln!("[spotify] POST {url}");

        let resp = self
            .http
            .post(&url)
            .header("Authorization", format!("Bearer {token}"))
            .send()
            .await
            .map_err(|e| format!("Prev request failed: {e}"))?;

        let status = resp.status();
        if status == 204 {
            return Ok(());
        }
        if status == 401 {
            return Err("TOKEN_EXPIRED".to_string());
        }
        let body = resp.text().await.unwrap_or_default();
        Err(format!("Prev failed (HTTP {status}): {body}"))
    }

    /// Get available Spotify Connect devices.
    pub async fn get_devices(&self, token: &str) -> Result<Vec<SpotifyDevice>, String> {
        let url = format!("{BASE_URL}/me/player/devices");
        #[derive(serde::Deserialize)]
        struct DeviceList {
            devices: Vec<SpotifyDevice>,
        }
        let result: DeviceList = self.get(&url, token).await?;
        eprintln!(
            "[spotify] Available devices: {}",
            result
                .devices
                .iter()
                .map(|d| format!("{} (id={} active={})", d.name, d.id.as_deref().unwrap_or("<none>"), d.is_active))
                .collect::<Vec<_>>()
                .join(", ")
        );
        Ok(result.devices)
    }

    // -- Internal helpers --

    async fn get<T: serde::de::DeserializeOwned>(
        &self,
        url: &str,
        token: &str,
    ) -> Result<T, String> {
        let token_prefix: String = token.chars().take(20).collect();
        eprintln!("[TOKEN] Endpoint GET {url} using token: {token_prefix}...");

        let resp = self
            .http
            .get(url)
            .header("Authorization", format!("Bearer {token}"))
            .send()
            .await
            .map_err(|e| format!("HTTP GET {url}: {e}"))?;

        if resp.status() == 401 {
            return Err("TOKEN_EXPIRED".to_string());
        }
        if resp.status() == 429 {
            let retry_after = resp
                .headers()
                .get("Retry-After")
                .and_then(|v| v.to_str().ok())
                .and_then(|s| s.parse::<u64>().ok());
            return Err(format!("RATE_LIMITED:{}", retry_after.unwrap_or(1)));
        }
        if !resp.status().is_success() {
            let status = resp.status();
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("HTTP {status}: {body}"));
        }

        resp.json().await.map_err(|e| format!("JSON parse: {e}"))
    }
}

fn urlencoding(s: &str) -> String {
    url::form_urlencoded::byte_serialize(s.as_bytes()).collect()
}
