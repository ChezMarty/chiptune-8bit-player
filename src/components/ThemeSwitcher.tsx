import { useState, useMemo, useCallback } from 'react'
import {
  usePlayerStore,
  type ThemeId,
} from '../state/usePlayerStore'
import { ALL_THEMES, THEME_MAP } from '../themes/definitions'
import { CATEGORIES, type ThemeSortMode, type ThemeCategory } from '../themes/types'
import { useT } from '../i18n/useT'

/**
 * Redesigned ThemeSwitcher — categorized theme picker with search
 * and favorites.
 *
 * Renders inline in the Library sidebar footer. For the settings
 * drawer, see SettingsDrawer's THEME section.
 */
export function ThemeSwitcher() {
  const theme = usePlayerStore((s) => s.theme)
  const setTheme = usePlayerStore((s) => s.setTheme)
  const favorites = usePlayerStore((s) => s.themeFavorites)
  const sortMode = usePlayerStore((s) => s.themeSortMode)
  const toggleFavorite = usePlayerStore((s) => s.toggleThemeFavorite)
  const setSortMode = usePlayerStore((s) => s.setThemeSortMode)
  const { t } = useT()

  const [query, setQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<ThemeCategory>>(
    new Set(['classic-consoles']),
  )

  const toggleCategory = useCallback((cat: ThemeCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }, [])

  // Filter & sort themes based on query + sort mode
  const filteredSorted = useMemo(() => {
    let list = [...ALL_THEMES]

    // Search filter
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((d) => {
        const name = t(d.labelKey as any).toLowerCase()
        const desc = t(d.descriptionKey as any).toLowerCase()
        return name.includes(q) || desc.includes(q)
      })
    }

    // Sort
    switch (sortMode) {
      case 'favorites': {
        const favSet = new Set(favorites)
        list.sort((a, b) => {
          const fa = favSet.has(a.id) ? 0 : 1
          const fb = favSet.has(b.id) ? 0 : 1
          if (fa !== fb) return fa - fb
          return a.id.localeCompare(b.id)
        })
        break
      }
      default: // name
        list.sort((a, b) => a.id.localeCompare(b.id))
    }

    return list
  }, [query, sortMode, favorites, t])

  // Group by category for the categorized view
  const grouped = useMemo(() => {
    if (query.trim()) return null // don't group when searching
    const groups = new Map<ThemeCategory, typeof ALL_THEMES>()
    for (const def of filteredSorted) {
      const cat = def.category
      if (!groups.has(cat)) groups.set(cat, [])
      groups.get(cat)!.push(def)
    }
    return groups
  }, [filteredSorted, query])

  // Has any filters active?
  const hasFilters = query.trim().length > 0

  // Show favorites section if not searching
  const favoriteThemes = useMemo(() => {
    if (hasFilters || favorites.length === 0) return []
    return favorites
      .map((id) => THEME_MAP[id])
      .filter((d): d is NonNullable<typeof d> => d != null)
  }, [favorites, hasFilters])

  return (
    <div className="theme-picker">
      {/* Header with label + sort controls */}
      <div className="theme-picker__header">
        <span className="theme-picker__title">{t('themeSwitcher.label')}</span>
        <div className="theme-picker__sort" aria-label="Sort themes">
          {(['name', 'favorites'] as ThemeSortMode[]).map((mode) => (
            <button
              key={mode}
              className={`theme-picker__sort-btn ${sortMode === mode ? 'is-active' : ''}`}
              onClick={() => setSortMode(mode)}
              title={t(`themeSwitcher.sort.${mode}`)}
            >
              {mode === 'name' ? 'A-Z' : '★'}
            </button>
          ))}
        </div>
      </div>

      {/* Search input */}
      <div className="theme-picker__search-wrap">
        <input
          type="text"
          className="theme-picker__search"
          placeholder={t('themeSwitcher.search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t('themeSwitcher.search')}
        />
        {query && (
          <button
            className="theme-picker__search-clear"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Theme list */}
      <div className="theme-picker__list">
        {filteredSorted.length === 0 && (
          <div className="theme-picker__empty">{t('themeSwitcher.noResults')}</div>
        )}

        {/* Favorites section */}
        {favoriteThemes.length > 0 && !hasFilters && (
          <div className="theme-picker__section">
            <div className="theme-picker__section-title">★ {t('themeSwitcher.favorites')}</div>
            {favoriteThemes.map((def) => (
              <ThemeRow
                key={def.id}
                def={def}
                active={theme === def.id}
                isFavorite={true}
                onSelect={() => setTheme(def.id)}
                onToggleFavorite={() => toggleFavorite(def.id)}
                t={t}
              />
            ))}
          </div>
        )}

        {/* Categorized view or flat search results */}
        {hasFilters || !grouped ? (
          // Flat list when searching
          filteredSorted.map((def) => (
            <ThemeRow
              key={def.id}
              def={def}
              active={theme === def.id}
              isFavorite={favorites.includes(def.id)}
              onSelect={() => setTheme(def.id)}
              onToggleFavorite={() => toggleFavorite(def.id)}
              t={t}
            />
          ))
        ) : (
          // Grouped by category
          CATEGORIES.map((cat) => {
            const themes = grouped.get(cat.id)
            if (!themes || themes.length === 0) return null
            const expanded = expandedCategories.has(cat.id)
            return (
              <div key={cat.id} className="theme-picker__category">
                <button
                  className="theme-picker__category-header"
                  onClick={() => toggleCategory(cat.id)}
                  aria-expanded={expanded}
                >
                  <span className="theme-picker__category-icon">
                    {expanded ? '▼' : '▶'}
                  </span>
                  <span className="theme-picker__category-label">
                    {cat.emoji} {t(cat.labelKey as any)}
                  </span>
                  <span className="theme-picker__category-count">{themes.length}</span>
                </button>
                {expanded && (
                  <div className="theme-picker__category-items">
                    {themes.map((def) => (
                      <ThemeRow
                        key={def.id}
                        def={def}
                        active={theme === def.id}
                        isFavorite={favorites.includes(def.id)}
                        onSelect={() => setTheme(def.id)}
                        onToggleFavorite={() => toggleFavorite(def.id)}
                        t={t}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

/** Individual theme row in the picker. */
function ThemeRow({
  def,
  active,
  isFavorite,
  onSelect,
  onToggleFavorite,
  t,
}: {
  def: { id: ThemeId; labelKey: string; descriptionKey: string }
  active: boolean
  isFavorite: boolean
  onSelect: () => void
  onToggleFavorite: () => void
  t: (key: string, params?: Record<string, any>) => string
}) {
  return (
    <div
      className={`theme-picker__row ${active ? 'is-active' : ''}`}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect() } }}
      role="button"
      tabIndex={0}
      title={t(def.descriptionKey as any)}
      aria-pressed={active}
    >
      {/* Color preview swatch */}
      <span
        className="theme-picker__swatch"
        aria-hidden="true"
        style={{
          // Use three theme colors for a mini palette preview
          background: `linear-gradient(135deg, var(--accent) 0%, var(--accent) 33%, var(--accent-secondary) 33%, var(--accent-secondary) 66%, var(--bg-panel) 66%)`,
        }}
      />
      <span className="theme-picker__row-label">{t(def.labelKey as any)}</span>
      {active && (
        <span className="theme-picker__row-check" aria-hidden="true">
          ✓
        </span>
      )}
      <button
        className={`theme-picker__fav-btn ${isFavorite ? 'is-faved' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          onToggleFavorite()
        }}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        {isFavorite ? '★' : '☆'}
      </button>
    </div>
  )
}
