import { createContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { usePlayerStore, type LocaleChoice } from '../state/usePlayerStore'
import en from './locales/en.json'
import fr from './locales/fr.json'

export type Locale = 'en' | 'fr'

interface I18nContextValue {
  /** The resolved locale after collapsing `'os'` to `'en'` or `'fr'`. */
  locale: Locale
  /** What the user *chose* (may be `'os'`). */
  choice: LocaleChoice
  /** Translate a key. Falls back to the key itself if missing. */
  t: (key: string, vars?: Record<string, string | number>) => string
}

const DEFAULT_DICTIONARY: Record<string, string> = en

const DICTIONARIES: Record<Locale, Record<string, string>> = {
  en,
  fr,
}

export const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  choice: 'os',
  t: (key) => {
    const fallback = DEFAULT_DICTIONARY[key]
    return fallback ?? key
  },
})

/**
 * Resolve the user's `'os'` choice against `navigator.language`. Anything
 * starting with `'fr'` → `'fr'`. Everything else → `'en'`. We deliberately
 * don't ship per-region variants (fr-CA, fr-CH…) — they all collapse to
 * `'fr'`.
 */
function resolveOsLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en'
  const lang = navigator.language?.toLowerCase() ?? ''
  if (lang.startsWith('fr')) return 'fr'
  return 'en'
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, name) => {
    const v = vars[name]
    return v === undefined || v === null ? `{${name}}` : String(v)
  })
}

/**
 * Special-case pluralization for the library track count. The English and
 * French plural forms differ; everything else stays singular across locales.
 */
function pluralize(locale: Locale, key: string, vars: Record<string, string | number> | undefined): string | null {
  if (key === 'library.count' && vars && 'n' in vars) {
    const n = Number(vars.n)
    if (locale === 'fr') {
      return `${n} ${n === 1 ? 'TITRE' : 'TITRES'}`
    }
    return `${n} ${n === 1 ? 'TRACK' : 'TRACKS'}`
  }
  return null
}

export interface I18nProviderProps {
  children: ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  const choice = usePlayerStore((s) => s.locale)
  const [osLocale, setOsLocale] = useState<Locale>(() => resolveOsLocale())

  // Re-resolve the OS locale on mount in case navigator.language wasn't
  // available synchronously the first time. The check is intentionally
  // minimal — we accept an app-restart for OS language changes.
  useEffect(() => {
    setOsLocale(resolveOsLocale())
  }, [])

  const locale: Locale = choice === 'os' ? osLocale : choice

  const value = useMemo<I18nContextValue>(() => {
    const dict = DICTIONARIES[locale]
    return {
      locale,
      choice,
      t: (key, vars) => {
        const pluralized = pluralize(locale, key, vars)
        if (pluralized !== null) return pluralized
        const template =
          dict[key] ?? DEFAULT_DICTIONARY[key] ?? key
        return interpolate(template, vars)
      },
    }
  }, [locale, choice])

  // Reflect the active locale on <html lang> and the document title. The
  // title gets re-asserted here so language changes pick up the localized
  // app name.
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.lang = locale
    // Only set the static fallback title here; RecordPlayer overrides it
    // while a track is loaded.
    if (document.title === '' || /^▶|❚❚/.test(document.title) === false) {
      document.title = value.t('app.title')
    } else {
      document.title = value.t('app.title')
    }
  }, [locale, value])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
