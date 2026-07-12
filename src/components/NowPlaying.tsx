import { useState } from 'react'
import { usePlayerStore } from '../state/usePlayerStore'
import { useT } from '../i18n/useT'

/**
 * The "Now Playing" section rendered below the library list. Shows the
 * current track (non-draggable) and the upcoming queue (draggable). The
 * queue is derived from `tracks.slice(currentIndex + 1)` — the library IS
 * the play order, so reordering within the queue reorders the library.
 *
 * Drag-and-drop uses the native HTML5 DnD API with "insert before"
 * semantics: dropping on item N moves the dragged track to position N.
 * An invisible sentinel `<li>` at the end of the list catches drops
 * below the last item.
 */
export function NowPlaying() {
  const tracks = usePlayerStore((s) => s.tracks)
  const currentIndex = usePlayerStore((s) => s.currentIndex)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const moveTrackTo = usePlayerStore((s) => s.moveTrackTo)
  const { t } = useT()

  // Local drag state. `draggedId` is the id of the track being dragged;
  // `dragOverIdx` is the absolute index in `tracks` where the dragged
  // track would be inserted if dropped now. Set to the sentinel's index
  // (= tracks.length) when hovering the end-of-list drop zone.
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  // No library → nothing to show.
  if (tracks.length === 0) return null

  const currentTrack = currentIndex >= 0 ? tracks[currentIndex] : null
  const upcomingTracks = currentIndex >= 0 ? tracks.slice(currentIndex + 1) : []
  // Absolute index in `tracks` of the first upcoming entry.
  const firstUpcomingIdx = currentIndex >= 0 ? currentIndex + 1 : 0

  function onDragStart(e: React.DragEvent, id: string) {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
    // setData is required for Firefox to allow the drag to initiate.
    e.dataTransfer.setData('text/plain', id)
  }

  function onItemDragOver(e: React.DragEvent, upcomingIdx: number) {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    if (draggedId) {
      setDragOverIdx(firstUpcomingIdx + upcomingIdx)
    }
  }

  function onSentinelDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedId) {
      setDragOverIdx(tracks.length)
    }
  }

  function onItemDrop(e: React.DragEvent, upcomingIdx: number) {
    e.preventDefault()
    e.stopPropagation()
    const id = draggedId ?? e.dataTransfer.getData('text/plain')
    if (!id) return
    moveTrackTo(id, firstUpcomingIdx + upcomingIdx)
    setDraggedId(null)
    setDragOverIdx(null)
  }

  function onSentinelDrop(e: React.DragEvent) {
    e.preventDefault()
    const id = draggedId ?? e.dataTransfer.getData('text/plain')
    if (!id) return
    moveTrackTo(id, tracks.length)
    setDraggedId(null)
    setDragOverIdx(null)
  }

  function onDragEnd() {
    setDraggedId(null)
    setDragOverIdx(null)
  }

  return (
    <div className="now-playing">
      <div className="now-playing__header">
        <span className="now-playing__title">{t('header.nowPlaying')}</span>
        <span className="now-playing__count">
          {t('nowPlaying.upNext', { n: upcomingTracks.length })}
        </span>
      </div>

      {currentTrack && (
        <div
          className={`now-playing__current ${isPlaying ? 'is-playing' : 'is-paused'}`}
        >
          <span className="now-playing__current-icon" aria-hidden="true">
            {isPlaying ? t('row.playing') : t('row.paused_active')}
          </span>
          <div className="now-playing__current-info">
            <div
              className="now-playing__current-title"
              title={currentTrack.title}
            >
              {currentTrack.title}
            </div>
            <div
              className="now-playing__current-artist"
              title={currentTrack.artist}
            >
              {currentTrack.artist}
            </div>
          </div>
        </div>
      )}

      {!currentTrack && (
        <div className="now-playing__empty">{t('nowPlaying.empty')}</div>
      )}

      {upcomingTracks.length > 0 ? (
        <ul className="now-playing__list">
          {upcomingTracks.map((tr, idx) => {
            const absoluteIdx = firstUpcomingIdx + idx
            const isDragged = tr.id === draggedId
            const isDragOver = dragOverIdx === absoluteIdx
            return (
              <li
                key={tr.id}
                className={
                  `now-playing__item ${isDragged ? 'is-dragging' : ''} ` +
                  `${isDragOver ? 'is-drag-over' : ''}`.trim()
                }
                draggable
                onDragStart={(e) => onDragStart(e, tr.id)}
                onDragOver={(e) => onItemDragOver(e, idx)}
                onDrop={(e) => onItemDrop(e, idx)}
                onDragEnd={onDragEnd}
                title={t('nowPlaying.dragToReorder')}
              >
                <span
                  className="now-playing__drag-handle"
                  aria-hidden="true"
                >
                  ⠿
                </span>
                <span className="now-playing__item-num">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className="now-playing__item-info">
                  <div
                    className="now-playing__item-title"
                    title={tr.title}
                  >
                    {tr.title}
                  </div>
                  <div
                    className="now-playing__item-artist"
                    title={tr.artist}
                  >
                    {tr.artist}
                  </div>
                </div>
                <span className="now-playing__item-time">
                  {fmtTime(tr.durationSec)}
                </span>
              </li>
            )
          })}
          {/* Sentinel: catches drops below the last item so the user can
              move a track to the very end of the queue. */}
          <li
            className={`now-playing__sentinel ${dragOverIdx === tracks.length ? 'is-drag-over' : ''}`.trim()}
            onDragOver={onSentinelDragOver}
            onDrop={onSentinelDrop}
            aria-hidden="true"
          />
        </ul>
      ) : currentTrack ? (
        <div className="now-playing__empty">{t('nowPlaying.endOfQueue')}</div>
      ) : null}
    </div>
  )
}

function fmtTime(s: number): string {
  if (!s || !Number.isFinite(s)) return '--:--'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}
