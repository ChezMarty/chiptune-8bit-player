import { useCallback, useEffect, useRef, useState } from 'react'
import { dspEngine } from '../../dsp/DspEngine'
import { EqTab } from './tabs/EqTab'
import { EffectsTab } from './tabs/EffectsTab'
import { PresetsTab } from './tabs/PresetsTab'
import { VisualizerTab } from './tabs/VisualizerTab'

type AudioLabTab = 'eq' | 'effects' | 'presets' | 'visualizer'

interface Props {
  open: boolean
  onClose: () => void
  /** The last opened tab, for persistence. */
  lastTab?: AudioLabTab
  onTabChange?: (tab: AudioLabTab) => void
}

const TAB_LABELS: Record<AudioLabTab, string> = {
  eq: 'EQ',
  effects: 'Effects',
  presets: 'Presets',
  visualizer: 'Visualizer',
}

/**
 * AudioLabPanel — the slide-up DSP workspace panel.
 *
 * Contains four tabs:
 *   - EQ: 10-band graphic equalizer
 *   - Effects: enable/disable/bypass individual effects
 *   - Presets: browse, apply, save, import, export presets
 *   - Visualizer: real-time audio visualization
 */
export function AudioLabPanel({ open, onClose, lastTab, onTabChange }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const activeTab: AudioLabTab = lastTab ?? 'eq'
  /** Incremented when a preset is applied — children use this to refresh. */
  const [refreshKey, setRefreshKey] = useState(0)

  // Close on Escape key.
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Resume the AudioContext when the panel opens (user gesture).
  useEffect(() => {
    if (open && dspEngine.audioCtx.state === 'suspended') {
      dspEngine.audioCtx.resume().catch(() => {})
    }
  }, [open])

  const handleTabClick = useCallback(
    (tab: AudioLabTab) => {
      onTabChange?.(tab)
    },
    [onTabChange],
  )

  const handlePresetApplied = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  return (
    <>
      {/* Overlay backdrop */}
      {open && (
        <div
          className="audio-lab__backdrop"
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99,
            animation: 'fadeIn 0.2s ease-out',
          }}
        />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        className={`audio-lab__panel ${open ? 'audio-lab__panel--open' : ''}`}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          background: 'var(--bg-panel, #1A1A2E)',
          borderTop: '4px solid var(--accent, #E52521)',
          maxHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header bar */}
        <div
          className="audio-lab__header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            borderBottom: '2px solid var(--border, #2A2A4A)',
            flexShrink: 0,
          }}
        >
          <span
            className="audio-lab__title"
            style={{
              fontFamily: 'var(--font-pixel, monospace)',
              fontSize: '14px',
              color: 'var(--accent-secondary, #4EE2EC)',
            }}
          >
            ≡ AUDIO LAB
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Master volume quick control */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
              }}
            >
              <span style={{ fontFamily: 'var(--font-pixel, monospace)' }}>
                VOL
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                defaultValue={dspEngine.masterVolume}
                onChange={(e) =>
                  dspEngine.setMasterVolume(Number(e.target.value))
                }
                style={{ width: '80px' }}
                className="audio-lab__master-volume-slider"
              />
            </div>
            <button
              className="pixel-button"
              onClick={onClose}
              aria-label="Close Audio Lab"
              title="Close (Esc)"
              style={{ fontFamily: 'var(--font-pixel, monospace)', fontSize: '12px' }}
            >
              ✕ CLOSE
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="audio-lab__tabs"
          style={{
            display: 'flex',
            borderBottom: '2px solid var(--border, #2A2A4A)',
            flexShrink: 0,
          }}
        >
          {(Object.keys(TAB_LABELS) as AudioLabTab[]).map((tab) => (
            <button
              key={tab}
              className={`audio-lab__tab ${activeTab === tab ? 'is-active' : ''}`}
              onClick={() => handleTabClick(tab)}
              style={{
                padding: '8px 20px',
                fontFamily: 'var(--font-pixel, monospace)',
                fontSize: '12px',
                background:
                  activeTab === tab
                    ? 'var(--bg-panel-light, #252544)'
                    : 'transparent',
                color:
                  activeTab === tab
                    ? 'var(--accent, #E52521)'
                    : 'var(--text-secondary, #8B8FA4)',
                borderBottom:
                  activeTab === tab
                    ? '2px solid var(--accent, #E52521)'
                    : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div
          className="audio-lab__content"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 16px',
          }}
        >
          {activeTab === 'eq' && <EqTab refreshKey={refreshKey} />}
          {activeTab === 'effects' && <EffectsTab refreshKey={refreshKey} />}
          {activeTab === 'presets' && (
            <PresetsTab onPresetApplied={handlePresetApplied} />
          )}
          {activeTab === 'visualizer' && <VisualizerTab />}
        </div>
      </div>
    </>
  )
}
