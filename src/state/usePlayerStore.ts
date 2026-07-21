import { create } from 'zustand'
import {
  writeBoolPref,
  writeIntPref,
  writeStringPref,
} from '../lib/preferences'
import type { ThemeId, ThemeSortMode } from '../themes/types'
import { ALL_THEMES, THEME_MAP } from '../themes/definitions'
import {
  applyThemeTokens,
  writeStoredTheme,
  readUserMeta,
  writeUserMeta,
  toggleFavorite,
} from '../themes/engine'
import type { NowPlayingMeta } from '../lib/playback/types'

export type { ThemeId, ThemeSortMode } from '../themes/types'

/** Which playback engine is driving the audio output right now. */
export type PlaybackSource = 'local' | 'spotify-sdk' | 'spotify-librespot'

export type PlaybackStatus = 'stopped' | 'loading' | 'playing' | 'paused' | 'ended' | 'error'

export interface Track {
  id: string
  path: string
  title: string
  artist: string
  album?: string
  durationSec: number
  hasArt: boolean
  /** Pixelated, posterized data URL for the on-disc label art. */
  artDataUrl?: string | null
}

/** All valid theme IDs derived from the definitions. */
export const THEME_IDS: ThemeId[] = ALL_THEMES.map((d) => d.id)

/** What the user *chose* — `'os'` means auto-detect from navigator.language. */
export type LocaleChoice = 'en' | 'fr' | 'os'

export const LOCALE_CHOICES: LocaleChoice[] = ['en', 'fr', 'os']

export const LANGUAGE_STORAGE_KEY = 'chiptune-language'
export const START_VOLUME_STORAGE_KEY = 'chiptune-start-volume'
export const AUTOPLAY_STORAGE_KEY = 'chiptune-auto-play-import'
export const STOP_REWINDS_STORAGE_KEY = 'chiptune-stop-rewinds'
export const SHUFFLE_IMPORT_STORAGE_KEY = 'chiptune-shuffle-import'
export const ALWAYS_ON_TOP_STORAGE_KEY = 'chiptune-always-on-top'

interface PlayerState {
  // Library
  tracks: Track[]

  // Now-playing metadata (provider-agnostic, set by PlaybackEngine)
  nowPlaying: NowPlayingMeta | null
  /** Detailed playback status for UI state display. */
  playbackStatus: PlaybackStatus

  // Playback
  currentIndex: number
  isPlaying: boolean
  currentTime: number
  duration: number
  /** Runtime volume (0..1), drives the audio element. */
  volume: number
  /** Persisted starting volume (0..100). Applied at boot. */
  startVolume: number

  // UI flags
  importing: boolean

  // Theme
  theme: ThemeId
  themeFavorites: ThemeId[]
  themeSortMode: ThemeSortMode

  // Locale
  /** What the user chose. `'os'` is resolved at render to `'en'` or `'fr'`. */
  locale: LocaleChoice

  // Window display
  alwaysOnTop: boolean

  // Playback defaults (persisted preferences)
  autoPlayOnImport: boolean
  stopRewinds: boolean
  shuffleOnImport: boolean

  // Active playback source (which engine is driving audio)
  activeSource: PlaybackSource

  // Drag state — when true, progress callbacks must NOT write currentTime
  // (the UI handles position updates during drag).
  isDragging: boolean

  // Actions
  setNowPlaying: (meta: NowPlayingMeta | null) => void
  setPlaybackStatus: (status: PlaybackStatus) => void
  addTracks: (tracks: Track[]) => void
  removeTrack: (id: string) => void
  setCurrent: (idx: number) => void
  setPlaying: (v: boolean) => void
  setCurrentTime: (t: number) => void
  setDuration: (d: number) => void
  setVolume: (v: number) => void
  setStartVolume: (v: number) => void
  setImporting: (v: boolean) => void
  setTheme: (theme: ThemeId) => void
  toggleThemeFavorite: (id: ThemeId) => void
  setThemeSortMode: (mode: ThemeSortMode) => void
  setLocale: (l: LocaleChoice) => void
  /**
   * Generic setter that mutates in-memory state and (best-effort) persists
   * to localStorage for known preference keys. Used by the on-load hooks
   * in `main.tsx` so they share one helper.
   */
  setPref: <K extends keyof PlayerState>(key: K, value: PlayerState[K]) => void
  /** Apply/persist toggle for "always-on-top" window. */
  setAlwaysOnTop: (v: boolean) => Promise<void>
  setAutoPlayOnImport: (v: boolean) => void
  setStopRewinds: (v: boolean) => void
  setShuffleOnImport: (v: boolean) => void
  next: () => void
  prev: () => void
  /** Swap a track with its neighbor in the given direction. No-op at edges. */
  moveTrack: (id: string, direction: 'up' | 'down') => void
  /** Move a track to a specific absolute index in the library. */
  moveTrackTo: (id: string, targetIndex: number) => void
  /** Move a track to play immediately after the current track. */
  playNext: (id: string) => void
  /** Randomize the order of upcoming tracks (Fisher-Yates). No-op if < 2 upcoming. */
  shuffleUpcoming: () => void
  /** Remove all tracks after the current track. No-op if already empty. */
  clearUpcoming: () => void
  /** Set the active playback source (local, spotify-sdk, spotify-librespot). */
  setActiveSource: (source: PlaybackSource) => void
  /** GATE progress callbacks during user drag — UI writes to currentTime exclusively. */
  setDragging: (v: boolean) => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  tracks: [],
  nowPlaying: null,
  playbackStatus: 'stopped',
  currentIndex: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  startVolume: 70,
  importing: false,
  theme: 'nes',
  themeFavorites: [],
  themeSortMode: 'name' as ThemeSortMode,
  locale: 'os',
  alwaysOnTop: false,
  autoPlayOnImport: false,
  stopRewinds: false,
  shuffleOnImport: false,

  activeSource: 'local',
  isDragging: false,

  addTracks: (tracks) =>
    set((s) => ({ tracks: [...s.tracks, ...tracks] })),

  removeTrack: (id) =>
    set((s) => {
      const trackIdx = s.tracks.findIndex((t) => t.id === id)
      if (trackIdx < 0) return s
      const tracks = s.tracks.filter((t) => t.id !== id)
      let currentIndex = s.currentIndex
      if (trackIdx === currentIndex) {
        currentIndex = tracks.length > 0 ? 0 : -1
      } else if (trackIdx < currentIndex) {
        currentIndex -= 1
      }
      return { tracks, currentIndex, currentTime: 0 }
    }),

  setCurrent: (idx) =>
    set((s) => ({
      currentIndex: Math.max(-1, Math.min(s.tracks.length - 1, idx)),
      currentTime: 0,
    })),

  setPlaying: (v) => {
    console.log('[STORE] setPlaying(', v, ') ←', new Error().stack?.split('\n').slice(2).join('\n'))
    set({ isPlaying: v })
  },
  setCurrentTime: (t) => {
    const s = get()
    // Extract just the first caller line from the stack for brevity
    const stackLines = new Error().stack?.split('\n').slice(3) ?? []
    const callerLine = stackLines.find(l => !l.includes('node_modules') && !l.includes('usePlayerStore')) ?? stackLines[0] ?? 'unknown'
    console.log(
      '[STORE] setCurrentTime(', t.toFixed(3),
      ') isPlaying=', s.isPlaying,
      'status=', s.playbackStatus,
      'caller=', callerLine.trim(),
    )
    set({ currentTime: t })
  },
  setDuration: (d) => {
    console.log('[STORE] setDuration(', d, ') ←', new Error().stack?.split('\n').slice(2).join('\n'))
    set({ duration: Number.isFinite(d) ? d : 0 })
  },
  setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
  setStartVolume: (v) => {
    const clamped = Math.max(0, Math.min(100, Math.round(v)))
    set({ startVolume: clamped, volume: clamped / 100 })
    writeIntPref(START_VOLUME_STORAGE_KEY, clamped)
  },
  setImporting: (v) => set({ importing: v }),

  setTheme: (theme) => {
    const def = THEME_MAP[theme]
    if (def) {
      applyThemeTokens(def.tokens, theme)
    }
    writeStoredTheme(theme)
    set({ theme })
  },

  toggleThemeFavorite: (id) => {
    const stored = readUserMeta()
    const favorites = toggleFavorite(stored.favorites ?? [], id)
    writeUserMeta({ ...stored, favorites })
    set({ themeFavorites: favorites as ThemeId[] })
  },

  setThemeSortMode: (mode) => {
    const stored = readUserMeta()
    writeUserMeta({ ...stored, sortMode: mode })
    set({ themeSortMode: mode })
  },

  setLocale: (l) => {
    set({ locale: l })
    writeStringPref(LANGUAGE_STORAGE_KEY, l)
  },

  setPref: (key, value) => {
    set({ [key]: value } as Partial<PlayerState>)
    switch (key) {
      case 'locale':
        writeStringPref(LANGUAGE_STORAGE_KEY, String(value))
        break
      case 'startVolume':
        writeIntPref(START_VOLUME_STORAGE_KEY, Number(value))
        break
      case 'autoPlayOnImport':
        writeBoolPref(AUTOPLAY_STORAGE_KEY, Boolean(value))
        break
      case 'stopRewinds':
        writeBoolPref(STOP_REWINDS_STORAGE_KEY, Boolean(value))
        break
      case 'shuffleOnImport':
        writeBoolPref(SHUFFLE_IMPORT_STORAGE_KEY, Boolean(value))
        break
      case 'alwaysOnTop':
        writeBoolPref(ALWAYS_ON_TOP_STORAGE_KEY, Boolean(value))
        break
    }
  },

  setAlwaysOnTop: async (v) => {
    set({ alwaysOnTop: v })
    writeBoolPref(ALWAYS_ON_TOP_STORAGE_KEY, v)
    // Tauri-side application. Lazy-imported to keep the store free of
    // platform-specific imports so it can run in a plain browser preview.
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      await getCurrentWindow().setAlwaysOnTop(v)
    } catch (err) {
      console.error('[alwaysOnTop] failed', err)
    }
  },

  setAutoPlayOnImport: (v) => {
    set({ autoPlayOnImport: v })
    writeBoolPref(AUTOPLAY_STORAGE_KEY, v)
  },
  setStopRewinds: (v) => {
    set({ stopRewinds: v })
    writeBoolPref(STOP_REWINDS_STORAGE_KEY, v)
  },
  setShuffleOnImport: (v) => {
    set({ shuffleOnImport: v })
    writeBoolPref(SHUFFLE_IMPORT_STORAGE_KEY, v)
  },

  next: () => {
    const { tracks, currentIndex } = get()
    if (tracks.length === 0) return
    set({
      currentIndex: (currentIndex + 1) % tracks.length,
      currentTime: 0,
    })
  },

  prev: () => {
    const { tracks, currentIndex } = get()
    if (tracks.length === 0) return
    set({
      currentIndex: (currentIndex - 1 + tracks.length) % tracks.length,
      currentTime: 0,
    })
  },

  moveTrack: (id, direction) =>
    set((s) => {
      const idx = s.tracks.findIndex((t) => t.id === id)
      if (idx < 0) return s
      const newIdx = direction === 'up' ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= s.tracks.length) return s
      const newTracks = s.tracks.slice()
      ;[newTracks[idx], newTracks[newIdx]] = [newTracks[newIdx], newTracks[idx]]
      // Keep currentIndex pointing at the same track after the swap.
      let currentIndex = s.currentIndex
      if (idx === currentIndex) currentIndex = newIdx
      else if (newIdx === currentIndex) currentIndex = idx
      return { tracks: newTracks, currentIndex }
    }),

  moveTrackTo: (id, targetIndex) =>
    set((s) => {
      const idx = s.tracks.findIndex((t) => t.id === id)
      if (idx < 0) return s
      const clampedTarget = Math.max(0, Math.min(s.tracks.length - 1, targetIndex))
      if (idx === clampedTarget) return s
      const newTracks = s.tracks.slice()
      const [track] = newTracks.splice(idx, 1)
      // After removal, indices > idx shift down by 1. Adjust the insertion
      // point so the caller-specified targetIndex refers to the ORIGINAL
      // array positions (matches the intuitive "move to position N" API).
      const adjustedTarget = clampedTarget > idx ? clampedTarget - 1 : clampedTarget
      newTracks.splice(adjustedTarget, 0, track)
      // Re-resolve currentIndex by id so the "current" semantic follows the
      // same track regardless of where it moved to.
      const currentTrackId = s.tracks[s.currentIndex]?.id
      let currentIndex = s.currentIndex
      if (currentTrackId) {
        const resolved = newTracks.findIndex((t) => t.id === currentTrackId)
        if (resolved >= 0) currentIndex = resolved
      }
      return { tracks: newTracks, currentIndex }
    }),

  playNext: (id) =>
    set((s) => {
      const tgtIdx = s.tracks.findIndex((t) => t.id === id)
      if (tgtIdx < 0) return s
      // The target is already the current track — "next" is meaningless
      // (it would just move the same track down one slot and skip the
      // current playback). No-op preserves the playback state.
      if (tgtIdx === s.currentIndex) return s
      // No current track — just select the target.
      if (s.currentIndex < 0) {
        return { currentIndex: tgtIdx, currentTime: 0 }
      }
      const track = s.tracks[tgtIdx]
      // Remove target, then re-insert right after current. If the target
      // was BEFORE the current index, removing it shifts currentIndex down
      // by one, so we re-insert at (adjusted current + 1).
      const removingBefore = tgtIdx < s.currentIndex
      const tracks = s.tracks.filter((t) => t.id !== id)
      const newCur = removingBefore ? s.currentIndex - 1 : s.currentIndex
      const insertAt = newCur + 1
      tracks.splice(insertAt, 0, track)
      return { tracks, currentIndex: newCur }
    }),

  shuffleUpcoming: () =>
    set((s) => {
      if (s.currentIndex < 0) return s
      const head = s.tracks.slice(0, s.currentIndex + 1)
      const upcoming = s.tracks.slice(s.currentIndex + 1)
      if (upcoming.length < 2) return s
      // Fisher-Yates shuffle (unbiased). Mutates a copy; the original
      // `upcoming` array is not used after this point.
      const shuffled = upcoming.slice()
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      return { tracks: [...head, ...shuffled] }
    }),

  clearUpcoming: () =>
    set((s) => {
      if (s.currentIndex < 0) return s
      const head = s.tracks.slice(0, s.currentIndex + 1)
      if (head.length === s.tracks.length) return s
      return { tracks: head }
    }),

  setActiveSource: (source) => set({ activeSource: source }),
  setDragging: (v: boolean) => set({ isDragging: v }),

  setNowPlaying: (meta) => set({ nowPlaying: meta }),

  setPlaybackStatus: (status) => {
    console.log('[STORE] setPlaybackStatus(', status, ') ←', new Error().stack?.split('\n').slice(2).join('\n'))
    set({ playbackStatus: status })
  },
}))
