import { invoke } from '@tauri-apps/api/core'

// ── Types matching the Rust backend models ───────────────────────

export interface SpotifyAccountStatus {
  connected: boolean
  user_id?: string
  display_name?: string
  email?: string
  product?: string
  image_url?: string
}

export interface SpotifyTrackInfo {
  id: string
  title: string
  artist: string
  album?: string
  album_id?: string
  duration_ms: number
  image_url?: string
  uri?: string
  explicit?: boolean
  popularity?: number
  track_number?: number
}

export interface SpotifyPlaylistInfo {
  id: string
  name: string
  image_url?: string
  owner?: string
  track_count: number
  uri?: string
  description?: string
}

export interface SpotifyAlbumInfo {
  id: string
  name: string
  artist: string
  image_url?: string
  release_date?: string
  total_tracks?: number
  uri?: string
}

export interface SpotifyArtistInfo {
  id: string
  name: string
  image_url?: string
  uri?: string
}

export interface PaginatedSpotifyTracks {
  items: SpotifyTrackInfo[]
  total: number
  offset: number
  has_more: boolean
}

export interface SpotifySearchResults {
  tracks: SpotifyTrackInfo[]
  albums: SpotifyAlbumInfo[]
  artists: SpotifyArtistInfo[]
  playlists: SpotifyPlaylistInfo[]
}

export interface PlaylistListResponse {
  items: SpotifyPlaylistInfo[]
  total: number
  has_more: boolean
}

export interface LoginStartResponse {
  auth_url: string
  verifier: string
  redirect_uri: string
}

export interface SpotifyDevice {
  id: string
  name: string
  is_active: boolean
  type: string
  volume_percent?: number
}

// ── Service functions ────────────────────────────────────────────

export const spotifyService = {
  // Config
  getClientId: () => invoke<string>('spotify_get_client_id'),

  setClientId: (clientId: string) =>
    invoke<void>('spotify_set_client_id', { clientId }),

  isConfigured: () => invoke<boolean>('spotify_is_configured'),

  // Auth
  getAccessToken: () => invoke<string>('get_spotify_access_token'),

  beginLogin: () =>
    invoke<LoginStartResponse>('spotify_begin_login'),

  completeLogin: (redirectUri: string, code: string, verifier: string) =>
    invoke<SpotifyAccountStatus>('spotify_complete_login', {
      redirectUri,
      code,
      verifier,
    }),

  logout: () => invoke<void>('spotify_logout'),

  accountStatus: () =>
    invoke<SpotifyAccountStatus>('spotify_account_status'),

  // Library
  likedSongs: (offset: number, limit: number) =>
    invoke<PaginatedSpotifyTracks>('spotify_liked_songs', { offset, limit }),

  playlists: (offset: number, limit: number) =>
    invoke<PlaylistListResponse>('spotify_playlists', { offset, limit }),

  playlistTracks: (playlistId: string, offset: number, limit: number) =>
    invoke<PaginatedSpotifyTracks>('spotify_playlist_tracks', {
      playlistId,
      offset,
      limit,
    }),

  topTracks: (offset: number, limit: number) =>
    invoke<PaginatedSpotifyTracks>('spotify_top_tracks', { offset, limit }),

  search: (query: string, types: string[], limit: number) =>
    invoke<SpotifySearchResults>('spotify_search', { query, types, limit }),

  // Playback
  playUris: (uris: string[], deviceId?: string) =>
    invoke<void>('spotify_play_uris', { uris, deviceId }),

  // Librespot
  librespotVersion: () => invoke<string>('librespot_version'),

  librespotIsInitialised: () => invoke<boolean>('librespot_is_initialised'),

  librespotStart: (authData: string) =>
    invoke<void>('librespot_start', { authData }),

  librespotStop: () => invoke<void>('librespot_stop'),

  librespotPlay: (uri: string) => invoke<void>('librespot_play', { uri }),

  librespotPause: () => invoke<void>('librespot_pause'),

  librespotResume: () => invoke<void>('librespot_resume'),

  librespotSeek: (positionMs: number) =>
    invoke<void>('librespot_seek', { positionMs }),

  librespotSetVolume: (volume: number) =>
    invoke<void>('librespot_set_volume', { volume }),

  librespotGetState: () =>
    invoke<{
      is_playing: boolean
      position_ms: number
      duration_ms: number
      volume: number
    }>('librespot_get_state'),

  resume: (deviceId?: string) =>
    invoke<void>('spotify_resume', { deviceId }),

  pause: () => invoke<void>('spotify_pause'),

  next: () => invoke<void>('spotify_next'),

  prev: () => invoke<void>('spotify_prev'),

  getDevices: () => invoke<SpotifyDevice[]>('spotify_get_devices'),
}
