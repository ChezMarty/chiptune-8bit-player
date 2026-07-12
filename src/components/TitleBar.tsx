import { useCallback, useEffect, useState } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useT } from '../i18n/useT'

/**
 * Custom in-app title bar. Replaces the OS-rendered title bar
 * (see `decorations: false` in tauri.conf.json) so the app can theme
 * it like the rest of the chrome — chunky pixel buttons, Press Start
 * 2P labels, theme-token colors.
 *
 * Window-drag strategy — fix for buttons eaten by webview:
 *
 * Earlier attempts relied on CSS `-webkit-app-region: drag` plus
 * `-webkit-app-region: no-drag` on the buttons. On Windows WebView2
 * the `no-drag` opt-out is unreliable: the OS keeps treating the bar
 * as `HTCAPTION` and swallows click events on the inner buttons,
 * which is why the min/max/close onClick handlers were never firing.
 *
 * The current approach is fully programmatic through the Tauri JS
 * API:
 *   - `data-tauri-drag-region` is set on the wrapping div. Tauri's
 *     own OS hook fires the window drag when it sees a drag motion;
 *     buttons inside are passed through correctly because the hook
 *     does not capture click events unless the mouse moves.
 *   - As an extra belt-and-braces on Linux/macOS WebKit, the same
 *     drag motion goes through Tauri's JS bridge.
 *
 * The CSS side is now plain: no `-webkit-app-region`, no
 * `pointer-events: none` (which used to mask clicks on the title
 * text). Buttons are normal `<button>` elements that receive their
 * clicks directly.
 *
 * The window-control API is wrapped in try/catch so the component
 * still renders cleanly under a browser preview (no Tauri runtime).
 */
export function TitleBar() {
  const { t } = useT()

  // Reflect the live maximize state on the maximize/restore button so
  // it always shows the action the click will perform. The event
  // listener also catches external maximize changes (e.g. a Win+Up
  // keyboard shortcut).
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    let unlisten: (() => void) | null = null
    let cancelled = false

    void (async () => {
      try {
        const win = getCurrentWindow()
        setIsMaximized(await win.isMaximized())
        const stop = await win.onResized(async () => {
          if (cancelled) return
          try {
            setIsMaximized(await win.isMaximized())
          } catch {
            // Window may already be gone (close in flight); ignore.
          }
        })
        unlisten = stop
      } catch {
        // Not running under Tauri (browser preview). Buttons still
        // render; clicks just log a console error.
      }
    })()

    return () => {
      cancelled = true
      if (unlisten) unlisten()
    }
  }, [])

  const handleMinimize = useCallback(async () => {
    try {
      await getCurrentWindow().minimize()
    } catch (err) {
      console.error('[titlebar] minimize failed', err)
    }
  }, [])

  const handleToggleMax = useCallback(async () => {
    try {
      await getCurrentWindow().toggleMaximize()
    } catch (err) {
      console.error('[titlebar] toggleMaximize failed', err)
    }
  }, [])

  const handleClose = useCallback(async () => {
    try {
      await getCurrentWindow().close()
    } catch (err) {
      console.error('[titlebar] close failed', err)
    }
  }, [])

  // Double-clicking the drag region toggles maximize. Standard
  // desktop-window convention; users expect it.
  const handleDragDoubleClick = useCallback(async () => {
    try {
      await getCurrentWindow().toggleMaximize()
    } catch (err) {
      console.error('[titlebar] dblclick maximize failed', err)
    }
  }, [])

  // Suppress the drag region's own context menu so right-clicking
  // the bar doesn't fall through to the webview default. The global
  // app context menu in App.tsx still fires off the bar because the
  // event bubbles up.
  const suppressContext = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
  }, [])

  // Programmatic window drag. Tauri's `startDragging()` releases
  // back to normal click handling when the mouse doesn't move
  // (i.e. a plain click), so button clicks inside the bar still
  // fire — we only skip the drag if the mousedown target is itself
  // an interactive child (a button).
  const handleTitlebarMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return
      const target = e.target as HTMLElement | null
      if (target?.closest('button, input, textarea, select, a')) return
      e.preventDefault()
      void getCurrentWindow()
        .startDragging()
        .catch((err) => {
          console.error('[titlebar] startDragging failed', err)
        })
    },
    [],
  )

  return (
    <div
      className="titlebar"
      data-tauri-drag-region
      onMouseDown={handleTitlebarMouseDown}
      onDoubleClick={handleDragDoubleClick}
      onContextMenu={suppressContext}
    >
      <div className="titlebar__brand">
        <span className="titlebar__logo" aria-hidden="true">
          {/* Tiny pixel-art "play" triangle — chiptune music cue,
              themes via currentColor so it picks up the active accent. */}
          <svg viewBox="0 0 8 8" width="11" height="11">
            <rect x="1" y="1" width="2" height="2" fill="currentColor" />
            <rect x="1" y="3" width="2" height="2" fill="currentColor" />
            <rect x="1" y="5" width="2" height="2" fill="currentColor" />
            <rect x="3" y="3" width="2" height="2" fill="currentColor" />
            <rect x="3" y="5" width="2" height="2" fill="currentColor" />
            <rect x="5" y="3" width="2" height="2" fill="currentColor" />
          </svg>
        </span>
        <span className="titlebar__title">{t('titlebar.appName')}</span>
      </div>

      <div className="titlebar__spacer" aria-hidden="true" />

      <div className="titlebar__controls" role="group">
        <button
          type="button"
          className="titlebar__btn titlebar__btn--min"
          onClick={handleMinimize}
          aria-label={t('titlebar.minimize')}
          title={t('titlebar.minimize')}
        >
          {/* Single horizontal line near the bottom of the square. */}
          <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">
            <rect x="2" y="7" width="6" height="2" fill="currentColor" />
          </svg>
        </button>
        <button
          type="button"
          className="titlebar__btn titlebar__btn--max"
          onClick={handleToggleMax}
          aria-label={
            isMaximized ? t('titlebar.restore') : t('titlebar.maximize')
          }
          title={isMaximized ? t('titlebar.restore') : t('titlebar.maximize')}
        >
          {/* Both states paint only with currentColor so the icons
              render identically across SVG implementations (no
              CSS-var indirection in SVG fill or stroke attrs).
              The maximize state is a solid filled block (full
              window surface); the restore state is an outlined
              square (a "shell" / un-filled affordance) — shape
              is more legible than size at 10x10px. */}
          {isMaximized ? (
            <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">
              <rect
                x="1.5"
                y="1.5"
                width="7"
                height="7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">
              <rect x="1" y="1" width="8" height="8" fill="currentColor" />
            </svg>
          )}
        </button>
        <button
          type="button"
          className="titlebar__btn titlebar__btn--close"
          onClick={handleClose}
          aria-label={t('titlebar.close')}
          title={t('titlebar.close')}
        >
          {/* Diagonal pixel staircase X. */}
          <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">
            <rect x="1" y="1" width="2" height="2" fill="currentColor" />
            <rect x="3" y="3" width="2" height="2" fill="currentColor" />
            <rect x="5" y="5" width="2" height="2" fill="currentColor" />
            <rect x="7" y="7" width="2" height="2" fill="currentColor" />
            <rect x="7" y="1" width="2" height="2" fill="currentColor" />
            <rect x="5" y="3" width="2" height="2" fill="currentColor" />
            <rect x="3" y="5" width="2" height="2" fill="currentColor" />
            <rect x="1" y="7" width="2" height="2" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  )
}
