import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Track } from '../state/usePlayerStore'

/**
 * The 8-bit styled right-click menu shown for a single track row.
 *
 * The menu is rendered as a fixed-positioned panel whose coordinates are
 * clamped to the viewport on first paint so the menu never opens off-screen.
 * The component is fully controlled: the parent owns visibility and the
 * `onClose` callback. The internal `phase` state only drives the inline
 * "Are you sure?" confirm prompt for the destructive REMOVE action.
 */

type Phase = 'normal' | 'confirm-remove'

export interface ContextMenuProps {
  track: Track
  /** Index of `track` within the current library. */
  trackIndex: number
  /** True when this track is the one currently loaded in the player. */
  isCurrent: boolean
  /** True when the player is actively playing. */
  isPlaying: boolean
  /** True when this is the first track in the library (MOVE UP disabled). */
  isFirst: boolean
  /** True when this is the last track in the library (MOVE DOWN disabled). */
  isLast: boolean
  /** Cursor X for the initial menu position. */
  x: number
  /** Cursor Y for the initial menu position. */
  y: number
  onClose: () => void
  onPlay: () => void
  onPause: () => void
  onPlayNext: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onShowInFolder: () => void
  onCopyPath: () => void
  onShowInfo: () => void
  onRemove: () => void
}

// Reasonable size estimates used to clamp the menu into the viewport on
// first paint. Measured in JS pixels. The menu is intentionally compact
// (~240px wide, 8 short rows) so these estimates hold across themes.
const MENU_WIDTH = 240
const MENU_HEIGHT_NORMAL = 360
const MENU_HEIGHT_CONFIRM = 110
const VIEWPORT_MARGIN = 8

export function ContextMenu(props: ContextMenuProps) {
  const {
    isCurrent,
    isPlaying,
    isFirst,
    isLast,
    x,
    y,
    onClose,
    onPlay,
    onPause,
    onPlayNext,
    onMoveUp,
    onMoveDown,
    onShowInFolder,
    onCopyPath,
    onShowInfo,
    onRemove,
  } = props

  const [phase, setPhase] = useState<Phase>('normal')
  const menuRef = useRef<HTMLDivElement>(null)

  // Clamp position to the viewport on first paint. useLayoutEffect avoids
  // a one-frame flicker where the menu would appear off-screen before
  // snapping back.
  useLayoutEffect(() => {
    const el = menuRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const maxX = Math.max(VIEWPORT_MARGIN, vw - rect.width - VIEWPORT_MARGIN)
    const maxY = Math.max(VIEWPORT_MARGIN, vh - rect.height - VIEWPORT_MARGIN)
    if (rect.left < VIEWPORT_MARGIN || rect.right > vw) {
      el.style.left = `${Math.min(maxX, x)}px`
    }
    if (rect.top < VIEWPORT_MARGIN || rect.bottom > vh) {
      el.style.top = `${Math.min(maxY, y)}px`
    }
  }, [x, y, phase])

  // Global listeners for closing the menu. The mousedown handler ignores
  // clicks inside the menu element so that selecting items works. The
  // scroll listener closes the menu when the library list scrolls, so we
  // never end up with a stranded menu floating over the wrong row.
  useEffect(() => {
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

  // When this track is the one currently playing, the primary action
  // becomes PAUSE. Otherwise it is PLAY (which loads + plays this track).
  const primaryLabel = isCurrent && isPlaying ? '❚❚ PAUSE' : '▶ PLAY'
  const onPrimary = isCurrent && isPlaying ? onPause : onPlay

  // Use the larger of the two phase estimates as the safe minimum height
  // for the initial clamp.
  const safeHeight = Math.max(MENU_HEIGHT_NORMAL, MENU_HEIGHT_CONFIRM)
  const initialX = Math.max(
    VIEWPORT_MARGIN,
    Math.min(x, window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN),
  )
  const initialY = Math.max(
    VIEWPORT_MARGIN,
    Math.min(y, window.innerHeight - safeHeight - VIEWPORT_MARGIN),
  )

  return (
    <div
      ref={menuRef}
      className="ctx-menu pixel-panel"
      role="menu"
      aria-label="Track actions"
      style={{ left: initialX, top: initialY, width: MENU_WIDTH }}
      // Prevent the native context menu from re-appearing when the user
      // right-clicks on the menu itself.
      onContextMenu={(e) => {
        e.preventDefault()
      }}
    >
      {phase === 'normal' ? (
        <NormalPhase
          primaryLabel={primaryLabel}
          onPrimary={onPrimary}
          onPlayNext={onPlayNext}
          isFirst={isFirst}
          isLast={isLast}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onShowInFolder={onShowInFolder}
          onCopyPath={onCopyPath}
          onShowInfo={onShowInfo}
          onAskRemove={() => setPhase('confirm-remove')}
        />
      ) : (
        <ConfirmPhase
          onYes={onRemove}
          onNo={() => setPhase('normal')}
        />
      )}
    </div>
  )
}

interface NormalPhaseProps {
  primaryLabel: string
  onPrimary: () => void
  onPlayNext: () => void
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onShowInFolder: () => void
  onCopyPath: () => void
  onShowInfo: () => void
  onAskRemove: () => void
}

function NormalPhase(p: NormalPhaseProps) {
  return (
    <>
      <MenuButton onClick={p.onPrimary}>{p.primaryLabel}</MenuButton>
      <MenuButton onClick={p.onPlayNext}>⏵ PLAY NEXT</MenuButton>
      <div className="ctx-menu__separator" aria-hidden="true" />
      <MenuButton onClick={p.onMoveUp} disabled={p.isFirst}>
        ⬆ MOVE UP
      </MenuButton>
      <MenuButton onClick={p.onMoveDown} disabled={p.isLast}>
        ⬇ MOVE DOWN
      </MenuButton>
      <div className="ctx-menu__separator" aria-hidden="true" />
      <MenuButton onClick={p.onShowInFolder}>📂 SHOW IN FOLDER</MenuButton>
      <MenuButton onClick={p.onCopyPath}>📋 COPY PATH</MenuButton>
      <MenuButton onClick={p.onShowInfo}>ⓘ TRACK INFO</MenuButton>
      <div className="ctx-menu__separator" aria-hidden="true" />
      <MenuButton
        onClick={p.onAskRemove}
        className="ctx-menu__item--danger"
      >
        ✕ REMOVE
      </MenuButton>
    </>
  )
}

interface ConfirmPhaseProps {
  onYes: () => void
  onNo: () => void
}

function ConfirmPhase({ onYes, onNo }: ConfirmPhaseProps) {
  return (
    <div className="ctx-menu__confirm" role="alertdialog" aria-label="Confirm remove">
      <div className="ctx-menu__confirm-text">REMOVE TRACK?</div>
      <div className="ctx-menu__confirm-buttons">
        <button
          type="button"
          className="ctx-menu__btn ctx-menu__btn--yes"
          onClick={onYes}
          autoFocus
        >
          ✓ YES
        </button>
        <button
          type="button"
          className="ctx-menu__btn"
          onClick={onNo}
        >
          ✗ NO
        </button>
      </div>
    </div>
  )
}

interface MenuButtonProps {
  onClick: () => void
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

function MenuButton({ onClick, disabled, className, children }: MenuButtonProps) {
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
