import { open } from '@tauri-apps/plugin-dialog'
import { usePlayerStore, type Track } from '../state/usePlayerStore'
import { readMetadata } from './metadata'
import { pixelateImage } from './pixelate'
import { playbackEngine } from './playback/engine'

const SUPPORTED_EXTS = ['mp3', 'm4a', 'aac', 'flac', 'wav', 'ogg', 'oga', 'opus']

/**
 * Open the system file picker, read metadata + pixelated art for each
 * selected file, and append the new tracks to the store. If the library
 * was empty, the first new track is set as current and loaded into the
 * audio controller.
 *
 * After a successful import the persisted `autoPlayOnImport` and
 * `shuffleOnImport` preferences are honored:
 *
 * - `autoPlayOnImport`: when the imported files are the first thing in
 *   the queue (no prior track was playing), the first new track is
 *   loaded and `playbackEngine.play()` is invoked. When a session is
 *   already running the new tracks queue at the end without
 *   interrupting playback — the rule that fits every existing app
 *   context.
 * - `shuffleOnImport`: if at least one upcoming track exists, the
 *   upcoming queue is shuffled via the store's `shuffleUpcoming()`.
 *
 * Re-entrancy is guarded by the store's `importing` flag so rapid
 * invocations (e.g. clicking "+ ADD" twice) don't open duplicate pickers.
 *
 * @param onError Optional callback for user-facing error messages. If
 *   omitted, errors are logged to the console (suitable for callers that
 *   don't have a UI surface to show errors, like the app context menu).
 */
export async function addAudioFiles(
  onError?: (msg: string) => void,
): Promise<void> {
  const report = onError ?? ((msg: string) => console.warn(msg))
  const store = usePlayerStore.getState()
  if (store.importing) return
  const wasEmpty = store.tracks.length === 0
  store.setImporting(true)
  try {
    const selected = await open({
      multiple: true,
      filters: [{ name: 'Audio', extensions: SUPPORTED_EXTS }],
    })
    if (!selected) return
    const paths = Array.isArray(selected) ? selected : [selected]

    const newTracks: Track[] = []
    for (const path of paths) {
      const filename = path.replace(/^.*[\\/]/, '')
      try {
        const meta = await readMetadata(path, filename)
        let artUrl = meta.artDataUrl
        if (artUrl) {
          try {
            artUrl = await pixelateImage(artUrl, 64, 4)
          } catch (e) {
            console.warn('[pixelate] failed', e)
            artUrl = null
          }
        }
        newTracks.push({
          id: `${path}:${Date.now()}:${newTracks.length}`,
          path,
          title: meta.title,
          artist: meta.artist,
          album: meta.album,
          durationSec: meta.durationSec,
          hasArt: meta.hasArt,
          artDataUrl: artUrl,
        })
      } catch (err) {
        console.warn('[import] skipped', path, err)
      }
    }
    if (newTracks.length === 0) {
      report('No readable tracks found.')
      return
    }
    usePlayerStore.getState().addTracks(newTracks)

    const wantsAutoPlay = usePlayerStore.getState().autoPlayOnImport
    const fresh = usePlayerStore.getState()
    if (wantsAutoPlay) {
      // First-time import: start the very first new track.
      // Mid-session import: jump to and play the first new track.
      const targetIdx = wasEmpty ? 0 : fresh.tracks.length - newTracks.length
      fresh.setCurrent(targetIdx)
      void playbackEngine.play(newTracks[0].path)
    } else if (wasEmpty) {
      // Auto-play is OFF: still select the first new track so the user
      // can immediately hit Play.
      fresh.setCurrent(0)
    }

    if (usePlayerStore.getState().shuffleOnImport) {
      usePlayerStore.getState().shuffleUpcoming()
    }
  } catch (err) {
    console.error('[import] failed', err)
    report('Could not open file picker.')
  } finally {
    usePlayerStore.getState().setImporting(false)
  }
}
