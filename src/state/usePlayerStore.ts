import { create } from 'zustand'

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

const THEME_STORAGE_KEY = 'chiptune-theme'

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
  volume: number

  // UI flags
  importing: boolean

  // Theme
  theme: ThemeId

  // Actions
  addTracks: (tracks: Track[]) => void
  removeTrack: (id: string) => void
  setCurrent: (idx: number) => void
  setPlaying: (v: boolean) => void
  setCurrentTime: (t: number) => void
  setDuration: (d: number) => void
  setVolume: (v: number) => void
  setImporting: (v: boolean) => void
  setTheme: (theme: ThemeId) => void
  next: () => void
  prev: () => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  tracks: [],
  currentIndex: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  importing: false,
  theme: 'nes',

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
}))
