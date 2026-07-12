import { useEffect } from 'react'
import type { Track } from '../state/usePlayerStore'

/**
 * A small 8-bit styled modal showing the read-only metadata for a single
 * track: title, artist, album, duration, and the absolute file path. Used
 * by the context menu's "TRACK INFO" action.
 */
export interface TrackInfoDialogProps {
  track: Track
  onClose: () => void
}

export function TrackInfoDialog({ track, onClose }: TrackInfoDialogProps) {
  // Close on Escape. Click on the backdrop is handled by the parent
  // wrapper element below.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const ext = track.path.split('.').pop()?.toUpperCase() ?? '???'

  return (
    <div
      className="track-info__backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="track-info pixel-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="track-info-title"
      >
        <div className="track-info__header">
          <span id="track-info-title" className="track-info__title">
            TRACK INFO
          </span>
          <button
            type="button"
            className="track-info__close"
            onClick={onClose}
            aria-label="Close track info"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        <dl className="track-info__grid">
          <dt>TITLE</dt>
          <dd title={track.title}>{track.title}</dd>

          <dt>ARTIST</dt>
          <dd title={track.artist}>{track.artist}</dd>

          <dt>ALBUM</dt>
          <dd title={track.album ?? '—'}>{track.album ?? '—'}</dd>

          <dt>DURATION</dt>
          <dd>{fmtDuration(track.durationSec)}</dd>

          <dt>FORMAT</dt>
          <dd>{ext}</dd>

          <dt>HAS ART</dt>
          <dd>{track.hasArt ? 'YES' : 'NO'}</dd>

          <dt>PATH</dt>
          <dd className="track-info__path" title={track.path}>
            {track.path}
          </dd>
        </dl>
      </div>
    </div>
  )
}

function fmtDuration(s: number): string {
  if (!s || !Number.isFinite(s)) return '--:--'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}
