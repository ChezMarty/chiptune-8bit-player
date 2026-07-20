import { useEffect, useRef, useCallback } from 'react'
import { useT } from '../i18n/useT'
import { useSpotifyStore } from '../state/useSpotifyStore'

export interface LibrespotWarningDialogProps {
  onAccept: () => void
  onClose: () => void
}

/**
 * Warning dialog shown before enabling Spotify playback for the first time.
 *
 * Informs the user that:
 * - Spotify playback is powered by Librespot, an open-source project.
 * - Librespot is NOT developed or endorsed by Spotify.
 * - The feature may stop working if Spotify changes its protocols.
 *
 * The user must explicitly accept before Spotify playback is enabled.
 * The user can also choose to keep the warning dismissed permanently.
 */
export function LibrespotWarningDialog({ onAccept, onClose }: LibrespotWarningDialogProps) {
  const { t } = useT()
  const acceptRef = useRef<HTMLButtonElement>(null)
  const setWarningDismissed = useSpotifyStore((s) => s.setLibrespotWarningDismissed)

  // Auto-focus the accept button on mount.
  useEffect(() => {
    acceptRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleAccept = useCallback(() => {
    // Persist that the user has accepted the warning (show once).
    setWarningDismissed(true)
    onAccept()
  }, [setWarningDismissed, onAccept])

  return (
    <div
      className="track-info__backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="track-info pixel-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="librespot-warning-title"
        style={{ maxWidth: 480 }}
      >
        <div className="track-info__header">
          <span id="librespot-warning-title" className="track-info__title">
            ⚠️ {t('librespot.warning.title')}
          </span>
          <button
            type="button"
            className="track-info__close"
            onClick={onClose}
            aria-label={t('button.close.aria', { what: 'warning' })}
            title={t('button.close.title')}
          >
            ✕
          </button>
        </div>

        <div className="track-info__body" style={{ padding: '12px 16px' }}>
          <div className="librespot-warning__section" style={{ marginBottom: 16 }}>
            <p style={{ margin: '0 0 8px', lineHeight: 1.5 }}>
              {t('librespot.warning.intro')}
            </p>
          </div>

          <div className="librespot-warning__section" style={{ marginBottom: 16 }}>
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
              <li>
                <strong>{t('librespot.warning.point1')}</strong>
              </li>
              <li>
                {t('librespot.warning.point2')}
              </li>
              <li>
                {t('librespot.warning.point3')}
              </li>
            </ul>
          </div>

          <div
            className="librespot-warning__section"
            style={{
              background: 'rgba(255, 200, 0, 0.15)',
              border: '1px solid rgba(255, 200, 0, 0.4)',
              borderRadius: 4,
              padding: '8px 12px',
              marginBottom: 16,
              fontSize: '0.85em',
            }}
          >
            {t('librespot.warning.experimental')}
          </div>

          <div className="librespot-warning__actions" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="pixel-button"
              onClick={onClose}
            >
              {t('librespot.warning.cancel')}
            </button>
            <button
              ref={acceptRef}
              type="button"
              className="pixel-button pixel-button--play"
              onClick={handleAccept}
            >
              {t('librespot.warning.accept')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
