import { useEffect, useLayoutEffect, useRef } from 'react'
import { useT } from '../i18n/useT'
import {
  usePlayerStore,
  type LocaleChoice,
  LOCALE_CHOICES,
} from '../state/usePlayerStore'

export interface SettingsDrawerProps {
  open: boolean
  onClose: () => void
  /** Backing element to receive focus when the drawer closes. */
  returnFocusRef: { current: HTMLElement | null }
}

/**
 * The right-side slide-in settings panel. Hosts three sections:
 * LANGUAGE (segmented EN / FR / OS), PLAYBACK
 * (starting volume, auto-play, stop behavior, shuffle on import),
 * DISPLAY (always-on-top toggle).
 *
 * Closes on:
 *   - the ✕ button in the header
 *   - the "FERMER" / "CLOSE" button at the foot
 *   - the backdrop click
 *   - the Escape key
 *
 * Focus is moved into the drawer on open and restored to
 * `returnFocusRef.current` on close.
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

  const panelRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  // Focus management. On open, capture the previously-focused element
  // and move focus into the drawer. On close, restore focus.
  useEffect(() => {
    if (!open) return
    const previouslyFocused = returnFocusRef.current ?? (document.activeElement as HTMLElement | null)
    // Move focus into the drawer. The close button is the safest target
    // because it is always present and visually clear.
    const focusTarget = closeBtnRef.current ?? panelRef.current
    focusTarget?.focus()
    return () => {
      previouslyFocused?.focus?.()
    }
  }, [open, returnFocusRef])

  // Esc-to-close. The drawer's panel itself is focusable, so a keydown
  // listener attached to the panel is sufficient — but we use a global
  // listener so Escape works even when no element inside the drawer is
  // focused (e.g. when focus drifted back to the settings button).
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
        // Make the panel focusable so screen readers can announce it
        // even if focus drifts off an internal control.
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
