import { create } from 'zustand'
import {
  spotifyService,
  type SpotifyAccountStatus,
  type SpotifyTrackInfo,
  type SpotifyPlaylistInfo,
  type SpotifySearchResults,
  type SpotifyDevice,
} from '../lib/spotify'
import { readBoolPref, writeBoolPref } from '../lib/preferences'

// ── Section types ────────────────────────────────────────────────

export type SpotifySection =
  | 'liked'
  | 'playlists'
  | 'top'
  | 'search'

const LIBSRESPOT_WARNING_KEY = 'chiptune-librespot-warning-dismissed'

// ── Store state ──────────────────────────────────────────────────

interface SpotifyState {
  // Config
  clientId: string
  isConfigured: boolean
  configLoading: boolean

  // Auth
  account: SpotifyAccountStatus | null
  loginLoading: boolean
  loginError: string | null

  // Active section
  activeSection: SpotifySection

  // Library data
  likedSongs: SpotifyTrackInfo[]
  playlists: SpotifyPlaylistInfo[]
  topTracks: SpotifyTrackInfo[]
  searchResults: SpotifySearchResults | null

  // Loading flags
  loadingLiked: boolean
  loadingPlaylists: boolean
  loadingTop: boolean
  loadingSearch: boolean

  // Pagination
  likedOffset: number
  likedHasMore: boolean
  playlistOffset: number
  playlistHasMore: boolean

  // Errors
  error: string | null

  // Playback
  isPlaying: boolean
  playbackError: string | null
  devices: SpotifyDevice[]
  activeDeviceId: string | null
  loadingDevices: boolean

  // Librespot state
  librespotVersion: string
  librespotInitialised: boolean
  librespotVersionLoading: boolean
  /** Whether the user has accepted the librespot warning dialog. */
  librespotWarningDismissed: boolean
  /** Whether to show the warning again on next Spotify play (resettable). */
  librespotShowWarning: boolean

  // Actions
  loadConfig: () => Promise<void>
  saveClientId: (clientId: string) => Promise<void>
  checkAuth: () => Promise<void>
  beginLogin: () => Promise<{ verifier: string; redirectUri: string } | null>
  completeLogin: (redirectUri: string, code: string, verifier: string) => Promise<void>
  doLogout: () => Promise<void>
  setActiveSection: (section: SpotifySection) => void
  loadLikedSongs: (loadMore?: boolean) => Promise<void>
  loadPlaylists: (loadMore?: boolean) => Promise<void>
  loadTopTracks: () => Promise<void>
  doSearch: (query: string) => Promise<void>
  clearError: () => void
  loadPlaylistTracks: (playlistId: string) => Promise<SpotifyTrackInfo[]>

  // Playback actions
  playTrack: (track: SpotifyTrackInfo) => Promise<void>
  resumePlayback: () => Promise<void>
  pausePlayback: () => Promise<void>
  skipNext: () => Promise<void>
  skipPrev: () => Promise<void>
  refreshDevices: () => Promise<void>
  setActiveDevice: (deviceId: string) => void

  // Librespot actions
  loadLibrespotVersion: () => Promise<void>
  setLibrespotWarningDismissed: (v: boolean) => void
  setLibrespotShowWarning: (v: boolean) => void
}

const PAGE_SIZE = 30

export const useSpotifyStore = create<SpotifyState>((set, get) => ({
  clientId: '',
  isConfigured: false,
  configLoading: false,
  account: null,
  loginLoading: false,
  loginError: null,
  activeSection: 'liked',
  likedSongs: [],
  playlists: [],
  topTracks: [],
  searchResults: null,
  loadingLiked: false,
  loadingPlaylists: false,
  loadingTop: false,
  loadingSearch: false,
  likedOffset: 0,
  likedHasMore: true,
  playlistOffset: 0,
  playlistHasMore: true,
  error: null,

  isPlaying: false,
  playbackError: null,
  devices: [],
  activeDeviceId: null,
  loadingDevices: false,

  // Librespot state
  librespotVersion: '',
  librespotInitialised: false,
  librespotVersionLoading: false,
  librespotWarningDismissed: readBoolPref(LIBSRESPOT_WARNING_KEY, false),
  librespotShowWarning: false,

  loadConfig: async () => {
    set({ configLoading: true })
    try {
      const [clientId, configured] = await Promise.all([
        spotifyService.getClientId(),
        spotifyService.isConfigured(),
      ])
      set({ clientId, isConfigured: configured, configLoading: false })
    } catch {
      set({ configLoading: false })
    }
  },

  saveClientId: async (clientId) => {
    set({ configLoading: true })
    try {
      await spotifyService.setClientId(clientId)
      set({ clientId: clientId.trim(), isConfigured: clientId.trim().length > 0, configLoading: false })
    } catch {
      set({ configLoading: false })
    }
  },

  checkAuth: async () => {
    try {
      const status = await spotifyService.accountStatus()
      set({ account: status })
    } catch {
      set({ account: { connected: false } })
    }
  },

  beginLogin: async () => {
    set({ loginLoading: true, loginError: null })
    try {
      const { auth_url, verifier, redirect_uri } = await spotifyService.beginLogin()
      // Open the browser for the user to authorize.
      try {
        const { openUrl } = await import('@tauri-apps/plugin-opener')
        await openUrl(auth_url)
      } catch {
        // Fallback: just return values for manual flow.
      }
      set({ loginLoading: false })
      return { verifier, redirectUri: redirect_uri }
    } catch (e) {
      set({ loginError: String(e), loginLoading: false })
      return null
    }
  },

  completeLogin: async (redirectUri, code, verifier) => {
    set({ loginLoading: true, loginError: null })
    try {
      const status = await spotifyService.completeLogin(redirectUri, code, verifier)
      set({ account: status, loginLoading: false })
      // Auto-load liked songs after login.
      get().loadLikedSongs()
    } catch (e) {
      set({ loginError: String(e), loginLoading: false })
    }
  },

  doLogout: async () => {
    set({ loginLoading: true })
    try {
      await spotifyService.logout()
      set({
        account: { connected: false },
        likedSongs: [],
        playlists: [],
        topTracks: [],
        searchResults: null,
        loginLoading: false,
        loginError: null,
      })
    } catch (e) {
      set({ loginError: String(e), loginLoading: false })
    }
  },

  setActiveSection: (section) => {
    set({ activeSection: section })
    const s = get()
    // Lazy-load on section switch.
    switch (section) {
      case 'liked':
        if (s.likedSongs.length === 0) s.loadLikedSongs()
        break
      case 'playlists':
        if (s.playlists.length === 0) s.loadPlaylists()
        break
      case 'top':
        if (s.topTracks.length === 0) s.loadTopTracks()
        break
    }
  },

  loadLikedSongs: async (loadMore = false) => {
    const s = get()
    if (s.loadingLiked) return
    const offset = loadMore ? s.likedOffset + PAGE_SIZE : 0
    set({ loadingLiked: true, error: null })
    try {
      const result = await spotifyService.likedSongs(offset, PAGE_SIZE)
      set({
        likedSongs: loadMore ? [...s.likedSongs, ...result.items] : result.items,
        likedOffset: result.offset,
        likedHasMore: result.has_more,
        loadingLiked: false,
      })
    } catch (e) {
      set({ error: String(e), loadingLiked: false })
    }
  },

  loadPlaylists: async (loadMore = false) => {
    const s = get()
    if (s.loadingPlaylists) return
    const offset = loadMore ? s.playlistOffset + PAGE_SIZE : 0
    set({ loadingPlaylists: true, error: null })
    try {
      const result = await spotifyService.playlists(offset, PAGE_SIZE)
      set({
        playlists: loadMore ? [...s.playlists, ...result.items] : result.items,
        playlistOffset: offset,
        playlistHasMore: result.has_more,
        loadingPlaylists: false,
      })
    } catch (e) {
      set({ error: String(e), loadingPlaylists: false })
    }
  },

  loadTopTracks: async () => {
    set({ loadingTop: true, error: null })
    try {
      const result = await spotifyService.topTracks(0, 20)
      set({ topTracks: result.items, loadingTop: false })
    } catch (e) {
      set({ error: String(e), loadingTop: false })
    }
  },

  doSearch: async (query) => {
    if (!query.trim()) {
      console.log('[SEARCH] Empty query — clearing results')
      set({ searchResults: null })
      return
    }
    console.log('[SEARCH] doSearch called with query:', JSON.stringify(query))
    set({ loadingSearch: true, error: null })
    try {
      // Clamp limit to Spotify's allowed range (1..=50).
      const rawLimit = 20
      const limit = Math.max(1, Math.min(50, rawLimit))
      if (limit !== rawLimit) {
        console.warn('[SEARCH] limit clamped from', rawLimit, 'to', limit)
      }
      // ── Log the EXACT params being sent to Tauri ───────────
      const params = {
        query: query,
        types: ['track', 'album', 'artist', 'playlist'],
        limit: limit,
      }
      console.log('[SEARCH] ================================')
      console.log('[SEARCH]   Search query:', JSON.stringify(params.query))
      console.log('[SEARCH]   limit:', params.limit, '(type:', typeof params.limit, ') IsFinite:', Number.isFinite(params.limit), 'IsInt:', Number.isInteger(params.limit), 'InRange(1-50):', params.limit >= 1 && params.limit <= 50)
      console.log('[SEARCH]   offset: (not sent)')
      console.log('[SEARCH]   type:', params.types)
      console.log('[SEARCH]   market: (not sent)')
      console.log('[SEARCH]   params object:', params)
      console.log('[SEARCH]   Final URL: (see Rust terminal output and error message below — the URL is included in the error response)')
      console.log('[SEARCH] ================================')

      const searchTimerLabel = `[SEARCH] search-request-${Date.now()}`
      console.time(searchTimerLabel)
      const result = await spotifyService.search(
        params.query,
        params.types,
        params.limit,
      )
      console.timeEnd(searchTimerLabel)
      console.log('[SEARCH] Response received:', JSON.stringify({
        tracks: result.tracks.length,
        albums: result.albums.length,
        artists: result.artists.length,
        playlists: result.playlists.length,
      }))
      set({ searchResults: result, loadingSearch: false })
      console.log('[SEARCH] store.searchResults updated — React should re-render', {
        hasResults: !!get().searchResults,
        trackCount: get().searchResults?.tracks.length,
      })
    } catch (e) {
      console.error('[SEARCH] Request failed:', e)
      set({ error: String(e), loadingSearch: false })
    }
  },

  clearError: () => set({ error: null, loginError: null }),

  loadPlaylistTracks: async (playlistId) => {
    try {
      const result = await spotifyService.playlistTracks(playlistId, 0, 50)
      return result.items
    } catch (e) {
      set({ error: String(e) })
      return []
    }
  },

  // ── Playback actions ──────────────────────────────────────────

  playTrack: async (track) => {
    if (!track.uri) {
      set({ playbackError: 'No Spotify URI available for this track' })
      return
    }
    set({ playbackError: null })
    try {
      console.log('[spotify] Playing track via Librespot engine:', track.title, track.uri)
      // Build metadata from the SpotifyTrackInfo and pass it to the engine
      // so the UI can display title/artist/art immediately.
      const meta = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album ?? undefined,
        durationSec: (track.duration_ms ?? 0) / 1000,
        imageUrl: track.image_url ?? null,
        uri: track.uri,
      }
      // Use the playback engine — it auto-selects Librespot or SDK.
      const { playbackEngine } = await import('../lib/playback/engine')
      await playbackEngine.play(track.uri, meta)
      set({ isPlaying: true, playbackError: null })
    } catch (e) {
      const msg = String(e)
      console.error('[spotify] Playback failed:', msg)
      set({ playbackError: msg, isPlaying: false })
    }
  },

  resumePlayback: async () => {
    const s = get()
    set({ playbackError: null })
    try {
      await spotifyService.resume(s.activeDeviceId ?? undefined)
      set({ isPlaying: true, playbackError: null })
    } catch (e) {
      const msg = String(e)
      console.error('[spotify] Resume failed:', msg)
      set({ playbackError: msg })
    }
  },

  pausePlayback: async () => {
    set({ playbackError: null })
    try {
      await spotifyService.pause()
      set({ isPlaying: false, playbackError: null })
    } catch (e) {
      const msg = String(e)
      console.error('[spotify] Pause failed:', msg)
      set({ playbackError: msg })
    }
  },

  skipNext: async () => {
    set({ playbackError: null })
    try {
      await spotifyService.next()
      set({ playbackError: null })
    } catch (e) {
      const msg = String(e)
      console.error('[spotify] Next failed:', msg)
      set({ playbackError: msg })
    }
  },

  skipPrev: async () => {
    set({ playbackError: null })
    try {
      await spotifyService.prev()
      set({ playbackError: null })
    } catch (e) {
      const msg = String(e)
      console.error('[spotify] Prev failed:', msg)
      set({ playbackError: msg })
    }
  },

  refreshDevices: async () => {
    set({ loadingDevices: true, playbackError: null })
    try {
      const devices = await spotifyService.getDevices()
      const activeDevice = devices.find((d) => d.is_active)
      console.log('[spotify] Devices:', devices.map((d) => `${d.name} (${d.id}) active=${d.is_active}`))
      set({
        devices,
        activeDeviceId: activeDevice?.id ?? null,
        loadingDevices: false,
      })
    } catch (e) {
      const msg = String(e)
      console.error('[spotify] Get devices failed:', msg)
      set({ playbackError: msg, loadingDevices: false })
    }
  },

  setActiveDevice: (deviceId) => {
    set({ activeDeviceId: deviceId })
  },

  // ── Librespot actions ────────────────────────────────────────

  loadLibrespotVersion: async () => {
    set({ librespotVersionLoading: true })
    try {
      const version = await spotifyService.librespotVersion()
      const initialised = await spotifyService.librespotIsInitialised()
      set({ librespotVersion: version, librespotInitialised: initialised, librespotVersionLoading: false })
    } catch (e) {
      set({ librespotVersion: 'unavailable', librespotInitialised: false, librespotVersionLoading: false })
    }
  },

  setLibrespotWarningDismissed: (v) => {
    set({ librespotWarningDismissed: v })
    writeBoolPref(LIBSRESPOT_WARNING_KEY, v)
  },

  setLibrespotShowWarning: (v) => {
    set({ librespotShowWarning: v })
  },
}))
