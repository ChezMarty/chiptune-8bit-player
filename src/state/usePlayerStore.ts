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

  // Actions
  addTracks: (tracks: Track[]) => void
  removeTrack: (id: string) => void
  setCurrent: (idx: number) => void
  setPlaying: (v: boolean) => void
  setCurrentTime: (t: number) => void
  setDuration: (d: number) => void
  setVolume: (v: number) => void
  setImporting: (v: boolean) => void
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
