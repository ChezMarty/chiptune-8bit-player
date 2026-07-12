import { useLayoutEffect, useRef } from 'react'
import { THEME_IDS, THEME_LABELS, type ThemeId } from '../state/usePlayerStore'

/**
 * App-level right-click context menu. Shown when the user right-clicks on
 * the app background (not on a track row, button, input, or select — those
 * have their own behavior). Provides quick access to playback controls,
 * file import, queue management, theme switching, info dialogs, and quit.
 */
export interface AppContextMenuProps {
  x: number
  y: number
  isPlaying: boolean
  hasTracks: boolean
  hasCurrent: boolean
  upcomingCount: number
  currentTheme: ThemeId
  onClose: () => void
  onPlayPause: () => void
  onNext: () => void
  onPrev: () => void
  onStop: () => void
  onAddFiles: () => void
  onShuffle: () => void
  onClear: () => void
  onSetTheme: (theme: ThemeId) => void
  onShowShortcuts: () => void
  onShowAbout: () => void
  onQuit: () => void
}

const MENU_WIDTH = 240
const VIEWPORT_MARGIN = 8

export function AppContextMenu(props: AppContextMenuProps) {
  const {
    x,
    y,
    isPlaying,
    hasTracks,
    hasCurrent,
    upcomingCount,
    currentTheme,
    onClose,
    onPlayPause,
    onNext,
    onPrev,
    onStop,
    onAddFiles,
    onShuffle,
    onClear,
    onSetTheme,
    onShowShortcuts,
    onShowAbout,
    onQuit,
  } = props

  const menuRef = useRef<HTMLDivElement>(null)

  // Clamp position to viewport on first paint.
  useLayoutEffect(() => {
    const el = menuRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const targetX = Math.max(
      VIEWPORT_MARGIN,
      Math.min(x, vw - rect.width - VIEWPORT_MARGIN),
    )
    const targetY = Math.max(
      VIEWPORT_MARGIN,
      Math.min(y, vh - rect.height - VIEWPORT_MARGIN),
    )
    if (Math.abs(rect.left - targetX) > 0.5) el.style.left = `${targetX}px`
    if (Math.abs(rect.top - targetY) > 0.5) el.style.top = `${targetY}px`
  }, [x, y])

  // Global listeners: outside-click, Escape, scroll, resize all close.
  useLayoutEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node | null
      if (menuRef.current && target && menuRef.current.contains(target)) return
      onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    const onScroll = () => onClose()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onClose)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onClose)
    }
  }, [onClose])

  const initialX = Math.max(
    VIEWPORT_MARGIN,
    Math.min(x, window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN),
  )
  const initialY = Math.max(VIEWPORT_MARGIN, Math.min(y, window.innerHeight - 600))

  return (
    <div
      ref={menuRef}
      className="ctx-menu pixel-panel"
      role="menu"
      aria-label="App actions"
      style={{ left: initialX, top: initialY, width: MENU_WIDTH }}
    >
      <Item
        onClick={onPlayPause}
        disabled={!hasCurrent}
      >
        {isPlaying ? '❚❚ PAUSE' : '▶ PLAY'}
      </Item>
      <Item onClick={onNext} disabled={!hasTracks}>⏭ NEXT</Item>
      <Item onClick={onPrev} disabled={!hasTracks}>⏮ PREVIOUS</Item>
      <Item onClick={onStop} disabled={!hasCurrent}>⏹ STOP</Item>

      <Sep />

      <Item onClick={onAddFiles}>➕ ADD FILES</Item>

      <Sep />

      <Item
        onClick={onShuffle}
        disabled={upcomingCount < 2}
      >
        🔀 SHUFFLE QUEUE
      </Item>
      <Item
        onClick={onClear}
        disabled={upcomingCount === 0}
      >
        🗑 CLEAR QUEUE
      </Item>

      <Sep />

      <div className="ctx-menu__section-label">THEME</div>
      {THEME_IDS.map((id) => (
        <Item
          key={id}
          onClick={() => onSetTheme(id)}
          className={id === currentTheme ? 'ctx-menu__item--active' : ''}
        >
          <span className="ctx-menu__check" aria-hidden="true">
            {id === currentTheme ? '✓' : '\u00A0'}
          </span>
          {THEME_LABELS[id].toUpperCase()}
        </Item>
      ))}

      <Sep />

      <Item onClick={onShowShortcuts}>⌨ SHORTCUTS</Item>
      <Item onClick={onShowAbout}>ℹ ABOUT</Item>

      <Sep />

      <Item onClick={onQuit} className="ctx-menu__item--danger">
        ✕ QUIT
      </Item>
    </div>
  )
}

function Sep() {
  return <div className="ctx-menu__separator" aria-hidden="true" />
}

interface ItemProps {
  onClick: () => void
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

function Item({ onClick, disabled, className, children }: ItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      className={`ctx-menu__btn ${className ?? ''}`.trim()}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
