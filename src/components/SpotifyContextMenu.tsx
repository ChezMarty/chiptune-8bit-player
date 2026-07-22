import { useEffect, useLayoutEffect, useRef } from 'react'
import type { SpotifyTrackInfo } from '../lib/spotify'
import { useT } from '../i18n/useT'

export interface SpotifyContextMenuProps {
  track: SpotifyTrackInfo
  x: number
  y: number
  onClose: () => void
  onPlay: () => void
  onGoToAlbum: () => void
  onCopyLink: () => void
}

const MENU_WIDTH = 280
const MENU_HEIGHT = 330
const VIEWPORT_MARGIN = 8

export function SpotifyContextMenu(props: SpotifyContextMenuProps) {
  const { track, x, y, onClose, onPlay, onGoToAlbum, onCopyLink } = props
  const { t } = useT()
  const menuRef = useRef<HTMLDivElement>(null)

  // Clamp position to viewport after layout
  useLayoutEffect(() => {
    const el = menuRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const maxX = Math.max(VIEWPORT_MARGIN, vw - rect.width - VIEWPORT_MARGIN)
    const maxY = Math.max(VIEWPORT_MARGIN, vh - rect.height - VIEWPORT_MARGIN)
    if (rect.left < VIEWPORT_MARGIN || rect.right > vw - VIEWPORT_MARGIN) {
      el.style.left = `${Math.min(maxX, Math.max(VIEWPORT_MARGIN, x))}px`
    }
    if (rect.top < VIEWPORT_MARGIN || rect.bottom > vh - VIEWPORT_MARGIN) {
      el.style.top = `${Math.min(maxY, Math.max(VIEWPORT_MARGIN, y))}px`
    }
  }, [x, y])

  // Global listeners: close on outside click, Escape, scroll, resize
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

  const initialX = Math.max(
    VIEWPORT_MARGIN,
    Math.min(x, window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN),
  )
  const initialY = Math.max(
    VIEWPORT_MARGIN,
    Math.min(y, window.innerHeight - MENU_HEIGHT - VIEWPORT_MARGIN),
  )

  const hasAlbum = !!track.album_id
  const displayArtist = track.artist || '—'

  return (
    <div
      ref={menuRef}
      className="spotify-context-menu"
      role="menu"
      aria-label={t('spotify.contextMenu.aria')}
      style={{ left: initialX, top: initialY, width: MENU_WIDTH }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* ── Track header ────────────────────────── */}
      <div className="spotify-context-menu__header">
        {track.image_url ? (
          <img
            className="spotify-context-menu__art"
            src={track.image_url}
            alt=""
            style={{ imageRendering: 'pixelated' }}
          />
        ) : (
          <div className="spotify-context-menu__art--placeholder">♪</div>
        )}
        <div className="spotify-context-menu__track-info">
          <div className="spotify-context-menu__track-title" title={track.title}>
            {track.title}
          </div>
          <div
            className="spotify-context-menu__track-artist"
            title={`${displayArtist}${track.album ? ` · ${track.album}` : ''}`}
          >
            {displayArtist}
            {track.album ? <span className="spotify-context-menu__track-album"> · {track.album}</span> : null}
          </div>
        </div>
      </div>

      <div className="spotify-context-menu__separator" aria-hidden="true" />

      {/* ── Play ────────────────────────────────── */}
      <button
        type="button"
        role="menuitem"
        className="spotify-context-menu__item spotify-context-menu__item--primary"
        onClick={() => { onPlay(); onClose() }}
      >
        <span className="spotify-context-menu__item-icon spotify-context-menu__item-icon--play">▶</span>
        <span className="spotify-context-menu__item-label">{t('spotify.contextMenu.play')}</span>
      </button>

      <div className="spotify-context-menu__separator" aria-hidden="true" />

      {/* ── Go to Album ─────────────────────────── */}
      <button
        type="button"
        role="menuitem"
        className="spotify-context-menu__item"
        onClick={() => { onGoToAlbum(); onClose() }}
        disabled={!hasAlbum}
        title={!hasAlbum ? t('spotify.contextMenu.noAlbum') : t('spotify.contextMenu.goToAlbum')}
      >
        <span className="spotify-context-menu__item-icon">💿</span>
        <span className="spotify-context-menu__item-label">{t('spotify.contextMenu.goToAlbum')}</span>
      </button>

      <div className="spotify-context-menu__separator" aria-hidden="true" />

      {/* ── Copy Track Link ─────────────────────── */}
      <button
        type="button"
        role="menuitem"
        className="spotify-context-menu__item"
        onClick={() => { onCopyLink(); onClose() }}
        title={t('spotify.contextMenu.copyLink')}
      >
        <span className="spotify-context-menu__item-icon">🔗</span>
        <span className="spotify-context-menu__item-label">{t('spotify.contextMenu.copyLink')}</span>
      </button>
    </div>
  )
}
