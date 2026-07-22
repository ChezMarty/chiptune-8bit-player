import { useCallback, useEffect, useState } from 'react'
import { revealItemInDir } from '@tauri-apps/plugin-opener'
import { usePlayerStore, type Track } from '../state/usePlayerStore'
import { playbackEngine } from '../lib/playback/engine'
import { addAudioFiles } from '../lib/addAudioFiles'
import { ThemeSwitcher } from './ThemeSwitcher'
import { ContextMenu } from './ContextMenu'
import { TrackInfoDialog } from './TrackInfoDialog'
import { NowPlaying } from './NowPlaying'
import { useT } from '../i18n/useT'

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

export type LibraryTab = 'local' | 'spotify'

interface LibraryProps {
  activeTab: LibraryTab
  onTabChange: (tab: LibraryTab) => void
}

export function Library({ activeTab, onTabChange }: LibraryProps) {
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
  const { t } = useT()

  async function onAddFiles() {
    setErrorMsg(null)
    await addAudioFiles(setErrorMsg)
  }

  function onRowClick(idx: number) {
    setCurrent(idx)
  }

  function onRowDoubleClick(idx: number) {
    // Clear any active queue when playing from local library
    usePlayerStore.getState().clearQueue()
    setCurrent(idx)
    const t = usePlayerStore.getState().tracks[idx]
    if (!t) return
    void playbackEngine.play(t.path)
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
    // Clear any active queue when playing from local library
    usePlayerStore.getState().clearQueue()
    if (!isCurrent) {
      const idx = tracks.findIndex((t) => t.id === track.id)
      if (idx >= 0) setCurrent(idx)
    }
    void playbackEngine.play(track.path)
    closeMenu()
  }

  function handleMenuPause() {
    void playbackEngine.pause()
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
      <div className="library__tabs">
        <button
          className={`library__tab ${activeTab === 'local' ? 'is-active' : ''}`}
          onClick={() => onTabChange('local')}
        >
          💻 {t('library.tab.local')}
        </button>
        <button
          className={`library__tab ${activeTab === 'spotify' ? 'is-active' : ''}`}
          onClick={() => onTabChange('spotify')}
        >
          🟢 {t('library.tab.spotify')}
        </button>
      </div>

      <div className="library__header">
        <span className="library__title">{t('header.library')}</span>          <button
            className="library__add pixel-button"
            onClick={onAddFiles}
            disabled={importing}
            aria-label={t('button.add.aria')}
            title={t('button.add.title')}
          >
            {importing ? t('button.add.loading') : t('button.add')}
          </button>
      </div>

      <div className="library__count" aria-label={t('header.library')}>
        {t('library.count', { n: tracks.length })}
        <span className="library__hint">{t('library.hint')}</span>
      </div>

      {errorMsg && <div className="library__error">{errorMsg}</div>}

      <ul className="library__list">
        {tracks.length === 0 ? (
          <li className="library__empty">
            <div className="library__empty-line">{t('library.empty.line1')}</div>
            <div className="library__empty-line">{t('library.empty.line2')}</div>
          </li>
        ) : (
          tracks.map((tr, idx) => {
            const active = idx === currentIndex
            return (
              <li
                key={tr.id}
                className={`library__row ${active ? 'is-active' : ''}`}
                onClick={() => onRowClick(idx)}
                onDoubleClick={() => onRowDoubleClick(idx)}
                onContextMenu={(e) => onRowContextMenu(e, idx)}
              >
                <span className="library__row-num">
                  {active && isPlaying
                    ? t('row.playing')
                    : active
                      ? t('row.paused_active')
                      : String(idx + 1).padStart(2, '0')}
                </span>
                <div className="library__row-info">
                  <div className="library__row-title">{tr.title}</div>
                  <div className="library__row-artist">{tr.artist}</div>
                </div>
                <span className="library__row-time">
                  {fmtTime(tr.durationSec)}
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
