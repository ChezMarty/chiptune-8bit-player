import { create } from 'zustand'
import {
  writeBoolPref,
  writeIntPref,
  writeStringPref,
} from '../lib/preferences'

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

/** The 5 theme ids. Order here also dictates the dropdown order. */
export type ThemeId = 'nes' | 'gameboy' | 'c64' | 'gbc' | 'arcade'

export const THEME_IDS: ThemeId[] = ['nes', 'gameboy', 'c64', 'gbc', 'arcade']

export const THEME_LABELS: Record<ThemeId, string> = {
  nes: 'NES',
  gameboy: 'Game Boy',
  c64: 'C64',
  gbc: 'Game Boy Color',
  arcade: 'Arcade',
}

/** Localized theme labels (e.g. `NES (Nintendo)` in French). */
export const THEME_LABELS_LOCALIZED: Record<'en' | 'fr', Record<ThemeId, string>> = {
  en: {
    nes: 'NES',
    gameboy: 'Game Boy',
    c64: 'C64',
    gbc: 'Game Boy Color',
    arcade: 'Arcade',
  },
  fr: {
    nes: 'NES (Nintendo)',
    gameboy: 'Game Boy (Nintendo)',
    c64: 'C64 (Commodore)',
    gbc: 'Game Boy Couleur (Nintendo)',
    arcade: 'Arcade',
  },
}

/** What the user *chose* — `'os'` means auto-detect from navigator.language. */
export type LocaleChoice = 'en' | 'fr' | 'os'

export const LOCALE_CHOICES: LocaleChoice[] = ['en', 'fr', 'os']

const THEME_STORAGE_KEY = 'chiptune-theme'

export const LANGUAGE_STORAGE_KEY = 'chiptune-language'
export const START_VOLUME_STORAGE_KEY = 'chiptune-start-volume'
export const AUTOPLAY_STORAGE_KEY = 'chiptune-auto-play-import'
export const STOP_REWINDS_STORAGE_KEY = 'chiptune-stop-rewinds'
export const SHUFFLE_IMPORT_STORAGE_KEY = 'chiptune-shuffle-import'
export const ALWAYS_ON_TOP_STORAGE_KEY = 'chiptune-always-on-top'

/** Read the persisted theme from localStorage, validating against the union. */
export function readStoredTheme(): ThemeId {
  if (typeof window === 'undefined') return 'nes'
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (raw && (THEME_IDS as string[]).includes(raw)) {
      return raw as ThemeId
    }
  } catch {
    // localStorage may throw in private-browsing or sandboxed contexts.
    // Fall through to the default.
  }
  return 'nes'
}

/** Apply a theme id to the document. Safe to call before React mounts. */
export function applyTheme(theme: ThemeId): void {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
}

interface PlayerState {
  // Library
  tracks: Track[]

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

  // Locale
  /** What the user chose. `'os'` is resolved at render to `'en'` or `'fr'`. */
  locale: LocaleChoice

  // Window display
  alwaysOnTop: boolean

  // Playback defaults (persisted preferences)
  autoPlayOnImport: boolean
  stopRewinds: boolean
  shuffleOnImport: boolean

  // Actions
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
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  tracks: [],
  currentIndex: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  startVolume: 70,
  importing: false,
  theme: 'nes',
  locale: 'os',
  alwaysOnTop: false,
  autoPlayOnImport: false,
  stopRewinds: false,
  shuffleOnImport: false,

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

  setPlaying: (v) => set({ isPlaying: v }),
  setCurrentTime: (t) => set({ currentTime: t }),
  setDuration: (d) => set({ duration: Number.isFinite(d) ? d : 0 }),
  setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
  setStartVolume: (v) => {
    const clamped = Math.max(0, Math.min(100, Math.round(v)))
    set({ startVolume: clamped, volume: clamped / 100 })
    writeIntPref(START_VOLUME_STORAGE_KEY, clamped)
  },
  setImporting: (v) => set({ importing: v }),

  setTheme: (theme) => {
    applyTheme(theme)
    set({ theme })
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // localStorage unavailable; the in-memory value still works for the session.
    }
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
}))
