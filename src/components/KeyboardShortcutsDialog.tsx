import { useEffect } from 'react'
import { useT } from '../i18n/useT'

export interface KeyboardShortcutsDialogProps {
  onClose: () => void
}

export function KeyboardShortcutsDialog({ onClose }: KeyboardShortcutsDialogProps) {
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
        aria-labelledby="shortcuts-title"
      >
        <div className="track-info__header">
          <span id="shortcuts-title" className="track-info__title">
            {t('dialog.shortcuts.title')}
          </span>
          <button
            type="button"
            className="track-info__close"
            onClick={onClose}
            aria-label={t('dialog.shortcuts.close')}
            title={t('button.close.title')}
          >
            ✕
          </button>
        </div>

        <dl className="track-info__grid shortcuts-grid">
          <dt>SPACE</dt>
          <dd>{t('shortcuts.space')}</dd>

          <dt>← / →</dt>
          <dd>{t('shortcuts.seek')}</dd>

          <dt>SHIFT + ←/→</dt>
          <dd>{t('shortcuts.seek_shift')}</dd>

          <dt>↑ / ↓</dt>
          <dd>{t('shortcuts.vol')}</dd>

          <dt>RIGHT-CLICK</dt>
          <dd>{t('shortcuts.contextMenu')}</dd>

          <dt>DOUBLE-CLICK</dt>
          <dd>{t('shortcuts.doubleClick')}</dd>

          <dt>ESC</dt>
          <dd>{t('shortcuts.esc')}</dd>
        </dl>
      </div>
    </div>
  )
}
