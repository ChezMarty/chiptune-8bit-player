/**
 * Discord Rich Presence integration (frontend side).
 *
 * Derives the Discord activity from the player store, the DSP engine and
 * the current app UI state, then pushes it to the Rust backend (which owns
 * the Discord IPC connection on a background thread).
 *
 * This is fully event-driven — there is no polling:
 *  - The Zustand store emits on every playback state change.
 *  - `dspEngine` emits `chiptune-dsp-changed` when a preset is applied.
 *  - App.tsx pushes the UI context (active view, AudioLab open).
 *
 * Updates are throttled: rapid store updates coalesce into a single push
 * (trailing debounce), and progress-only refreshes happen at most once
 * every 15 seconds while playing (Discord computes the elapsed time from
 * the `start` timestamp, so we only need to re-anchor it periodically).
 */

import { invoke } from '@tauri-apps/api/core'
import { usePlayerStore } from '../state/usePlayerStore'
import { useSpotifyStore } from '../state/useSpotifyStore'
import { dspEngine } from '../dsp/DspEngine'
import { readBoolPref, writeBoolPref } from './preferences'
import en from '../i18n/locales/en.json'
import fr from '../i18n/locales/fr.json'

/** localStorage key for the "enable Rich Presence" preference. */
export const DISCORD_RP_KEY = 'chiptune-discord-rp-enabled'

/**
 * Discord art-asset keys. These must be uploaded under the application at
 * https://discord.com/developers/applications (Rich Presence → Art Assets).
 */
const LOGO_KEY = 'chiptune_audio_lab'
const SPOTIFY_KEY = 'spotify'
const LOCAL_KEY = 'local_music'

/** Minimum interval between progress-only presence pushes (ms). */
const PROGRESS_REFRESH_MS = 15_000
/** Trailing debounce that coalesces rapid store updates (ms). */
const DEBOUNCE_MS = 400
/**
 * Maximum time a flush may be delayed by the trailing debounce (ms).
 * Progress callbacks fire every ~250 ms while playing; a pure trailing
 * debounce would be reset forever and never flush. This cap guarantees a
 * flush at least this often.
 */
const MAX_WAIT_MS = 1_000

type Locale = 'en' | 'fr'
type UiView = 'local' | 'spotify'

interface UiContext {
  view: UiView
  audioLabOpen: boolean
}

interface ActivityPayload {
  details: string
  state: string
  largeImage?: string
  largeText?: string
  smallImage?: string
  smallText?: string
  startTs?: number
}

const DICTS: Record<Locale, Record<string, string>> = {
  en: en as Record<string, string>,
  fr: fr as Record<string, string>,
}

/** Resolve the app locale the same way I18nProvider does ('os' → 'en'/'fr'). */
function resolveLocale(): Locale {
  const choice = usePlayerStore.getState().locale
  if (choice === 'os') {
    const lang = navigator.language?.toLowerCase() ?? ''
    return lang.startsWith('fr') ? 'fr' : 'en'
  }
  return choice
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, name) => {
    const v = vars[name]
    return v === undefined || v === null ? `{${name}}` : String(v)
  })
}

/**
 * Minimal `t()` mirroring I18nProvider (with the same track-count plural
 * special-case). Presence text follows the app locale, and refreshes
 * automatically when the user switches language.
 */
function t(key: string, vars?: Record<string, string | number>): string {
  const dict = DICTS[resolveLocale()]
  if (key === 'presence.trackCount' && vars && 'n' in vars) {
    const n = Number(vars.n)
    const pluralKey = n === 1 ? 'presence.trackCount.singular' : 'presence.trackCount'
    const template = dict[pluralKey] ?? DICTS.en[pluralKey] ?? pluralKey
    return interpolate(template, vars)
  }
  const template = dict[key] ?? DICTS.en[key] ?? key
  return interpolate(template, vars)
}

/**
 * Build a Discord external-image key (`mp:external/<hash>/<encoded-url>`)
 * for a remote artwork URL (e.g. Spotify album art). Local track art is a
 * data URL and cannot be fetched by Discord — the caller falls back to the
 * uploaded logo asset in that case.
 */
function externalImageKey(url: string): string {
  // 'https://host/path' → 'https/host/path', then percent-encode the rest
  // but keep path separators (matches Discord's media-proxy format).
  const encoded = encodeURIComponent(url.replace('://', '/')).replace(/%2F/gi, '/')
  return `mp:external/${hashUrl(url)}/${encoded}`
}

/** Small deterministic hash used as the `mp:external` cache key. */
function hashUrl(url: string): string {
  let h = 5381
  for (let i = 0; i < url.length; i++) {
    h = ((h << 5) + h + url.charCodeAt(i)) >>> 0
  }
  return h.toString(36)
}

class DiscordPresenceManager {
  private enabled = readBoolPref(DISCORD_RP_KEY, true)
  private ctx: UiContext = { view: 'local', audioLabOpen: false }
  private initialized = false
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  /** When the last flush ran (for the max-wait debounce). */
  private lastFlushAt = 0
  /** JSON of the last *content* push (excluding the volatile start timestamp). */
  private lastContentJson = ''
  private lastProgressAt = 0

  isEnabled(): boolean {
    return this.enabled
  }

  setEnabled(v: boolean): void {
    if (this.enabled === v) return
    this.enabled = v
    writeBoolPref(DISCORD_RP_KEY, v)
    if (v) {
      this.schedule()
    } else {
      this.flush()
      // Remove any presence already shown.
      invoke('discord_clear_activity').catch(() => {})
    }
  }

  setUiContext(ctx: UiContext): void {
    this.ctx = ctx
    this.schedule()
  }

  /** Call once at startup. Idempotent. */
  init(): void {
    if (this.initialized) return
    this.initialized = true

    // Event-driven subscriptions — no polling.
    usePlayerStore.subscribe(() => this.schedule())
    window.addEventListener('chiptune-dsp-changed', () => this.schedule())

    // Push the initial state shortly after boot so the store has settled.
    this.schedule()
  }

  /** Force an immediate re-evaluation (e.g. after the enable toggle). */
  refresh(): void {
    this.schedule()
  }

  private schedule(): void {
    if (!this.enabled) return
    const now = Date.now()
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
    // Trailing debounce with a hard cap: under continuous store updates
    // (progress callbacks every ~250 ms) the debounce still fires at least
    // every MAX_WAIT_MS, so track/status changes are pushed promptly.
    const elapsed = now - this.lastFlushAt
    const delay = Math.min(DEBOUNCE_MS, Math.max(0, MAX_WAIT_MS - elapsed))
    this.debounceTimer = setTimeout(() => this.flush(), delay)
  }

  private flush(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
    this.lastFlushAt = Date.now()
    if (!this.enabled) return

    const payload = this.buildActivity()
    const contentJson = JSON.stringify({
      details: payload.details,
      state: payload.state,
      largeImage: payload.largeImage ?? null,
      largeText: payload.largeText ?? null,
      smallImage: payload.smallImage ?? null,
      smallText: payload.smallText ?? null,
    })

    const now = Date.now()
    const playing = payload.startTs != null

    if (contentJson === this.lastContentJson) {
      // Only the progress anchor changed — throttle to one refresh per
      // PROGRESS_REFRESH_MS while playing, and skip entirely when paused.
      if (!playing) return
      if (now - this.lastProgressAt < PROGRESS_REFRESH_MS) return
      // Anchor the next progress refresh from THIS send, otherwise every
      // flush after the threshold would send again (update spam).
      this.lastProgressAt = now
    } else {
      this.lastContentJson = contentJson
      this.lastProgressAt = now
    }

    invoke('discord_update_activity', { payload }).catch(() => {})
  }

  /** Compute the activity for the current app state. */
  private buildActivity(): ActivityPayload {
    const s = usePlayerStore.getState()
    const np = s.nowPlaying
    const status = s.playbackStatus
    const audioLab = this.ctx.audioLabOpen

    const playbackActive =
      np != null && (status === 'playing' || status === 'paused' || status === 'loading')

    // Only read the DSP preset when AudioLab is actually visible — the
    // presence then shows "AudioLab Enabled" with the preset name.
    const presetName = audioLab
      ? dspEngine.getActivePresetName() ?? t('presence.customPreset')
      : null

    // ── Listening / Paused ─────────────────────────────────────
    if (playbackActive && np) {
      const isSpotify = s.activeSource !== 'local'
      // 'loading' is transient (a second or two) — show it as listening
      // without an elapsed timer rather than a confusing "Paused".
      const isPlaying = status === 'playing'

      let state = [np.title, np.artist].filter(Boolean).join(' — ')
      if (np.album) state += ` — ${np.album}`
      if (presetName) state += ` • ${t('presence.audioLabEnabled')}: ${presetName}`

      // Album art via Discord's external-image proxy when it's a remote
      // URL (Spotify); local pixel-art data URLs can't be fetched, so fall
      // back to the uploaded © Chiptune AudioLab logo.
      const artUrl = np.imageUrl && /^https?:/i.test(np.imageUrl) ? np.imageUrl : null
      const largeImage = artUrl ? externalImageKey(artUrl) : LOGO_KEY
      const largeText = artUrl ? np.title : t('presence.audioLabBrand')

      return {
        details: isPlaying ? t('presence.listening') : t('presence.paused'),
        state,
        largeImage,
        largeText,
        smallImage: isSpotify ? SPOTIFY_KEY : LOCAL_KEY,
        smallText: isSpotify ? t('presence.spotify') : t('presence.localMusic'),
        // Anchor the elapsed timer to the current position. Refreshed
        // periodically by the throttle in flush().
        startTs: isPlaying ? Math.floor(Date.now() / 1000) - Math.floor(s.currentTime) : undefined,
      }
    }

    // ── Editing AudioLab ───────────────────────────────────────
    if (audioLab) {
      return {
        details: t('presence.editingAudioLab'),
        state: `${t('presence.audioLabEnabled')} • ${presetName}`,
        largeImage: LOGO_KEY,
        largeText: t('presence.audioLabBrand'),
      }
    }

    // ── Browsing Spotify ───────────────────────────────────────
    if (this.ctx.view === 'spotify') {
      const accountName = useSpotifyStore.getState().account?.display_name
      return {
        details: t('presence.browsingSpotify'),
        state: accountName ? `${t('presence.spotify')} — ${accountName}` : t('presence.spotify'),
        largeImage: LOGO_KEY,
        largeText: t('presence.audioLabBrand'),
        smallImage: SPOTIFY_KEY,
        smallText: t('presence.spotify'),
      }
    }

    // ── Browsing Library / Idle ────────────────────────────────
    const count = s.tracks.length
    if (count > 0) {
      return {
        details: t('presence.browsingLibrary'),
        state: t('presence.trackCount', { n: count }),
        largeImage: LOGO_KEY,
        largeText: t('presence.audioLabBrand'),
        smallImage: LOCAL_KEY,
        smallText: t('presence.localMusic'),
      }
    }
    return {
      details: t('presence.idle'),
      state: t('app.title'),
      largeImage: LOGO_KEY,
      largeText: t('presence.audioLabBrand'),
    }
  }
}

/** Singleton — import and use directly. */
export const discordPresence = new DiscordPresenceManager()
