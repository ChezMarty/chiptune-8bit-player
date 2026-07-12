import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Track } from '../state/usePlayerStore'
import { useT } from '../i18n/useT'

type Phase = 'normal' | 'confirm-remove'

export interface ContextMenuProps {
  track: Track
  trackIndex: number
  isCurrent: boolean
  isPlaying: boolean
  isFirst: boolean
  isLast: boolean
  x: number
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
  const { t } = useT()

  const [phase, setPhase] = useState<Phase>('normal')
  const menuRef = useRef<HTMLDivElement>(null)

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

  const primaryLabel = isCurrent && isPlaying ? t('ctx.track.pause') : t('ctx.track.play')
  const onPrimary = isCurrent && isPlaying ? onPause : onPlay

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
      aria-label={t('ctx.track.aria')}
      style={{ left: initialX, top: initialY, width: MENU_WIDTH }}
      onContextMenu={(e) => {
        e.preventDefault()
      }}
    >
      {phase === 'normal' ? (
        <NormalPhase
          primaryLabel={primaryLabel}
          onPrimary={onPrimary}
          onPlayNext={onPlayNext}
          labels={{
            playNext: t('ctx.track.playNext'),
            moveUp: t('ctx.track.moveUp'),
            moveDown: t('ctx.track.moveDown'),
            showInFolder: t('ctx.track.showInFolder'),
            copyPath: t('ctx.track.copyPath'),
            showInfo: t('ctx.track.showInfo'),
            remove: t('ctx.track.remove'),
          }}
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
          labels={{
            question: t('ctx.track.confirm'),
            yes: t('ctx.track.confirm.yes'),
            no: t('ctx.track.confirm.no'),
          }}
          onYes={onRemove}
          onNo={() => setPhase('normal')}
        />
      )}
    </div>
  )
}

interface NormalPhaseProps {
  primaryLabel: string
  labels: {
    playNext: string
    moveUp: string
    moveDown: string
    showInFolder: string
    copyPath: string
    showInfo: string
    remove: string
  }
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
      <MenuButton onClick={p.onPlayNext}>{p.labels.playNext}</MenuButton>
      <div className="ctx-menu__separator" aria-hidden="true" />
      <MenuButton onClick={p.onMoveUp} disabled={p.isFirst}>
        {p.labels.moveUp}
      </MenuButton>
      <MenuButton onClick={p.onMoveDown} disabled={p.isLast}>
        {p.labels.moveDown}
      </MenuButton>
      <div className="ctx-menu__separator" aria-hidden="true" />
      <MenuButton onClick={p.onShowInFolder}>{p.labels.showInFolder}</MenuButton>
      <MenuButton onClick={p.onCopyPath}>{p.labels.copyPath}</MenuButton>
      <MenuButton onClick={p.onShowInfo}>{p.labels.showInfo}</MenuButton>
      <div className="ctx-menu__separator" aria-hidden="true" />
      <MenuButton
        onClick={p.onAskRemove}
        className="ctx-menu__item--danger"
      >
        {p.labels.remove}
      </MenuButton>
    </>
  )
}

interface ConfirmPhaseProps {
  labels: {
    question: string
    yes: string
    no: string
  }
  onYes: () => void
  onNo: () => void
}

function ConfirmPhase({ labels, onYes, onNo }: ConfirmPhaseProps) {
  return (
    <div className="ctx-menu__confirm" role="alertdialog" aria-label={labels.question}>
      <div className="ctx-menu__confirm-text">{labels.question}</div>
      <div className="ctx-menu__confirm-buttons">
        <button
          type="button"
          className="ctx-menu__btn ctx-menu__btn--yes"
          onClick={onYes}
          autoFocus
        >
          {labels.yes}
        </button>
        <button
          type="button"
          className="ctx-menu__btn"
          onClick={onNo}
        >
          {labels.no}
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
