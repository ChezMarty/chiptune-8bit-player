import { useEffect } from 'react'
import type { Track } from '../state/usePlayerStore'
import { useT } from '../i18n/useT'

export interface TrackInfoDialogProps {
  track: Track
  onClose: () => void
}

export function TrackInfoDialog({ track, onClose }: TrackInfoDialogProps) {
  const { t } = useT()
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
            {t('dialog.trackInfo.title')}
          </span>
          <button
            type="button"
            className="track-info__close"
            onClick={onClose}
            aria-label={t('dialog.trackInfo.close')}
            title={t('button.close.title')}
          >
            ✕
          </button>
        </div>

        {/* Per the i18n spec, the metadata <dl> field tags (TITLE, ARTIST,
            ALBUM, …) stay in English — only the dialog chrome translates. */}
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
