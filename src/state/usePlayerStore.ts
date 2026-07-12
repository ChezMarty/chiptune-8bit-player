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
