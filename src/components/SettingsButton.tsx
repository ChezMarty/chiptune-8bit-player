import { forwardRef } from 'react'
import { useT } from '../i18n/useT'

export interface SettingsButtonProps {
  open: boolean
  onClick: () => void
}

/**
 * The ⚙ SETTINGS button rendered in the top-right of the record player
 * column. Toggles the settings drawer via the parent's `onClick`.
 *
 * The button is intentionally always-visible (not gated on `hasCurrent`
 * or any other state) so the discoverability of settings is uniform.
 *
 * The component forwards the inner `<button>` ref so the drawer can
 * restore focus to it on close.
 */
export const SettingsButton = forwardRef<HTMLButtonElement, SettingsButtonProps>(
  function SettingsButton({ open, onClick }, ref) {
    const { t } = useT()
    return (
      <div className="settings-button-slot">
        <button
          ref={ref}
          type="button"
          className="settings-button pixel-button"
          onClick={onClick}
          aria-label={t('button.settings.aria')}
          aria-haspopup="dialog"
          aria-expanded={open}
          title={t('button.settings.title')}
        >
          {t('button.settings')}
        </button>
      </div>
    )
  },
)
