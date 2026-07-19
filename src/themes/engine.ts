/**
 * Theme Engine — applies a ThemeTokens object as CSS custom properties
 * on <html> and manages the data-theme attribute for CSS selectors.
 *
 * Usage:
 *   import { applyThemeTokens } from './themes/engine'
 *   applyThemeTokens(themeDefinition.tokens, themeDefinition.id)
 *
 * The engine mutates document.documentElement synchronously and is
 * safe to call before React mounts (used in the bootstrapping phase).
 */

import type { ThemeId, ThemeTokens } from './types'
import { tokensToCssVars } from './types'

/**
 * Apply a theme to the document by:
 * 1. Setting all CSS custom properties from ThemeTokens
 * 2. Setting data-theme attribute for CSS selector-based overrides
 */
export function applyThemeTokens(tokens: ThemeTokens, themeId: ThemeId): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  const cssVars = tokensToCssVars(tokens)

  // Batch all setProperty calls — browsers coalesce style recalculations
  // when multiple properties are set within the same synchronous tick.
  for (const [name, value] of Object.entries(cssVars)) {
    root.style.setProperty(name, value)
  }

  // Also set `data-theme` for CSS selectors that key off the theme id
  // (e.g., per-theme tweaks in component CSS).
  root.setAttribute('data-theme', themeId)
}

/**
 * Read the persisted theme id from localStorage, validating against
 * the current set of valid theme ids. Falls back to 'nes'.
 */
export function readStoredTheme(validIds: readonly ThemeId[]): ThemeId {
  if (typeof window === 'undefined') return 'nes'
  try {
    const raw = window.localStorage.getItem('chiptune-theme')
    if (raw && (validIds as readonly string[]).includes(raw)) {
      return raw as ThemeId
    }
  } catch {
    // localStorage unavailable; use default.
  }
  return 'nes'
}

/**
 * Persist the selected theme id to localStorage.
 */
export function writeStoredTheme(themeId: ThemeId): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem('chiptune-theme', themeId)
  } catch {
    // localStorage unavailable; in-memory state still works.
  }
}

/**
 * Theme user metadata (favorites) persistence key.
 */
const USER_META_KEY = 'chiptune-theme-meta'

export interface StoredUserMeta {
  favorites: string[]
  lastCategory: string | null
  sortMode: string
}

/** Read theme user metadata from localStorage. */
export function readUserMeta(): StoredUserMeta {
  if (typeof window === 'undefined') {
    return { favorites: [], lastCategory: null, sortMode: 'name' }
  }
  try {
    const raw = window.localStorage.getItem(USER_META_KEY)
    if (raw) return JSON.parse(raw) as StoredUserMeta
  } catch {
    // corrupt or missing
  }
  return { favorites: [], lastCategory: null, sortMode: 'name' }
}

/** Write theme user metadata to localStorage. */
export function writeUserMeta(meta: StoredUserMeta): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(USER_META_KEY, JSON.stringify(meta))
  } catch {
    // storage unavailable
  }
}

/** Toggle a theme id in the favorites array. */
export function toggleFavorite(favorites: string[], themeId: string): string[] {
  if (favorites.includes(themeId)) {
    return favorites.filter((id) => id !== themeId)
  }
  return [...favorites, themeId]
}
