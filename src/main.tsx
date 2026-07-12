import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { applyTheme, readStoredTheme, usePlayerStore } from "./state/usePlayerStore";
import { loadPersistedLibrary } from "./lib/libraryPersistence";

// Apply the persisted theme BEFORE React mounts so the first paint
// already reflects the user's choice — no flash of the default theme.
const initialTheme = readStoredTheme()
applyTheme(initialTheme)
usePlayerStore.setState({ theme: initialTheme })

// Load the persisted library BEFORE React mounts. Top-level await is
// supported by Vite's ESM build. Blocking the first render keeps the
// store consistent from the very first frame: the library is never
// briefly empty, and the user can't race the load by clicking "+ ADD".
// On any failure (missing file, corrupt JSON, version mismatch) the
// store stays empty and the user sees the normal empty state.
const persisted = await loadPersistedLibrary()
if (persisted) {
  // Clamp currentIndex in case the persisted state references an
  // out-of-bounds track (e.g. library shrunk by an external edit).
  const currentIndex = Math.max(
    -1,
    Math.min(persisted.tracks.length - 1, persisted.currentIndex),
  )
  usePlayerStore.setState({
    tracks: persisted.tracks,
    currentIndex,
    // Always start paused with the position reset — we never auto-play
    // on launch, even if the user closed the app mid-track.
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  })
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
