import { useEffect } from 'react'

export interface KeyboardShortcutsDialogProps {
  onClose: () => void
}

/**
 * Modal dialog listing the keyboard shortcuts. Reuses the same backdrop
 * and panel styling as the track-info dialog. Closes on Escape or a
 * click on the backdrop / X button.
 */
export function KeyboardShortcutsDialog({ onClose }: KeyboardShortcutsDialogProps) {
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
        aria-labelledby="shortcuts-title"
      >
        <div className="track-info__header">
          <span id="shortcuts-title" className="track-info__title">
            SHORTCUTS
          </span>
          <button
            type="button"
            className="track-info__close"
            onClick={onClose}
            aria-label="Close shortcuts"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        <dl className="track-info__grid shortcuts-grid">
          <dt>SPACE</dt>
          <dd>Play / Pause</dd>

          <dt>← / →</dt>
          <dd>Seek ±5 seconds</dd>

          <dt>SHIFT + ←/→</dt>
          <dd>Previous / Next track</dd>

          <dt>↑ / ↓</dt>
          <dd>Volume ±5%</dd>

          <dt>RIGHT-CLICK</dt>
          <dd>Context menu</dd>

          <dt>DOUBLE-CLICK</dt>
          <dd>Play a track</dd>

          <dt>ESC</dt>
          <dd>Close dialog / menu</dd>
        </dl>
      </div>
    </div>
  )
}
