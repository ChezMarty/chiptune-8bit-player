import { useCallback, useEffect, useState } from 'react'
import { dspEngine } from '../../../dsp/DspEngine'
import type { EffectParameter } from '../../../dsp/types'

interface EffectState {
  id: string
  name: string
  category: string
  enabled: boolean
  bypassed: boolean
  params: EffectParameter[]
  expanded: boolean
  edited: boolean
}

interface EffectsTabProps {
  /** Incremented when a preset is applied — triggers a full re-read. */
  refreshKey?: number
}

const EFFECT_INFO: Record<string, { icon: string; description: string }> = {
  'preamp': {
    icon: '📡',
    description: 'Input gain stage. Boosts or cuts the signal level before any other processing.',
  },
  'equalizer-10band': {
    icon: '📊',
    description: '10-band graphic equalizer. Adjust frequency balance from 31 Hz (bass) to 16 kHz (treble).',
  },
  'bass-boost': {
    icon: '🔊',
    description: 'Low-frequency enhancer. Boosts bass using a lowshelf filter with adjustable cutoff.',
  },
  'treble-boost': {
    icon: '🔊',
    description: 'High-frequency enhancer. Boosts treble using a highshelf filter with adjustable cutoff.',
  },
  'balance': {
    icon: '⚖️',
    description: 'Stereo balance control. Shifts the audio signal between the left and right channels.',
  },
  'stereo-width': {
    icon: '↔️',
    description: 'Stereo field processor. Widens or narrows the stereo image using mid/side processing.',
  },
  'master-volume': {
    icon: '🔈',
    description: 'Final output volume. Controls the overall listening level sent to your speakers.',
  },
}

const categoryLabels: Record<string, string> = {
  filter: 'Filters',
  dynamic: 'Dynamics',
  spatial: 'Spatial',
  time: 'Time-Based',
  modulation: 'Modulation',
  utility: 'Utility',
  distortion: 'Distortion',
  pitch: 'Pitch',
}

/** Check if any of an effect's parameters differ from their defaults. */
function hasEditedParams(params: EffectParameter[]): boolean {
  return params.some((p) => {
    const def = p.defaultValue
    const val = p.value
    if (typeof def === 'number' && typeof val === 'number') {
      return Math.abs(def - val) > 0.001
    }
    return def !== val
  })
}

/**
 * Effects Tab — shows all available effects with enable/disable,
 * bypass, and expandable parameter controls.
 */
export function EffectsTab({ refreshKey = 0 }: EffectsTabProps) {
  const [effects, setEffects] = useState<EffectState[]>([])

  // Load effects from the real DSP engine (single source of truth).
  useEffect(() => {
    const states: EffectState[] = []
    for (const effect of dspEngine.effects) {
      const params = effect.getParameters()
      states.push({
        id: effect.id,
        name: effect.name,
        category: effect.category,
        enabled: effect.enabled,
        bypassed: effect.bypassed,
        params,
        expanded: false,
        edited: hasEditedParams(params),
      })
    }
    setEffects(states)
  }, [refreshKey])

  const refreshParamsFor = useCallback((effectId: string) => {
    const effect = dspEngine.effects.find((e) => e.id === effectId)
    if (!effect) return
    const params = effect.getParameters()
    setEffects((prev) =>
      prev.map((e) =>
        e.id === effectId
          ? { ...e, params, edited: hasEditedParams(params) }
          : e,
      ),
    )
  }, [])

  const toggleEnabled = useCallback((effectId: string) => {
    const effect = dspEngine.effects.find((e) => e.id === effectId)
    if (!effect) return
    effect.enabled = !effect.enabled
    effect.bypassed = !effect.enabled
    setEffects((prev) =>
      prev.map((e) =>
        e.id === effectId ? { ...e, enabled: effect.enabled, bypassed: effect.bypassed } : e,
      ),
    )
  }, [])

  const toggleBypassed = useCallback((effectId: string) => {
    const effect = dspEngine.effects.find((e) => e.id === effectId)
    if (!effect) return
    effect.bypassed = !effect.bypassed
    setEffects((prev) =>
      prev.map((e) =>
        e.id === effectId ? { ...e, bypassed: effect.bypassed } : e,
      ),
    )
  }, [])

  const toggleExpanded = useCallback((effectId: string) => {
    setEffects((prev) =>
      prev.map((e) =>
        e.id === effectId ? { ...e, expanded: !e.expanded } : e,
      ),
    )
  }, [])

  const handleParamChange = useCallback(
    (effectId: string, paramId: string, value: number | boolean | string) => {
      const effect = dspEngine.effects.find((e) => e.id === effectId)
      if (!effect) return
      effect.setParameter(paramId, value)
      refreshParamsFor(effectId)
    },
    [refreshParamsFor],
  )

  const resetEffect = useCallback((effectId: string) => {
    const effect = dspEngine.effects.find((e) => e.id === effectId)
    if (!effect) return
    effect.reset()
    refreshParamsFor(effectId)
  }, [refreshParamsFor])

  return (
    <div className="audio-lab__effects">
      <div className="audio-lab__effects-header">
        <span className="audio-lab__effects-title">Effect Chain</span>
      </div>

      {effects.length === 0 && (
        <div className="audio-lab__effects-empty">
          No effects in the chain.
        </div>
      )}

      <div className="audio-lab__effects-list">
        {effects.map((effect, idx) => {
          const info = EFFECT_INFO[effect.id]
          return (
            <div
              key={effect.id}
              className={`audio-lab__effect-module ${
                !effect.enabled ? 'audio-lab__effect-module--disabled' : ''
              } ${effect.bypassed ? 'audio-lab__effect-module--bypassed' : ''} ${
                effect.edited ? 'audio-lab__effect-module--edited' : ''
              }`}
            >
              <div className="audio-lab__effect-header">
                <span
                  className="audio-lab__effect-icon"
                  title={info?.description}
                >
                  {info?.icon ?? '🔘'}
                </span>
                <span className="audio-lab__effect-index">{idx + 1}</span>
                <span className="audio-lab__effect-category">
                  {categoryLabels[effect.category] ?? effect.category}
                </span>
                <span className="audio-lab__effect-name" title={info?.description}>
                  {effect.name}
                </span>
                {effect.edited && (
                  <span
                    className="audio-lab__effect-edited-badge"
                    title="This effect has been modified from its default values"
                  >
                    EDITED
                  </span>
                )}
                <div className="audio-lab__effect-controls">
                  <label className="audio-lab__toggle" title="Enable or disable this effect">
                    <input
                      type="checkbox"
                      checked={effect.enabled}
                      onChange={() => toggleEnabled(effect.id)}
                      className="audio-lab__toggle-input"
                    />
                    <span className="audio-lab__toggle-label">
                      {effect.enabled ? 'ON' : 'OFF'}
                    </span>
                  </label>
                  {effect.enabled && (
                    <label className="audio-lab__toggle audio-lab__toggle--secondary" title="Bypass the effect (signal passes through unchanged)">
                      <input
                        type="checkbox"
                        checked={effect.bypassed}
                        onChange={() => toggleBypassed(effect.id)}
                        className="audio-lab__toggle-input"
                      />
                      <span className="audio-lab__toggle-label">
                        {effect.bypassed ? 'BYP' : 'ACT'}
                      </span>
                    </label>
                  )}
                  {effect.params.length > 0 && (
                    <button
                      className="pixel-button audio-lab__effect-expand"
                      onClick={() => toggleExpanded(effect.id)}
                      title={effect.expanded ? 'Collapse parameters' : 'Expand parameters'}
                    >
                      {effect.expanded ? '▲' : '▼'}
                    </button>
                  )}
                  <button
                    className="pixel-button audio-lab__effect-reset"
                    onClick={() => resetEffect(effect.id)}
                    title="Reset this effect to its default values"
                  >
                    ↺
                  </button>
                </div>
              </div>

              {/* Expandable parameter controls with animation */}
              <div
                className={`audio-lab__effect-params ${
                  effect.expanded ? 'audio-lab__effect-params--open' : ''
                }`}
              >
                <div className="audio-lab__effect-params-inner">
                  {effect.params.map((param) => (
                    <div key={param.id} className="audio-lab__param-row">
                      <label className="audio-lab__param-label">
                        {param.name}
                        {param.unit ? ` (${param.unit})` : ''}
                      </label>

                      {param.type === 'boolean' && (
                        <label className="audio-lab__toggle">
                          <input
                            type="checkbox"
                            checked={param.value as boolean}
                            onChange={(e) =>
                              handleParamChange(effect.id, param.id, e.target.checked)
                            }
                            className="audio-lab__toggle-input"
                          />
                          <span className="audio-lab__toggle-label">
                            {param.value ? 'ON' : 'OFF'}
                          </span>
                        </label>
                      )}

                      {param.type === 'select' && param.options && (
                        <select
                          className="audio-lab__param-select"
                          value={String(param.value)}
                          onChange={(e) =>
                            handleParamChange(effect.id, param.id, e.target.value)
                          }
                        >
                          {param.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )}

                      {(param.type === 'float' || param.type === 'int') && (
                        <div className="audio-lab__param-slider-row">
                          <input
                            type="range"
                            min={param.min ?? 0}
                            max={param.max ?? 1}
                            step={param.step ?? 0.1}
                            value={Number(param.value)}
                            onChange={(e) =>
                              handleParamChange(
                                effect.id,
                                param.id,
                                param.type === 'int'
                                  ? parseInt(e.target.value, 10)
                                  : parseFloat(e.target.value),
                              )
                            }
                            className="audio-lab__param-slider"
                          />
                          <span className="audio-lab__param-value">
                            {param.type === 'int'
                              ? Math.round(Number(param.value))
                              : Number(param.value).toFixed(
                                  (param.step ?? 0.1) < 0.01 ? 2 : 1,
                                )}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
