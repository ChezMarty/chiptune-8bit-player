// Prevent the default browser context menu (Back, Reload, Save As,
// Print, Inspect, etc.) so the app feels like a native desktop
// application. Custom React context menus in the app still work
// because React's synthetic onContextMenu fires independently of
// the native event's default behavior.
window.addEventListener("contextmenu", (e) => e.preventDefault())

import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import {
  LANGUAGE_STORAGE_KEY,
  LOCALE_CHOICES,
  START_VOLUME_STORAGE_KEY,
  usePlayerStore,
  type ThemeId,
} from "./state/usePlayerStore";
import { ALL_THEMES, THEME_MAP } from "./themes/definitions";
import {
  applyThemeTokens,
  readStoredTheme,
  readUserMeta,
} from "./themes/engine";
import {
  readIntPref,
  readStringPref,
} from "./lib/preferences";
import { loadPersistedLibrary } from "./lib/libraryPersistence";

// Apply the persisted theme BEFORE React mounts so the first paint
// already reflects the user's choice — no flash of the default theme.
const validIds = ALL_THEMES.map((d) => d.id);
const initialTheme = readStoredTheme(validIds);
const initialDef = THEME_MAP[initialTheme];
if (initialDef) {
  applyThemeTokens(initialDef.tokens, initialTheme);
}
const userMeta = readUserMeta();
usePlayerStore.setState({
  theme: initialTheme,
  themeFavorites: (userMeta.favorites ?? []).filter((id) =>
    (validIds as readonly string[]).includes(id),
  ) as ThemeId[],
  themeSortMode: (userMeta.sortMode as 'name' | 'favorites') || 'name',
});

// Seed language preference.
const savedLocale = readStringPref(
  LANGUAGE_STORAGE_KEY,
  "os",
  LOCALE_CHOICES,
);
usePlayerStore.setState({
  locale: savedLocale as "en" | "fr" | "os",
});

// Seed starting volume (applies the runtime 0..1 volume so the audio
// element reflects it from boot). Default is 100 (max) on first launch.
const savedVol = readIntPref(START_VOLUME_STORAGE_KEY, 100, 0, 100);
usePlayerStore.setState({ volume: savedVol / 100 });

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

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
