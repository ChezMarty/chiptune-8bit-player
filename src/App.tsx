import { useCallback, useEffect, useRef, useState } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import './App.css'
import { Library, type LibraryTab } from './components/Library'
import { LibrespotWarningDialog } from './components/LibrespotWarningDialog'
import { SpotifyPanel } from './components/SpotifyPanel'
import { RecordPlayer } from './components/RecordPlayer'
import { TransportControls } from './components/TransportControls'
import { usePlayerStore, type ThemeId } from './state/usePlayerStore'
import { useSpotifyStore } from './state/useSpotifyStore'
import { setupPersistenceSubscription } from './lib/libraryPersistence'
import { playbackEngine } from './lib/playback/engine'
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
  const queue = usePlayerStore((s) => s.queue)
  const queueIndex = usePlayerStore((s) => s.queueIndex)
  const shuffleUpcoming = usePlayerStore((s) => s.shuffleUpcoming)
  const shuffleQueue = usePlayerStore((s) => s.shuffleQueue)
  const clearUpcoming = usePlayerStore((s) => s.clearUpcoming)
  const clearQueue = usePlayerStore((s) => s.clearQueue)
  const spotifyConnected = useSpotifyStore((s) => s.account?.connected ?? false)
  const librespotWarningDismissed = useSpotifyStore((s) => s.librespotWarningDismissed)
  const librespotShowWarning = useSpotifyStore((s) => s.librespotShowWarning)
  const setWarningDismissed = useSpotifyStore((s) => s.setLibrespotWarningDismissed)

  // Pending Spotify track to play after warning is accepted.
  const [showLibrespotWarning, setShowLibrespotWarning] = useState(false)
  const pendingTrackRef = useRef<(() => void) | null>(null)

  // When the user clicks a Spotify track, check if warning is needed.
  const handlePlaySpotifyTrack = useCallback(
    (playFn: () => void) => {
      if (librespotShowWarning || !librespotWarningDismissed) {
        // Show the warning dialog first.
        pendingTrackRef.current = playFn
        setShowLibrespotWarning(true)
      } else {
        playFn()
      }
    },
    [librespotShowWarning, librespotWarningDismissed],
  )

  const handleWarningAccept = useCallback(() => {
    setShowLibrespotWarning(false)
    setWarningDismissed(true)
    // Execute the pending play.
    pendingTrackRef.current?.()
    pendingTrackRef.current = null
  }, [setWarningDismissed])

  const handleWarningClose = useCallback(() => {
    setShowLibrespotWarning(false)
    pendingTrackRef.current = null
  }, [])

  const [appMenu, setAppMenu] = useState<AppMenuState | null>(null)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [libraryTab, setLibraryTab] = useState<LibraryTab>('local')
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

  // Initialize the playback engine on mount (loads Spotify SDK, etc.).
  useEffect(() => {
    playbackEngine.initialize().then(() => {
      // Apply the restored volume to all playback providers so they all
      // reflect the persisted volume immediately on startup.
      const vol = usePlayerStore.getState().volume
      playbackEngine.setVolume(vol)
    })
  }, [])

  // Auto-switch to Spotify tab if connected on mount.
  useEffect(() => {
    if (spotifyConnected && libraryTab === 'local') {
      // Only auto-switch if the local library is empty.
      if (tracks.length === 0) {
        setLibraryTab('spotify')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotifyConnected])

  const isQueueActive = queue.length > 0
  const hasTracks = tracks.length > 0 || isQueueActive
  const hasCurrent = isQueueActive
    ? queueIndex >= 0 && queue[queueIndex] !== undefined
    : currentIndex >= 0 && tracks[currentIndex] !== undefined
  // Number of tracks scheduled to play after the current one.
  const upcomingCount = isQueueActive
    ? Math.max(0, queue.length - 1 - queueIndex)
    : hasCurrent
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
    playbackEngine.togglePlay()
  }
  function onStop() {
    if (!hasCurrent) return
    playbackEngine.stop()
  }
  function onNext() {
    if (!hasTracks) return
    playbackEngine.next()
  }
  function onPrev() {
    if (!hasTracks) return
    playbackEngine.prev()
  }
  function onAddFiles() {
    void addAudioFiles()
  }
  function onShuffle() {
    if (isQueueActive) {
      shuffleQueue()
    } else {
      shuffleUpcoming()
    }
  }
  function onClear() {
    if (isQueueActive) {
      clearQueue()
    } else {
      clearUpcoming()
    }
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
        {libraryTab === 'local' ? (
          <Library activeTab={libraryTab} onTabChange={setLibraryTab} />
        ) : (
          <div className="library pixel-panel">
            <div className="library__tabs">
              <button
                className="library__tab"
                onClick={() => setLibraryTab('local')}
              >
                💻 LOCAL
              </button>
              <button className="library__tab is-active">
                🟢 SPOTIFY
              </button>
            </div>
            <SpotifyPanel onPlayTrack={handlePlaySpotifyTrack} />
          </div>
        )}
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

        {showLibrespotWarning && (
          <LibrespotWarningDialog
            onAccept={handleWarningAccept}
            onClose={handleWarningClose}
          />
        )}
      </div>
    </I18nProvider>
  )
}

export default App
