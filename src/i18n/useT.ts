import { useContext } from 'react'
import { I18nContext } from './I18nProvider'

/**
 * Read the i18n context. Returns a small bag of `{ t, locale, choice }`.
 *
 * `t()` returns the key itself if the key is missing in both `en.json`
 * and `fr.json`, so screens never go blank because of a typo.
 */
export function useT() {
  return useContext(I18nContext)
}
