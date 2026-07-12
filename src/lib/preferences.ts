/**
 * Centralized localStorage coercion helpers. Every preference read goes
 * through one of these functions so corrupt / invalid values silently
 * fall back to defaults instead of crashing, and so the same defensive
 * pattern (`try/catch` + validation) is applied uniformly.
 *
 * The functions are intentionally synchronous and throw-free. localStorage
 * may be unavailable in private-browsing or sandboxed contexts; in those
 * cases we fall through to the default.
 */

function safeGet(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // localStorage may throw in private-browsing or sandboxed contexts.
    // The in-memory state remains correct for the session.
  }
}

/** Read a string preference, validating against an `allowed` set. */
export function readStringPref(
  key: string,
  fallback: string,
  allowed?: readonly string[],
): string {
  const raw = safeGet(key)
  if (!raw) return fallback
  if (allowed && !allowed.includes(raw)) return fallback
  return raw
}

/** Read an integer preference, clamped to [min, max]. NaN / non-int → fallback. */
export function readIntPref(
  key: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const raw = safeGet(key)
  if (raw === null) return fallback
  const n = Number(raw)
  if (!Number.isFinite(n) || !Number.isInteger(n)) return fallback
  if (n < min || n > max) return fallback
  return n
}

/** Read a boolean preference. Only 'true' / 'false' are accepted. */
export function readBoolPref(key: string, fallback: boolean): boolean {
  const raw = safeGet(key)
  if (raw === 'true') return true
  if (raw === 'false') return false
  return fallback
}

export function writeStringPref(key: string, value: string): void {
  safeSet(key, value)
}

export function writeBoolPref(key: string, value: boolean): void {
  safeSet(key, value ? 'true' : 'false')
}

export function writeIntPref(key: string, value: number): void {
  safeSet(key, String(value))
}
