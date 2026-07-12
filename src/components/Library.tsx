import { useCallback, useEffect, useState } from 'react'
import { revealItemInDir } from '@tauri-apps/plugin-opener'
import { usePlayerStore, type Track } from '../state/usePlayerStore'
import { audioController } from '../lib/audio'
import { addAudioFiles } from '../lib/addAudioFiles'
import { ThemeSwitcher } from './ThemeSwitcher'
import { ContextMenu } from './ContextMenu'
import { TrackInfoDialog } from './TrackInfoDialog'
import { NowPlaying } from './NowPlaying'

/**
 * State for the right-click context menu. We store the track ID (not the
 * index) so that reorders elsewhere don't invalidate the open menu.
 */
interface ContextMenuState {
  trackId: string
  x: number
  y: number
}

interface InfoDialogState {
  trackId: string
}

async function copyToClipboard(text: string): Promise<void> {
  // The Tauri webview supports the standard Clipboard API. Fall back to a
  // hidden textarea + execCommand for very old WebViews.
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  try {
    document.execCommand('copy')
  } finally {
    document.body.removeChild(ta)
  }
}

export function Library() {
  const tracks = usePlayerStore((s) => s.tracks)
  const currentIndex = usePlayerStore((s) => s.currentIndex)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const importing = usePlayerStore((s) => s.importing)
  const setCurrent = usePlayerStore((s) => s.setCurrent)
  const removeTrack = usePlayerStore((s) => s.removeTrack)
  const moveTrack = usePlayerStore((s) => s.moveTrack)
  const playNext = usePlayerStore((s) => s.playNext)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [infoDialog, setInfoDialog] = useState<InfoDialogState | null>(null)

  async function onAddFiles() {
    setErrorMsg(null)
    await addAudioFiles(setErrorMsg)
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

  function onRowContextMenu(e: React.MouseEvent, idx: number) {
    e.preventDefault()
    e.stopPropagation()
    const t = usePlayerStore.getState().tracks[idx]
    if (!t) return
    // Selecting the right-clicked track matches native file managers
    // (Windows Explorer, Finder) and gives visual feedback that the menu
    // applies to that row.
    setCurrent(idx)
    setContextMenu({ trackId: t.id, x: e.clientX, y: e.clientY })
  }

  // Resolve the track for an open context menu by id so the menu remains
  // valid even if the library is reordered by other actions while it is
  // open. Returns null if the track was removed out from under the menu.
  function getMenuTrack(): {
    track: Track
    index: number
    isCurrent: boolean
    isFirst: boolean
    isLast: boolean
  } | null {
    if (!contextMenu) return null
    const idx = tracks.findIndex((t) => t.id === contextMenu.trackId)
    if (idx < 0) return null
    return {
      track: tracks[idx],
      index: idx,
      isCurrent: idx === currentIndex,
      isFirst: idx === 0,
      isLast: idx === tracks.length - 1,
    }
  }

  const menuInfo = getMenuTrack()

  // Memoized so the ContextMenu's effect (which depends on onClose) does
  // not re-bind all its global listeners on every parent render.
  const closeMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  const closeInfoDialog = useCallback(() => {
    setInfoDialog(null)
  }, [])

  // If the track backing the open info dialog was removed by another
  // action, close the dialog on the next render. Done in an effect to
  // avoid setting state during render (which React warns about and can
  // cause infinite loops).
  useEffect(() => {
    if (infoDialog && !tracks.some((t) => t.id === infoDialog.trackId)) {
      setInfoDialog(null)
    }
  }, [infoDialog, tracks])

  const infoTrack =
    infoDialog ? (tracks.find((t) => t.id === infoDialog.trackId) ?? null) : null

  function handleMenuPlay(track: Track, isCurrent: boolean) {
    if (isCurrent) {
      void audioController.play()
    } else {
      const idx = tracks.findIndex((t) => t.id === track.id)
      if (idx >= 0) {
        setCurrent(idx)
        audioController.load(track.path)
        void audioController.play()
      }
    }
    closeMenu()
  }

  function handleMenuPause() {
    audioController.pause()
    closeMenu()
  }

  function handleMenuPlayNext(track: Track) {
    playNext(track.id)
    closeMenu()
  }

  function handleMenuMove(track: Track, direction: 'up' | 'down') {
    moveTrack(track.id, direction)
    // Do NOT close the menu on reorder — power users frequently want to
    // move a track several positions in a row.
  }

  async function handleMenuShowInFolder(track: Track) {
    try {
      await revealItemInDir(track.path)
    } catch (err) {
      // Tauri errors here are usually missing-permission / not-installed
      // issues. Console-only is fine: the user can still copy the path.
      console.error('[reveal] failed', err)
    }
    closeMenu()
  }

  async function handleMenuCopyPath(track: Track) {
    try {
      await copyToClipboard(track.path)
    } catch (err) {
      console.error('[clipboard] failed', err)
    }
    closeMenu()
  }

  function handleMenuShowInfo(track: Track) {
    setInfoDialog({ trackId: track.id })
    closeMenu()
  }

  function handleMenuRemove(track: Track) {
    removeTrack(track.id)
    closeMenu()
  }

  return (
    <aside className="library pixel-panel">
      <div className="library__header">
        <span className="library__title">LIBRARY</span>          <button
            className="library__add pixel-button"
            onClick={onAddFiles}
            disabled={importing}
            aria-label="Add audio files"
            title="Add audio files (or right-click anywhere in the app)"
          >
            {importing ? 'LOADING...' : '+ ADD'}
          </button>
      </div>

      <div className="library__count" aria-label="Track count">
        {tracks.length} TRACK{tracks.length === 1 ? '' : 'S'}
        <span className="library__hint"> (RIGHT-CLICK FOR ACTIONS)</span>
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
                onContextMenu={(e) => onRowContextMenu(e, idx)}
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

      <NowPlaying />

      <div className="library__footer">
        <ThemeSwitcher />
      </div>

      {menuInfo && contextMenu && (
        <ContextMenu
          track={menuInfo.track}
          trackIndex={menuInfo.index}
          isCurrent={menuInfo.isCurrent}
          isPlaying={isPlaying}
          isFirst={menuInfo.isFirst}
          isLast={menuInfo.isLast}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeMenu}
          onPlay={() => handleMenuPlay(menuInfo.track, menuInfo.isCurrent)}
          onPause={handleMenuPause}
          onPlayNext={() => handleMenuPlayNext(menuInfo.track)}
          onMoveUp={() => handleMenuMove(menuInfo.track, 'up')}
          onMoveDown={() => handleMenuMove(menuInfo.track, 'down')}
          onShowInFolder={() => handleMenuShowInFolder(menuInfo.track)}
          onCopyPath={() => handleMenuCopyPath(menuInfo.track)}
          onShowInfo={() => handleMenuShowInfo(menuInfo.track)}
          onRemove={() => handleMenuRemove(menuInfo.track)}
        />
      )}

      {infoTrack && (
        <TrackInfoDialog
          track={infoTrack}
          onClose={closeInfoDialog}
        />
      )}
    </aside>
  )
}

function fmtTime(s: number): string {
  if (!s || !Number.isFinite(s)) return '--:--'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}
