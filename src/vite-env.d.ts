/// <reference types="vite/client" />

interface Window {
  __CHIPTUNE_STORES__?: {
    player: typeof import('./state/usePlayerStore').usePlayerStore
    spotify: typeof import('./state/useSpotifyStore').useSpotifyStore
  }
}
