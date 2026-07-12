import { usePlayerStore, THEME_IDS, THEME_LABELS, type ThemeId } from '../state/usePlayerStore'

export function ThemeSwitcher() {
  const theme = usePlayerStore((s) => s.theme)
  const setTheme = usePlayerStore((s) => s.setTheme)

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setTheme(e.target.value as ThemeId)
  }

  return (
    <div className="theme-switcher">
      <label className="theme-switcher__label" htmlFor="theme-select">
        THEME
      </label>
      <div className="theme-switcher__select-wrap">
        <select
          id="theme-select"
          className="theme-switcher__select"
          value={theme}
          onChange={onChange}
          aria-label="Select theme"
        >
          {THEME_IDS.map((id) => (
            <option key={id} value={id}>
              {THEME_LABELS[id]}
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
