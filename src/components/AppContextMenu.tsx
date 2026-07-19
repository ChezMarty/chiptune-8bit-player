import { useLayoutEffect, useRef } from 'react'
import { useT } from '../i18n/useT'

export interface AppContextMenuProps {
  x: number
  y: number
  isPlaying: boolean
  hasTracks: boolean
  hasCurrent: boolean
  upcomingCount: number
  onClose: () => void
  onPlayPause: () => void
  onNext: () => void
  onPrev: () => void
  onStop: () => void
  onAddFiles: () => void
  onShuffle: () => void
  onClear: () => void
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
    onClose,
    onPlayPause,
    onNext,
    onPrev,
    onStop,
    onAddFiles,
    onShuffle,
    onClear,
    onShowShortcuts,
    onShowAbout,
    onQuit,
  } = props
  const { t } = useT()

  const menuRef = useRef<HTMLDivElement>(null)

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
      aria-label={t('ctx.app.aria')}
      style={{ left: initialX, top: initialY, width: MENU_WIDTH }}
    >
      <Item onClick={onPlayPause} disabled={!hasCurrent}>
        {isPlaying ? t('ctx.app.pause') : t('ctx.app.play')}
      </Item>
      <Item onClick={onNext} disabled={!hasTracks}>{t('ctx.app.next')}</Item>
      <Item onClick={onPrev} disabled={!hasTracks}>{t('ctx.app.prev')}</Item>
      <Item onClick={onStop} disabled={!hasCurrent}>{t('ctx.app.stop')}</Item>

      <Sep />

      <Item onClick={onAddFiles}>{t('ctx.app.add')}</Item>

      <Sep />

      <Item onClick={onShuffle} disabled={upcomingCount < 2}>
        {t('ctx.app.shuffle')}
      </Item>
      <Item onClick={onClear} disabled={upcomingCount === 0}>
        {t('ctx.app.clear')}
      </Item>

      <Sep />

      <Item onClick={onShowShortcuts}>{t('ctx.app.shortcuts')}</Item>
      <Item onClick={onShowAbout}>{t('ctx.app.about')}</Item>

      <Sep />

      <Item onClick={onQuit} className="ctx-menu__item--danger">
        {t('ctx.app.quit')}
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
