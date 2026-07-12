import { useState } from 'react'
import { open } from '@tauri-apps/plugin-dialog'
import { usePlayerStore, type Track } from '../state/usePlayerStore'
import { readMetadata } from '../lib/metadata'
import { pixelateImage } from '../lib/pixelate'
import { audioController } from '../lib/audio'

const SUPPORTED_EXTS = ['mp3', 'm4a', 'aac', 'flac', 'wav', 'ogg', 'oga', 'opus']

export function Library() {
  const tracks = usePlayerStore((s) => s.tracks)
  const currentIndex = usePlayerStore((s) => s.currentIndex)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const importing = usePlayerStore((s) => s.importing)
  const addTracks = usePlayerStore((s) => s.addTracks)
  const setCurrent = usePlayerStore((s) => s.setCurrent)
  const setImporting = usePlayerStore((s) => s.setImporting)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function onAddFiles() {
    if (importing) return
    const wasEmpty = usePlayerStore.getState().tracks.length === 0
    setErrorMsg(null)
    setImporting(true)
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
        setErrorMsg('No readable tracks found.')
        return
      }
      addTracks(newTracks)
      if (wasEmpty) {
        setCurrent(0)
        audioController.load(newTracks[0].path)
      }
    } catch (err) {
      console.error('[import] failed', err)
      setErrorMsg('Could not open file picker.')
    } finally {
      setImporting(false)
    }
  }

  function onRowClick(idx: number) {
    setCurrent(idx)
  }

  function onRowDoubleClick(idx: number) {
    setCurrent(idx)
    const t = usePlayerStore.getState().tracks[idx]
    if (!t) return
    audioController.load(t.path)
    void audioController.play()
  }

  return (
    <aside className="library pixel-panel">
      <div className="library__header">
        <span className="library__title">LIBRARY</span>
        <button
          className="library__add pixel-button"
          onClick={onAddFiles}
          disabled={importing}
          aria-label="Add audio files"
        >
          {importing ? 'LOADING...' : '+ ADD'}
        </button>
      </div>

      <div className="library__count" aria-label="Track count">
        {tracks.length} TRACK{tracks.length === 1 ? '' : 'S'}
      </div>

      {errorMsg && <div className="library__error">{errorMsg}</div>}

      <ul className="library__list">
        {tracks.length === 0 ? (
          <li className="library__empty">
            <div className="library__empty-line">PRESS "+ ADD"</div>
            <div className="library__empty-line">TO LOAD AUDIO</div>
          </li>
        ) : (
          tracks.map((t, idx) => {
            const active = idx === currentIndex
            return (
              <li
                key={t.id}
                className={`library__row ${active ? 'is-active' : ''}`}
                onClick={() => onRowClick(idx)}
                onDoubleClick={() => onRowDoubleClick(idx)}
              >
                <span className="library__row-num">
                  {active && isPlaying ? '►' : active ? '❚❚' : String(idx + 1).padStart(2, '0')}
                </span>
                <div className="library__row-info">
                  <div className="library__row-title">{t.title}</div>
                  <div className="library__row-artist">{t.artist}</div>
                </div>
                <span className="library__row-time">
                  {fmtTime(t.durationSec)}
                </span>
              </li>
            )
          })
        )}
      </ul>
    </aside>
  )
}

function fmtTime(s: number): string {
  if (!s || !Number.isFinite(s)) return '--:--'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}
