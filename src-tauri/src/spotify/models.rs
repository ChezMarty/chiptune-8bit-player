use serde::{Deserialize, Serialize};

/// Spotify API token response (POST /api/token).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenResponse {
    pub access_token: String,
    pub token_type: String,
    pub scope: String,
    pub expires_in: u64,
    pub refresh_token: Option<String>,
}

/// Stored tokens with expiry tracking.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredTokens {
    pub access_token: String,
    pub refresh_token: String,
    /// Unix timestamp (seconds) when the access token expires.
    pub expires_at: u64,
    pub scope: String,
}

/// Spotify user profile (GET /v1/me).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpotifyUser {
    pub id: String,
    pub display_name: Option<String>,
    pub email: Option<String>,
    pub product: Option<String>,
    #[serde(default)]
    pub images: Vec<SpotifyImage>,
    pub uri: Option<String>,
}

/// Spotify image array item.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpotifyImage {
    pub url: String,
    pub height: Option<u32>,
    pub width: Option<u32>,
}

/// Simplified artist object (returned inside track/album).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpotifyArtist {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub images: Vec<SpotifyImage>,
    pub uri: Option<String>,
}

/// Simplifed album object.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpotifyAlbum {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub images: Vec<SpotifyImage>,
    #[serde(default)]
    pub artists: Vec<SpotifyArtist>,
    pub release_date: Option<String>,
    pub total_tracks: Option<u32>,
    pub uri: Option<String>,
}

/// Full track object.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpotifyTrack {
    pub id: String,
    pub name: String,
    pub duration_ms: u64,
    #[serde(default)]
    pub artists: Vec<SpotifyArtist>,
    pub album: Option<SpotifyAlbum>,
    pub uri: Option<String>,
    pub explicit: Option<bool>,
    pub popularity: Option<u32>,
    pub track_number: Option<u32>,
}

/// Playlist object (simplified).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpotifyPlaylist {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub images: Vec<SpotifyImage>,
    pub owner: Option<PlaylistOwner>,
    pub tracks: Option<PlaylistTracksRef>,
    pub uri: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlaylistOwner {
    pub id: String,
    pub display_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlaylistTracksRef {
    pub total: u64,
    pub href: String,
}

/// Paging object for /v1/me/tracks (liked songs).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PagingSavedTrack {
    #[serde(default)]
    pub items: Vec<SavedTrackItem>,
    pub total: u64,
    pub limit: u64,
    pub offset: u64,
    pub next: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SavedTrackItem {
    pub track: SpotifyTrack,
    pub added_at: Option<String>,
}

/// Paging object for playlists.
///
/// Spotify can return `null` elements inside `items[]` (unavailable playlists).
/// Each item is `Option<SpotifyPlaylist>` to handle that gracefully.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PagingPlaylist {
    #[serde(default)]
    pub items: Vec<Option<SpotifyPlaylist>>,
    pub total: u64,
    pub limit: u64,
    pub offset: u64,
    pub next: Option<String>,
}

/// Paging object for albums.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PagingAlbum {
    #[serde(default)]
    pub items: Vec<Option<SpotifyAlbum>>,
    pub total: u64,
    pub limit: u64,
    pub offset: u64,
    pub next: Option<String>,
}

/// Paging object for tracks.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PagingTrack {
    #[serde(default)]
    pub items: Vec<Option<SpotifyTrack>>,
    pub total: u64,
    pub limit: u64,
    pub offset: u64,
    pub next: Option<String>,
}

/// Paging object for artists.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PagingArtist {
    #[serde(default)]
    pub items: Vec<Option<SpotifyArtist>>,
    pub total: u64,
    pub limit: u64,
    pub offset: u64,
    pub next: Option<String>,
}

/// Recently played response.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentlyPlayedResponse {
    #[serde(default)]
    pub items: Vec<PlayHistoryItem>,
    pub next: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayHistoryItem {
    pub track: SpotifyTrack,
    pub played_at: Option<String>,
}

/// Search response.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResponse {
    pub tracks: Option<PagingTrack>,
    pub albums: Option<PagingAlbum>,
    pub artists: Option<PagingArtist>,
    pub playlists: Option<PagingPlaylist>,
}

/// Unified account status returned to the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpotifyAccountStatus {
    pub connected: bool,
    pub user_id: Option<String>,
    pub display_name: Option<String>,
    pub email: Option<String>,
    pub product: Option<String>,
    pub image_url: Option<String>,
}

/// Unified track info returned to the frontend (avoids exposing raw Spotify models).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpotifyTrackInfo {
    pub id: String,
    pub title: String,
    pub artist: String,
    pub album: Option<String>,
    pub album_id: Option<String>,
    pub duration_ms: u64,
    pub image_url: Option<String>,
    pub uri: Option<String>,
    pub explicit: Option<bool>,
    pub popularity: Option<u32>,
    pub track_number: Option<u32>,
}

impl From<&SpotifyTrack> for SpotifyTrackInfo {
    fn from(t: &SpotifyTrack) -> Self {
        SpotifyTrackInfo {
            id: t.id.clone(),
            title: t.name.clone(),
            artist: t.artists.first().map(|a| a.name.clone()).unwrap_or_default(),
            album: t.album.as_ref().map(|a| a.name.clone()),
            album_id: t.album.as_ref().map(|a| a.id.clone()),
            duration_ms: t.duration_ms,
            image_url: t
                .album
                .as_ref()
                .and_then(|a| a.images.first().map(|i| i.url.clone())),
            uri: t.uri.clone(),
            explicit: t.explicit,
            popularity: t.popularity,
            track_number: t.track_number,
        }
    }
}

/// Unified playlist info.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpotifyPlaylistInfo {
    pub id: String,
    pub name: String,
    pub image_url: Option<String>,
    pub owner: Option<String>,
    pub track_count: u64,
    pub uri: Option<String>,
    pub description: Option<String>,
}

impl From<&SpotifyPlaylist> for SpotifyPlaylistInfo {
    fn from(p: &SpotifyPlaylist) -> Self {
        SpotifyPlaylistInfo {
            id: p.id.clone(),
            name: p.name.clone(),
            image_url: p.images.first().map(|i| i.url.clone()),
            owner: p.owner.as_ref().and_then(|o| o.display_name.clone()),
            track_count: p.tracks.as_ref().map(|t| t.total).unwrap_or(0),
            uri: p.uri.clone(),
            description: p.description.clone(),
        }
    }
}

/// Unified album info.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpotifyAlbumInfo {
    pub id: String,
    pub name: String,
    pub artist: String,
    pub image_url: Option<String>,
    pub release_date: Option<String>,
    pub total_tracks: Option<u32>,
    pub uri: Option<String>,
}

impl From<&SpotifyAlbum> for SpotifyAlbumInfo {
    fn from(a: &SpotifyAlbum) -> Self {
        SpotifyAlbumInfo {
            id: a.id.clone(),
            name: a.name.clone(),
            artist: a.artists.first().map(|ar| ar.name.clone()).unwrap_or_default(),
            image_url: a.images.first().map(|i| i.url.clone()),
            release_date: a.release_date.clone(),
            total_tracks: a.total_tracks,
            uri: a.uri.clone(),
        }
    }
}

/// Unified artist info.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpotifyArtistInfo {
    pub id: String,
    pub name: String,
    pub image_url: Option<String>,
    pub uri: Option<String>,
}

impl From<&SpotifyArtist> for SpotifyArtistInfo {
    fn from(a: &SpotifyArtist) -> Self {
        SpotifyArtistInfo {
            id: a.id.clone(),
            name: a.name.clone(),
            image_url: a.images.first().map(|i| i.url.clone()),
            uri: a.uri.clone(),
        }
    }
}

/// Search results (unified).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpotifySearchResults {
    pub tracks: Vec<SpotifyTrackInfo>,
    pub albums: Vec<SpotifyAlbumInfo>,
    pub artists: Vec<SpotifyArtistInfo>,
    pub playlists: Vec<SpotifyPlaylistInfo>,
}

/// Paginated track list.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaginatedSpotifyTracks {
    pub items: Vec<SpotifyTrackInfo>,
    pub total: u64,
    pub offset: u64,
    pub has_more: bool,
}

/// Spotify Connect device (GET /v1/me/player/devices).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpotifyDevice {
    pub id: Option<String>,
    pub is_active: bool,
    pub is_private_session: bool,
    pub is_restricted: bool,
    pub name: String,
    /// JSON field is `type`, a reserved Rust keyword.
    #[serde(rename = "type")]
    pub device_type: String,
    pub volume_percent: Option<u32>,
    pub supports_volume: Option<bool>,
}
