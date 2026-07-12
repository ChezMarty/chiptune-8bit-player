import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import {
  ALWAYS_ON_TOP_STORAGE_KEY,
  applyTheme,
  AUTOPLAY_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  LOCALE_CHOICES,
  readStoredTheme,
  SHUFFLE_IMPORT_STORAGE_KEY,
  STOP_REWINDS_STORAGE_KEY,
  START_VOLUME_STORAGE_KEY,
  usePlayerStore,
} from "./state/usePlayerStore";
import {
  readBoolPref,
  readIntPref,
  readStringPref,
} from "./lib/preferences";
import { loadPersistedLibrary } from "./lib/libraryPersistence";

// Apply the persisted theme BEFORE React mounts so the first paint
// already reflects the user's choice — no flash of the default theme.
const initialTheme = readStoredTheme();
applyTheme(initialTheme);
usePlayerStore.setState({ theme: initialTheme });

// Seed language preference.
const savedLocale = readStringPref(
  LANGUAGE_STORAGE_KEY,
  "os",
  LOCALE_CHOICES,
);
usePlayerStore.setState({
  locale: savedLocale as "en" | "fr" | "os",
});

// Seed starting volume (applies both the persisted 0–100 preference and
// the runtime 0..1 volume so the audio element reflects it from boot).
const savedStartVol = readIntPref(
  START_VOLUME_STORAGE_KEY,
  70,
  0,
  100,
);
usePlayerStore.setState({
  startVolume: savedStartVol,
  volume: savedStartVol / 100,
});

usePlayerStore.setState({
  autoPlayOnImport: readBoolPref(AUTOPLAY_STORAGE_KEY, false),
  stopRewinds: readBoolPref(STOP_REWINDS_STORAGE_KEY, false),
  shuffleOnImport: readBoolPref(SHUFFLE_IMPORT_STORAGE_KEY, false),
  alwaysOnTop: readBoolPref(ALWAYS_ON_TOP_STORAGE_KEY, false),
});

// Load the persisted library BEFORE React mounts. Top-level await is
// supported by Vite's ESM build. Blocking the first render keeps the
// store consistent from the very first frame: the library is never
// briefly empty, and the user can't race the load by clicking "+ ADD".
// On any failure (missing file, corrupt JSON, version mismatch) the
// store stays empty and the user sees the normal empty state.
const persisted = await loadPersistedLibrary();
if (persisted) {
  // Clamp currentIndex in case the persisted state references an
  // out-of-bounds track (e.g. library shrunk by an external edit).
  const currentIndex = Math.max(
    -1,
    Math.min(persisted.tracks.length - 1, persisted.currentIndex),
  );
  usePlayerStore.setState({
    tracks: persisted.tracks,
    currentIndex,
    // Always start paused with the position reset — we never auto-play
    // on launch, even if the user closed the app mid-track.
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  });
}

// Apply persisted always-on-top asynchronously. The Tauri call is
// wrapped so a failure (e.g. running in a non-Tauri preview) doesn't
// crash boot.
if (usePlayerStore.getState().alwaysOnTop) {
  void (async () => {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().setAlwaysOnTop(true);
    } catch (err) {
      console.error("[alwaysOnTop] boot failed", err);
    }
  })();
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
