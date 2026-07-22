import { useState } from 'react'
import { usePlayerStore } from '../state/usePlayerStore'
import { useT } from '../i18n/useT'

/**
 * The "Now Playing" section rendered below the library list. Shows the
 * current track (non-draggable) and the upcoming queue (draggable).
 *
 * When an active playback queue is set (e.g., from a Spotify playlist),
 * the queue tracks are shown instead of the local library tracks.
 * Otherwise, the queue is derived from `tracks.slice(currentIndex + 1)`.
 *
 * Drag-and-drop uses the native HTML5 DnD API with "insert before"
 * semantics: dropping on item N moves the dragged track to position N.
 * An invisible sentinel `<li>` at the end of the list catches drops
 * below the last item.
 */
export function NowPlaying() {
  const tracks = usePlayerStore((s) => s.tracks)
  const currentIndex = usePlayerStore((s) => s.currentIndex)
  const queue = usePlayerStore((s) => s.queue)
  const queueIndex = usePlayerStore((s) => s.queueIndex)
  const queueSource = usePlayerStore((s) => s.queueSource)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const moveTrackTo = usePlayerStore((s) => s.moveTrackTo)
  const { t } = useT()

  // Determine which track list to display
  const isQueueActive = queue.length > 0
  const displayTracks = isQueueActive ? queue : tracks
  const displayIndex = isQueueActive ? queueIndex : currentIndex

  // Local drag state. `draggedId` is the id of the track being dragged;
  // `dragOverIdx` is the absolute index where the dragged
  // track would be inserted if dropped now.
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  // Nothing to show.
  if (displayTracks.length === 0) return null

  const currentTrack = displayIndex >= 0 ? displayTracks[displayIndex] : null
  const upcomingTracks = displayIndex >= 0 ? displayTracks.slice(displayIndex + 1) : []
  // Absolute index in `displayTracks` of the first upcoming entry.
  const firstUpcomingIdx = displayIndex >= 0 ? displayIndex + 1 : 0

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
    if (draggedId && !isQueueActive) {
      setDragOverIdx(firstUpcomingIdx + upcomingIdx)
    }
  }

  function onSentinelDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedId && !isQueueActive) {
      setDragOverIdx(displayTracks.length)
    }
  }

  function onItemDrop(e: React.DragEvent, upcomingIdx: number) {
    e.preventDefault()
    e.stopPropagation()
    if (isQueueActive) return // Queue tracks are not draggable
    const id = draggedId ?? e.dataTransfer.getData('text/plain')
    if (!id) return
    moveTrackTo(id, firstUpcomingIdx + upcomingIdx)
    setDraggedId(null)
    setDragOverIdx(null)
  }

  function onSentinelDrop(e: React.DragEvent) {
    e.preventDefault()
    if (isQueueActive) return // Queue tracks are not draggable
    const id = draggedId ?? e.dataTransfer.getData('text/plain')
    if (!id) return
    moveTrackTo(id, displayTracks.length)
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
        {isQueueActive && queueSource && (
          <span className="now-playing__queue-source">
            · {queueSource}
          </span>
        )}
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
            const canDrag = !isQueueActive
            return (
              <li
                key={tr.id}
                className={
                  `now-playing__item ${isDragged ? 'is-dragging' : ''} ` +
                  `${isDragOver ? 'is-drag-over' : ''}`.trim()
                }
                draggable={canDrag}
                onDragStart={canDrag ? (e) => onDragStart(e, tr.id) : undefined}
                onDragOver={canDrag ? (e) => onItemDragOver(e, idx) : undefined}
                onDrop={canDrag ? (e) => onItemDrop(e, idx) : undefined}
                onDragEnd={canDrag ? onDragEnd : undefined}
                title={canDrag ? t('nowPlaying.dragToReorder') : undefined}
              >
                {canDrag && (
                  <span
                    className="now-playing__drag-handle"
                    aria-hidden="true"
                  >
                    ⠿
                  </span>
                )}
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
          {/* Sentinel: catches drops below the last item. Only active for local library. */}
          {!isQueueActive && (
            <li
              className={`now-playing__sentinel ${dragOverIdx === displayTracks.length ? 'is-drag-over' : ''}`.trim()}
              onDragOver={onSentinelDragOver}
              onDrop={onSentinelDrop}
              aria-hidden="true"
            />
          )}
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
