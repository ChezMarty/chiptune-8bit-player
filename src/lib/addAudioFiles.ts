import { open } from '@tauri-apps/plugin-dialog'
import { usePlayerStore, type Track } from '../state/usePlayerStore'
import { readMetadata } from './metadata'
import { pixelateImage } from './pixelate'
import { audioController } from './audio'

const SUPPORTED_EXTS = ['mp3', 'm4a', 'aac', 'flac', 'wav', 'ogg', 'oga', 'opus']

/**
 * Open the system file picker, read metadata + pixelated art for each
 * selected file, and append the new tracks to the store. If the library
 * was empty, the first new track is set as current and loaded into the
 * audio controller.
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
    if (wasEmpty) {
      const fresh = usePlayerStore.getState()
      fresh.setCurrent(0)
      audioController.load(newTracks[0].path)
    }
  } catch (err) {
    console.error('[import] failed', err)
    report('Could not open file picker.')
  } finally {
    usePlayerStore.getState().setImporting(false)
  }
}
