import {
  THEME_IDS,
  THEME_LABELS_LOCALIZED,
  usePlayerStore,
  type ThemeId,
} from '../state/usePlayerStore'
import { useT } from '../i18n/useT'

export function ThemeSwitcher() {
  const theme = usePlayerStore((s) => s.theme)
  const setTheme = usePlayerStore((s) => s.setTheme)
  const { t, locale } = useT()
  const localized = THEME_LABELS_LOCALIZED[locale]

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setTheme(e.target.value as ThemeId)
  }

  return (
    <div className="theme-switcher">
      <label className="theme-switcher__label" htmlFor="theme-select">
        {t('themeSwitcher.label')}
      </label>
      <div className="theme-switcher__select-wrap">
        <select
          id="theme-select"
          className="theme-switcher__select"
          value={theme}
          onChange={onChange}
          aria-label={t('themeSwitcher.aria')}
        >
          {THEME_IDS.map((id) => (
            <option key={id} value={id}>
              {localized[id]}
            </option>
          ))}
        </select>
        <span className="theme-switcher__chevron" aria-hidden="true">
          ▼
        </span>
      </div>
    </div>
  )
}
