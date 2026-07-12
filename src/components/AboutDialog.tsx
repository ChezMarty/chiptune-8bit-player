import { useEffect } from 'react'

export interface AboutDialogProps {
  onClose: () => void
}

const APP_NAME = 'CHIPTUNE 8-BIT PLAYER'
const APP_VERSION = '0.1.0'
const APP_DESCRIPTION =
  'An 8-bit themed record-player audio app for local music files. Right-click anywhere to explore.'

/**
 * Modal "About" dialog. Shows the app name, version, and a short
 * description. Reuses the track-info dialog styling.
 */
export function AboutDialog({ onClose }: AboutDialogProps) {
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
            ABOUT
          </span>
          <button
            type="button"
            className="track-info__close"
            onClick={onClose}
            aria-label="Close about"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        <div className="about__content">
          <div className="about__name">{APP_NAME}</div>
          <div className="about__version">VERSION {APP_VERSION}</div>
          <div className="about__desc">{APP_DESCRIPTION}</div>
        </div>
      </div>
    </div>
  )
}
