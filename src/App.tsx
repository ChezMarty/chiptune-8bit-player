import { useEffect, useRef } from 'react'
import './App.css'
import { Library } from './components/Library'
import { RecordPlayer } from './components/RecordPlayer'
import { TransportControls } from './components/TransportControls'
import { usePlayerStore, type ThemeId } from './state/usePlayerStore'

// A bit longer than the CSS animation total (360ms) so the class is
// always removed after the animation visibly finishes.
const FADE_TOTAL_MS = 400

// Selectors for the 3 sections that fade in sequence on theme change.
// The class names are stable and unique within the app.
const FADE_SELECTORS = ['.library', '.record-player', '.transport'] as const

function App() {
  const theme = usePlayerStore((s) => s.theme)

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

  return (
    <div className="app-root">
      <Library />
      <main className="app-main">
        <RecordPlayer className="app-main__record" />
        <TransportControls />
      </main>
    </div>
  )
}

export default App
