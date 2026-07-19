import { useCallback, useEffect, useRef, useState } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import './App.css'
import { Library } from './components/Library'
import { RecordPlayer } from './components/RecordPlayer'
import { TransportControls } from './components/TransportControls'
import { usePlayerStore, type ThemeId } from './state/usePlayerStore'
import { setupPersistenceSubscription } from './lib/libraryPersistence'
import { audioController } from './lib/audio'
import { addAudioFiles } from './lib/addAudioFiles'
import { AppContextMenu } from './components/AppContextMenu'
import { KeyboardShortcutsDialog } from './components/KeyboardShortcutsDialog'
import { AboutDialog } from './components/AboutDialog'
import { SettingsButton } from './components/SettingsButton'
import { SettingsDrawer } from './components/SettingsDrawer'
import { TitleBar } from './components/TitleBar'
import { I18nProvider } from './i18n/I18nProvider'

// A bit longer than the CSS animation total (360ms) so the class is
// always removed after the animation visibly finishes.
const FADE_TOTAL_MS = 400

// Selectors for the 3 sections that fade in sequence on theme change.
// The class names are stable and unique within the app.
const FADE_SELECTORS = ['.library', '.record-player', '.transport'] as const

interface AppMenuState {
  x: number
  y: number
}

function App() {
  const theme = usePlayerStore((s) => s.theme)
  const tracks = usePlayerStore((s) => s.tracks)
  const currentIndex = usePlayerStore((s) => s.currentIndex)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const next = usePlayerStore((s) => s.next)
  const prev = usePlayerStore((s) => s.prev)
  const shuffleUpcoming = usePlayerStore((s) => s.shuffleUpcoming)
  const clearUpcoming = usePlayerStore((s) => s.clearUpcoming)

  const [appMenu, setAppMenu] = useState<AppMenuState | null>(null)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsButtonRef = useRef<HTMLButtonElement | null>(null)

  // Capture the initial theme once. Comparing against this (rather than
  // a useRef boolean) survives React StrictMode's double-invocation in
  // development — useRef's initial value is set on the first render
  // and persists, so both dev mounts see the same value and both skip
  // the animation. The animation only runs when the theme actually
  // changes to a different value.
  const initialTheme = useRef<ThemeId>(usePlayerStore.getState().theme)

  useEffect(() => {
    if (theme === initialTheme.current) return

    const els = FADE_SELECTORS.map((sel) => document.querySelector(sel)).filter(
      (el): el is HTMLElement => el !== null,
    )
    if (els.length === 0) return

    // Restart the CSS animation: remove the class, force a reflow so
    // the browser registers the removal, then re-add the class. The
    // reflow read (`void el.offsetWidth`) is the load-bearing step.
    els.forEach((el) => {
      el.classList.remove('theme-fading')
      void el.offsetWidth
      el.classList.add('theme-fading')
    })

    const timer = window.setTimeout(() => {
      els.forEach((el) => el.classList.remove('theme-fading'))
    }, FADE_TOTAL_MS)

    return () => window.clearTimeout(timer)
  }, [theme])

  // Install the library persistence subscriber once on mount. The
  // returned cleanup unsubscribes and flushes any pending debounced
  // save so a last-second edit isn't lost on unmount (HMR or app close).
  useEffect(() => {
    return setupPersistenceSubscription()
  }, [])

  const hasTracks = tracks.length > 0
  const hasCurrent = currentIndex >= 0 && tracks[currentIndex] !== undefined
  // Number of tracks scheduled to play after the current one.
  const upcomingCount = hasCurrent
    ? Math.max(0, tracks.length - 1 - currentIndex)
    : 0

  // Global right-click handler. Shows the app context menu on any
  // right-click within the app root. The default browser context menu is
  // already suppressed by a window-level listener (in main.tsx), so we
  // unconditionally show our custom retro menu instead.
  //
  // Elements that have their own context menu (library track rows, the
  // context menu itself) call e.stopPropagation in their own handlers,
  // so they never reach here — we don't need to explicitly exclude them.
  const onAppContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setAppMenu({ x: e.clientX, y: e.clientY })
  }, [])

  // All close/show handlers are memoized so the AppContextMenu and
  // dialog effects (which depend on onClose) don't re-bind on every
  // parent render.
  const closeAppMenu = useCallback(() => setAppMenu(null), [])
  const openShortcuts = useCallback(() => {
    setShortcutsOpen(true)
    setAppMenu(null)
  }, [])
  const closeShortcuts = useCallback(() => setShortcutsOpen(false), [])
  const openAbout = useCallback(() => {
    setAboutOpen(true)
    setAppMenu(null)
  }, [])
  const closeAbout = useCallback(() => setAboutOpen(false), [])
  const openSettings = useCallback(() => setSettingsOpen(true), [])
  const closeSettings = useCallback(() => setSettingsOpen(false), [])

  function onPlayPause() {
    if (!hasCurrent) return
    audioController.togglePlay()
  }
  function onStop() {
    if (!hasCurrent) return
    audioController.stop()
  }
  function onNext() {
    if (!hasTracks) return
    next()
  }
  function onPrev() {
    if (!hasTracks) return
    prev()
  }
  function onAddFiles() {
    void addAudioFiles()
  }
  function onShuffle() {
    shuffleUpcoming()
  }
  function onClear() {
    clearUpcoming()
  }
  async function onQuit() {
    try {
      await getCurrentWindow().close()
    } catch (err) {
      console.error('[quit] failed', err)
    }
  }

  return (
    <I18nProvider>
      <div className="app-root" onContextMenu={onAppContextMenu}>
        <TitleBar />
        <Library />
        <main className="app-main">
          <SettingsButton
            ref={settingsButtonRef}
            open={settingsOpen}
            onClick={() => {
              if (settingsOpen) closeSettings()
              else openSettings()
            }}
          />
          <RecordPlayer className="app-main__record" />
          <TransportControls />
        </main>

        {appMenu && (
          <AppContextMenu
            x={appMenu.x}
            y={appMenu.y}
            isPlaying={isPlaying}
            hasTracks={hasTracks}
            hasCurrent={hasCurrent}
            upcomingCount={upcomingCount}
            onClose={closeAppMenu}
            onPlayPause={onPlayPause}
            onNext={onNext}
            onPrev={onPrev}
            onStop={onStop}
            onAddFiles={onAddFiles}
            onShuffle={onShuffle}
            onClear={onClear}
            onShowShortcuts={openShortcuts}
            onShowAbout={openAbout}
            onQuit={onQuit}
          />
        )}

        {shortcutsOpen && (
          <KeyboardShortcutsDialog onClose={closeShortcuts} />
        )}
        {aboutOpen && <AboutDialog onClose={closeAbout} />}

        <SettingsDrawer
          open={settingsOpen}
          onClose={closeSettings}
          returnFocusRef={{ current: settingsButtonRef.current }}
        />
      </div>
    </I18nProvider>
  )
}

export default App
