import { useEffect } from 'react'
import { useT } from '../i18n/useT'

export interface AboutDialogProps {
  onClose: () => void
}

const APP_VERSION = '0.2.0'
/**
 * The static "About" description text. Per the i18n spec, only UI chrome
 * is translated — the description stays English so the spec's
 * "translate UI chrome ONLY" rule is observed.
 */
const APP_DESCRIPTION =
  'An 8-bit themed record-player audio app for local music files. Right-click anywhere to explore.'

export function AboutDialog({ onClose }: AboutDialogProps) {
  const { t } = useT()
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
        aria-labelledby="about-title"
      >
        <div className="track-info__header">
          <span id="about-title" className="track-info__title">
            {t('dialog.about.title')}
          </span>
          <button
            type="button"
            className="track-info__close"
            onClick={onClose}
            aria-label={t('dialog.about.close')}
            title={t('button.close.title')}
          >
            ✕
          </button>
        </div>

        <div className="about__content">
          <div className="about__name">{t('dialog.about.name')}</div>
          <div className="about__version">
            {t('dialog.about.versionPrefix')} {APP_VERSION}
          </div>
          <div className="about__desc">{APP_DESCRIPTION}</div>
        </div>
      </div>
    </div>
  )
}
