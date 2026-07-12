import { readTextFile, writeTextFile, exists, BaseDirectory } from '@tauri-apps/plugin-fs'
import { usePlayerStore, type Track } from '../state/usePlayerStore'

const LIBRARY_FILE = 'library.json'
const SCHEMA_VERSION = 1
const SAVE_DEBOUNCE_MS = 500

/**
 * The full library state we persist to disk. Versioned so future schema
 * changes can detect and upgrade old files (or ignore them).
 *
 * We persist the full Track objects — including the `artDataUrl` — because
 * the pixelated cover art is small (~2-5KB per track after base64) and
 * persisting it gives users instant cover art on launch without a slow
 * metadata re-read for the whole library.
 */
export interface PersistedLibrary {
  version: number
  tracks: Track[]
  currentIndex: number
}

/**
 * Read the persisted library from the OS app-data directory. Returns null
 * when the file is missing, the schema version is unknown, or the JSON is
 * corrupt. The store stays empty in those cases and the user sees the
 * normal "PRESS + ADD" empty state.
 */
export async function loadPersistedLibrary(): Promise<PersistedLibrary | null> {
  try {
    const fileExists = await exists(LIBRARY_FILE, {
      baseDir: BaseDirectory.AppData,
    })
    if (!fileExists) return null
    const json = await readTextFile(LIBRARY_FILE, {
      baseDir: BaseDirectory.AppData,
    })
    const parsed = JSON.parse(json) as PersistedLibrary
    if (parsed.version !== SCHEMA_VERSION) {
      console.warn(
        '[library] schema version mismatch, ignoring persisted library',
      )
      return null
    }
    if (!Array.isArray(parsed.tracks) || typeof parsed.currentIndex !== 'number') {
      console.warn('[library] malformed persisted library, ignoring')
      return null
    }
    return parsed
  } catch (err) {
    console.warn('[library] load failed', err)
    return null
  }
}

/**
 * Write the library state to disk. The AppData directory is created by
 * the Tauri runtime on first launch, so we only need to ensure the file
 * itself can be created/overwritten (both default to true). Errors are
 * logged but never rethrown — a persistence failure must not crash the app.
 */
export async function savePersistedLibrary(lib: PersistedLibrary): Promise<void> {
  try {
    await writeTextFile(LIBRARY_FILE, JSON.stringify(lib), {
      baseDir: BaseDirectory.AppData,
    })
  } catch (err) {
    console.warn('[library] save failed', err)
  }
}

// Module-level debounce state. Rapid changes (e.g. a bulk import of many
// files, or several context-menu reorders in quick succession) coalesce
// into a single write. `pendingSaveLib` is captured by reference so the
// flush-on-cleanup path can save the most recent snapshot.
let saveTimeout: ReturnType<typeof setTimeout> | null = null
let pendingSaveLib: PersistedLibrary | null = null

function scheduleSave(lib: PersistedLibrary): void {
  pendingSaveLib = lib
  if (saveTimeout !== null) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    saveTimeout = null
    const toSave = pendingSaveLib
    pendingSaveLib = null
    if (toSave) void savePersistedLibrary(toSave)
  }, SAVE_DEBOUNCE_MS)
}

/**
 * Cancel any pending debounced save. Called from the subscriber cleanup
 * path. Use `flushPendingSave` instead if you want the pending snapshot
 * written before cancelling.
 */
export function cancelPendingSave(): void {
  if (saveTimeout !== null) {
    clearTimeout(saveTimeout)
    saveTimeout = null
    pendingSaveLib = null
  }
}

/**
 * If a debounced save is pending, run it now. Useful on app teardown so
 * a last-second change isn't lost.
 */
export function flushPendingSave(): void {
  if (saveTimeout !== null) {
    clearTimeout(saveTimeout)
    saveTimeout = null
    const toSave = pendingSaveLib
    pendingSaveLib = null
    if (toSave) void savePersistedLibrary(toSave)
  }
}

// Module-level references to the last persisted state so the subscriber
// can skip irrelevant changes (volume, theme, isPlaying, currentTime).
// Tracked at module scope (not in the closure) so the subscriber effect
// re-mounts across HMR boundaries still see the same baseline.
let prevTracks: Track[] | null = null
let prevCurrentIndex: number | null = null

/**
 * Install a zustand subscriber that persists the library whenever
 * `tracks` or `currentIndex` changes. Other state changes (volume, theme,
 * isPlaying, currentTime) are ignored. Returns a cleanup function that
 * unsubscribes and flushes any pending save.
 *
 * Call this once from `App.tsx` on mount.
 */
export function setupPersistenceSubscription(): () => void {
  // Seed with current state so the first save comparison is correct.
  // (The store was just hydrated in main.tsx before the first render.)
  prevTracks = usePlayerStore.getState().tracks
  prevCurrentIndex = usePlayerStore.getState().currentIndex

  const unsubscribe = usePlayerStore.subscribe((state) => {
    if (
      state.tracks !== prevTracks ||
      state.currentIndex !== prevCurrentIndex
    ) {
      prevTracks = state.tracks
      prevCurrentIndex = state.currentIndex
      scheduleSave({
        version: SCHEMA_VERSION,
        tracks: state.tracks,
        currentIndex: state.currentIndex,
      })
    }
  })

  return () => {
    unsubscribe()
    flushPendingSave()
  }
}
