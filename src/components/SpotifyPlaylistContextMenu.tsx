import { useEffect, useLayoutEffect, useRef } from 'react'
import type { SpotifyPlaylistInfo } from '../lib/spotify'
import { useT } from '../i18n/useT'

export interface SpotifyPlaylistContextMenuProps {
  playlist: SpotifyPlaylistInfo
  x: number
  y: number
  onClose: () => void
  onPlay: () => void
  onShufflePlay: () => void
  onOpenInSpotify: () => void
  onCopyLink: () => void
  onCopyUri: () => void
  onRefresh: () => void
}

const MENU_WIDTH = 300
const MENU_HEIGHT = 460
const VIEWPORT_MARGIN = 8

export function SpotifyPlaylistContextMenu(props: SpotifyPlaylistContextMenuProps) {
  const {
    playlist,
    x,
    y,
    onClose,
    onPlay,
    onShufflePlay,
    onOpenInSpotify,
    onCopyLink,
    onCopyUri,
    onRefresh,
  } = props
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

  const trackLabel = playlist.track_count === 1
    ? t('spotify.contextMenu.playlist.trackSingular', { n: playlist.track_count })
    : t('spotify.contextMenu.playlist.trackPlural', { n: playlist.track_count })

  return (
    <div
      ref={menuRef}
      className="spotify-context-menu"
      role="menu"
      aria-label={t('spotify.contextMenu.playlist.aria')}
      style={{ left: initialX, top: initialY, width: MENU_WIDTH }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* ── Playlist header ────────────────────── */}
      <div className="spotify-context-menu__header">
        {playlist.image_url ? (
          <img
            className="spotify-context-menu__art"
            src={playlist.image_url}
            alt=""
            style={{ imageRendering: 'pixelated' }}
          />
        ) : (
          <div className="spotify-context-menu__art--placeholder">♫</div>
        )}
        <div className="spotify-context-menu__track-info">
          <div className="spotify-context-menu__track-title" title={playlist.name}>
            {playlist.name}
          </div>
          <div
            className="spotify-context-menu__track-artist"
            title={`${playlist.owner ?? 'Spotify'}${trackLabel ? ` · ${trackLabel}` : ''}`}
          >
            {playlist.owner ?? 'Spotify'}
            {trackLabel ? <span className="spotify-context-menu__track-album"> · {trackLabel}</span> : null}
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
        <span className="spotify-context-menu__item-label">
          {t('spotify.contextMenu.playlist.play')}
        </span>
      </button>

      {/* ── Shuffle Play ────────────────────────── */}
      <button
        type="button"
        role="menuitem"
        className="spotify-context-menu__item"
        onClick={() => { onShufflePlay(); onClose() }}
      >
        <span className="spotify-context-menu__item-icon">🔀</span>
        <span className="spotify-context-menu__item-label">
          {t('spotify.contextMenu.playlist.shufflePlay')}
        </span>
      </button>

      <div className="spotify-context-menu__separator" aria-hidden="true" />

      {/* ── Open in Spotify ─────────────────────── */}
      <button
        type="button"
        role="menuitem"
        className="spotify-context-menu__item"
        onClick={() => { onOpenInSpotify(); onClose() }}
      >
        <span className="spotify-context-menu__item-icon">🌐</span>
        <span className="spotify-context-menu__item-label">
          {t('spotify.contextMenu.playlist.openInSpotify')}
        </span>
      </button>

      <div className="spotify-context-menu__separator" aria-hidden="true" />

      {/* ── Copy Link ───────────────────────────── */}
      <button
        type="button"
        role="menuitem"
        className="spotify-context-menu__item"
        onClick={() => { onCopyLink(); onClose() }}
      >
        <span className="spotify-context-menu__item-icon">🔗</span>
        <span className="spotify-context-menu__item-label">
          {t('spotify.contextMenu.playlist.copyLink')}
        </span>
      </button>

      {/* ── Copy URI ────────────────────────────── */}
      <button
        type="button"
        role="menuitem"
        className="spotify-context-menu__item"
        onClick={() => { onCopyUri(); onClose() }}
      >
        <span className="spotify-context-menu__item-icon">📋</span>
        <span className="spotify-context-menu__item-label">
          {t('spotify.contextMenu.playlist.copyUri')}
        </span>
      </button>

      <div className="spotify-context-menu__separator" aria-hidden="true" />

      {/* ── Refresh ─────────────────────────────── */}
      <button
        type="button"
        role="menuitem"
        className="spotify-context-menu__item"
        onClick={() => { onRefresh(); onClose() }}
      >
        <span className="spotify-context-menu__item-icon">🔄</span>
        <span className="spotify-context-menu__item-label">
          {t('spotify.contextMenu.playlist.refresh')}
        </span>
      </button>
    </div>
  )
}
