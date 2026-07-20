import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'
import { useT } from '../i18n/useT'
import {
  usePlayerStore,
  type LocaleChoice,
  LOCALE_CHOICES,
} from '../state/usePlayerStore'
import { useSpotifyStore } from '../state/useSpotifyStore'

export interface SettingsDrawerProps {
  open: boolean
  onClose: () => void
  /** Backing element to receive focus when the drawer closes. */
  returnFocusRef: { current: HTMLElement | null }
}

/**
 * The right-side slide-in settings panel.
 *
 * Sections: LANGUAGE, PLAYBACK, SPOTIFY (with experimental Librespot status),
 * DISPLAY.
 */
export function SettingsDrawer({ open, onClose, returnFocusRef }: SettingsDrawerProps) {
  const { t } = useT()
  const localeChoice = usePlayerStore((s) => s.locale)
  const setLocale = usePlayerStore((s) => s.setLocale)
  const startVolume = usePlayerStore((s) => s.startVolume)
  const setStartVolume = usePlayerStore((s) => s.setStartVolume)
  const autoPlayOnImport = usePlayerStore((s) => s.autoPlayOnImport)
  const setAutoPlayOnImport = usePlayerStore((s) => s.setAutoPlayOnImport)
  const stopRewinds = usePlayerStore((s) => s.stopRewinds)
  const setStopRewinds = usePlayerStore((s) => s.setStopRewinds)
  const shuffleOnImport = usePlayerStore((s) => s.shuffleOnImport)
  const setShuffleOnImport = usePlayerStore((s) => s.setShuffleOnImport)
  const alwaysOnTop = usePlayerStore((s) => s.alwaysOnTop)
  const setAlwaysOnTop = usePlayerStore((s) => s.setAlwaysOnTop)

  // Spotify state
  const spotifyConfigured = useSpotifyStore((s) => s.isConfigured)
  const spotifyConfigLoading = useSpotifyStore((s) => s.configLoading)
  const spotifyAccount = useSpotifyStore((s) => s.account)
  const loadSpotifyConfig = useSpotifyStore((s) => s.loadConfig)
  const saveSpotifyClientId = useSpotifyStore((s) => s.saveClientId)
  const spotifyBeginLogin = useSpotifyStore((s) => s.beginLogin)
  const spotifyDoLogout = useSpotifyStore((s) => s.doLogout)

  // Librespot state
  const librespotVersion = useSpotifyStore((s) => s.librespotVersion)
  const librespotVersionLoading = useSpotifyStore((s) => s.librespotVersionLoading)
  const loadLibrespotVersion = useSpotifyStore((s) => s.loadLibrespotVersion)
  const librespotShowWarning = useSpotifyStore((s) => s.librespotShowWarning)
  const setLibrespotShowWarning = useSpotifyStore((s) => s.setLibrespotShowWarning)

  const panelRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const [clientIdInput, setClientIdInput] = useState('')
  const [spotifySaving, setSpotifySaving] = useState(false)
  const [spotifyConnecting, setSpotifyConnecting] = useState(false)

  // Load Spotify config and librespot version when settings open.
  useEffect(() => {
    if (open) {
      loadSpotifyConfig().then(() => {
        setClientIdInput(useSpotifyStore.getState().clientId)
      })
      loadLibrespotVersion()
    }
  }, [open, loadSpotifyConfig, loadLibrespotVersion])

  const handleSaveClientId = useCallback(async () => {
    setSpotifySaving(true)
    await saveSpotifyClientId(clientIdInput)
    setSpotifySaving(false)
  }, [clientIdInput, saveSpotifyClientId])

  const handleSpotifyConnect = useCallback(async () => {
    setSpotifyConnecting(true)
    onClose()
    await spotifyBeginLogin()
    setSpotifyConnecting(false)
  }, [spotifyBeginLogin, onClose])

  const handleSpotifyDisconnect = useCallback(async () => {
    await spotifyDoLogout()
    await loadSpotifyConfig()
  }, [spotifyDoLogout, loadSpotifyConfig])

  // Move focus into the drawer on open, restore on close.
  useEffect(() => {
    if (!open) return
    const previouslyFocused = returnFocusRef.current ?? (document.activeElement as HTMLElement | null)
    const focusTarget = closeBtnRef.current ?? panelRef.current
    focusTarget?.focus()
    return () => {
      previouslyFocused?.focus?.()
    }
  }, [open, returnFocusRef])

  // Esc-to-close.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Lock body scroll while the drawer is open.
  useLayoutEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  const onBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="settings-drawer__backdrop"
      role="presentation"
      onClick={onBackdropClick}
    >
      <div
        ref={panelRef}
        className="settings-drawer pixel-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={t('settings.title.id')}
        tabIndex={-1}
      >
        <header className="settings-drawer__header">
          <span id={t('settings.title.id')} className="settings-drawer__title">
            {t('settings.title')}
          </span>
          <button
            ref={closeBtnRef}
            type="button"
            className="settings-drawer__close"
            onClick={onClose}
            aria-label={t('settings.close.aria')}
            title={t('settings.close.title')}
          >
            ✕
          </button>
        </header>

        <div className="settings-drawer__body">
          <Section title={t('settings.section.language')}>
            <SegmentedRow>
              {LOCALE_CHOICES.map((c) => (
                <SegmentButton
                  key={c}
                  active={localeChoice === c}
                  onClick={() => setLocale(c as LocaleChoice)}
                  aria-label={t('settings.language.' + c)}
                >
                  {t('settings.language.' + c)}
                </SegmentButton>
              ))}
            </SegmentedRow>
            <p className="settings-section__hint">{t('settings.language.hint')}</p>
          </Section>

          <Section title={t('settings.section.playback')}>
            <div className="settings-row">
              <span className="settings-row__label">
                {t('settings.playback.startVolume')}
              </span>
              <div className="settings-row__control settings-row__volume">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={startVolume}
                  onChange={(e) => setStartVolume(Number(e.target.value))}
                  aria-label={t('settings.playback.startVolume')}
                />
                <span className="settings-row__value">{startVolume}</span>
              </div>
            </div>

            <div className="settings-row">
              <span className="settings-row__label">
                {t('settings.playback.autoPlay')}
              </span>
              <SegmentedRow compact>
                <SegmentButton
                  active={!autoPlayOnImport}
                  onClick={() => setAutoPlayOnImport(false)}
                  aria-label={t('settings.playback.autoPlay') + ' ' + t('settings.off')}
                >
                  {t('settings.off')}
                </SegmentButton>
                <SegmentButton
                  active={autoPlayOnImport}
                  onClick={() => setAutoPlayOnImport(true)}
                  aria-label={t('settings.playback.autoPlay') + ' ' + t('settings.on')}
                >
                  {t('settings.on')}
                </SegmentButton>
              </SegmentedRow>
            </div>

            <div className="settings-row">
              <span className="settings-row__label">
                {t('settings.playback.stopBehavior')}
              </span>
              <SegmentedRow compact>
                <SegmentButton
                  active={!stopRewinds}
                  onClick={() => setStopRewinds(false)}
                  aria-label={
                    t('settings.playback.stopBehavior') + ' ' + t('settings.playback.stop.pause')
                  }
                >
                  {t('settings.playback.stop.pause')}
                </SegmentButton>
                <SegmentButton
                  active={stopRewinds}
                  onClick={() => setStopRewinds(true)}
                  aria-label={
                    t('settings.playback.stopBehavior') + ' ' + t('settings.playback.stop.rewind')
                  }
                >
                  {t('settings.playback.stop.rewind')}
                </SegmentButton>
              </SegmentedRow>
            </div>
            <p className="settings-section__hint">{t('settings.playback.stopBehaviorHint')}</p>

            <div className="settings-row">
              <span className="settings-row__label">
                {t('settings.playback.shuffleOnImport')}
              </span>
              <SegmentedRow compact>
                <SegmentButton
                  active={!shuffleOnImport}
                  onClick={() => setShuffleOnImport(false)}
                  aria-label={t('settings.playback.shuffleOnImport') + ' ' + t('settings.off')}
                >
                  {t('settings.off')}
                </SegmentButton>
                <SegmentButton
                  active={shuffleOnImport}
                  onClick={() => setShuffleOnImport(true)}
                  aria-label={t('settings.playback.shuffleOnImport') + ' ' + t('settings.on')}
                >
                  {t('settings.on')}
                </SegmentButton>
              </SegmentedRow>
            </div>
          </Section>

          <Section title={t('settings.section.spotify')}>
            {/* Experimental badge */}
            <div
              className="settings-row"
              style={{ marginBottom: 8 }}
            >
              <span className="settings-row__label">
                {t('settings.spotify.engine')}
              </span>
              <span
                className="settings-row__value"
                style={{
                  background: 'rgba(255, 200, 0, 0.2)',
                  border: '1px solid rgba(255, 200, 0, 0.5)',
                  borderRadius: 3,
                  padding: '2px 8px',
                  fontSize: '0.75em',
                  fontWeight: 'bold',
                }}
              >
                ⚗️ {t('settings.spotify.experimental')}
              </span>
            </div>

            {/* Librespot version */}
            <div className="settings-row">
              <span className="settings-row__label">
                {t('settings.spotify.librespotVersion')}
              </span>
              <span className="settings-row__value">
                {librespotVersionLoading
                  ? '...'
                  : librespotVersion
                    ? `librespot v${librespotVersion}`
                    : t('settings.spotify.notAvailable')}
              </span>
            </div>

            <div className="settings-row">
              <span className="settings-row__label">
                {t('settings.spotify.clientId')}
              </span>
              <div className="settings-row__control">
                <input
                  type="text"
                  className="settings-row__input"
                  placeholder={t('settings.spotify.clientIdPlaceholder')}
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  disabled={spotifyConfigLoading || spotifySaving}
                />
              </div>
            </div>
            <p className="settings-section__hint">{t('settings.spotify.clientIdHint')}</p>

            <div className="settings-row">
              <span className="settings-row__label">
                {t('settings.spotify.status')}
              </span>
              <span
                className={`settings-row__value ${spotifyConfigured ? 'settings-row__value--ok' : 'settings-row__value--warn'}`}
              >
                {spotifyAccount?.connected
                  ? t('settings.spotify.statusConnected', { name: spotifyAccount.display_name ?? '?' })
                  : spotifyConfigured
                    ? t('settings.spotify.statusConfigured')
                    : t('settings.spotify.statusNotConfigured')}
              </span>
            </div>

            <div className="settings-row settings-row--buttons">
              <button
                className="pixel-button"
                onClick={handleSaveClientId}
                disabled={spotifyConfigLoading || spotifySaving}
              >
                {spotifySaving ? '...' : t('settings.spotify.save')}
              </button>
            </div>

            {spotifyConfigured && (
              <div className="settings-row settings-row--buttons">
                {spotifyAccount?.connected ? (
                  <button
                    className="pixel-button pixel-button--stop"
                    onClick={handleSpotifyDisconnect}
                  >
                    {t('settings.spotify.disconnect')}
                  </button>
                ) : (
                  <button
                    className="pixel-button spotify-panel__login-btn"
                    onClick={handleSpotifyConnect}
                    disabled={spotifyConnecting}
                  >
                    {spotifyConnecting ? t('settings.spotify.connecting') : t('settings.spotify.connect')}
                  </button>
                )}
              </div>
            )}

            {/* Show warning again toggle */}
            <div className="settings-row">
              <span className="settings-row__label">
                {t('settings.spotify.showWarning')}
              </span>
              <SegmentedRow compact>
                <SegmentButton
                  active={!librespotShowWarning}
                  onClick={() => setLibrespotShowWarning(false)}
                  aria-label={t('settings.spotify.showWarning') + ' ' + t('settings.off')}
                >
                  {t('settings.off')}
                </SegmentButton>
                <SegmentButton
                  active={librespotShowWarning}
                  onClick={() => {
                    setLibrespotShowWarning(true)
                    // Also reset the dismissed flag so the warning shows next time.
                    useSpotifyStore.getState().setLibrespotWarningDismissed(false)
                  }}
                  aria-label={t('settings.spotify.showWarning') + ' ' + t('settings.on')}
                >
                  {t('settings.on')}
                </SegmentButton>
              </SegmentedRow>
            </div>
            <p className="settings-section__hint">
              {t('settings.spotify.showWarningHint')}
            </p>
          </Section>

          <Section title={t('settings.section.display')}>
            <div className="settings-row">
              <span className="settings-row__label">
                {t('settings.display.alwaysOnTop')}
              </span>
              <SegmentedRow compact>
                <SegmentButton
                  active={!alwaysOnTop}
                  onClick={() => void setAlwaysOnTop(false)}
                  aria-label={t('settings.display.alwaysOnTop') + ' ' + t('settings.off')}
                >
                  {t('settings.off')}
                </SegmentButton>
                <SegmentButton
                  active={alwaysOnTop}
                  onClick={() => void setAlwaysOnTop(true)}
                  aria-label={t('settings.display.alwaysOnTop') + ' ' + t('settings.on')}
                >
                  {t('settings.on')}
                </SegmentButton>
              </SegmentedRow>
            </div>
            <p className="settings-section__hint">{t('settings.display.alwaysOnTopHint')}</p>
          </Section>
        </div>

        <footer className="settings-drawer__footer">
          <button
            type="button"
            className="pixel-button settings-drawer__close-action"
            onClick={onClose}
          >
            {t('button.close')}
          </button>
        </footer>
      </div>
    </div>
  )
}

interface SectionProps {
  title: string
  children: React.ReactNode
}
function Section({ title, children }: SectionProps) {
  return (
    <section className="settings-section">
      <h2 className="settings-section__title">{title}</h2>
      {children}
    </section>
  )
}

interface SegmentedRowProps {
  compact?: boolean
  children: React.ReactNode
}
function SegmentedRow({ compact, children }: SegmentedRowProps) {
  return (
    <div
      className={`settings-row__control settings-row__segments ${compact ? 'settings-row__segments--compact' : ''}`.trim()}
      role="group"
    >
      {children}
    </div>
  )
}

interface SegmentButtonProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  'aria-label'?: string
}
function SegmentButton({ active, onClick, children, ...rest }: SegmentButtonProps) {
  return (
    <button
      type="button"
      className={
        `settings-row__segment ${active ? 'settings-row__segment--active' : ''}`.trim()
      }
      onClick={onClick}
      aria-pressed={active}
      {...rest}
    >
      {children}
    </button>
  )
}
