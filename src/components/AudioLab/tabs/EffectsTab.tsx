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
}

/**
 * Effects Tab — shows all available effects with enable/disable,
 * bypass, and expandable parameter controls.
 */
export function EffectsTab() {
  const [effects, setEffects] = useState<EffectState[]>([])

  // Load effects from the real DSP engine (single source of truth).
  useEffect(() => {
    const states: EffectState[] = []
    for (const effect of dspEngine.effects) {
      states.push({
        id: effect.id,
        name: effect.name,
        category: effect.category,
        enabled: effect.enabled,
        bypassed: effect.bypassed,
        params: effect.getParameters(),
        expanded: false,
      })
    }
    setEffects(states)
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
      // Refresh parameters.
      setEffects((prev) =>
        prev.map((e) =>
          e.id === effectId ? { ...e, params: effect.getParameters() } : e,
        ),
      )
    },
    [],
  )

  const resetEffect = useCallback((effectId: string) => {
    const effect = dspEngine.effects.find((e) => e.id === effectId)
    if (!effect) return
    effect.reset()
    setEffects((prev) =>
      prev.map((e) =>
        e.id === effectId ? { ...e, params: effect.getParameters() } : e,
      ),
    )
  }, [])

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

  return (
    <div className="audio-lab__effects">
      <div className="audio-lab__effects-header">
        <span className="audio-lab__effects-title">Effect Chain</span>
      </div>

      {effects.length === 0 && (
        <div className="audio-lab__effects-empty">
          No effects in the chain. Add effects from the menu above.
        </div>
      )}

      <div className="audio-lab__effects-list">
        {effects.map((effect, idx) => (
          <div
            key={effect.id}
            className={`audio-lab__effect-module ${
              !effect.enabled ? 'audio-lab__effect-module--disabled' : ''
            } ${effect.bypassed ? 'audio-lab__effect-module--bypassed' : ''}`}
          >
            <div className="audio-lab__effect-header">
              <span className="audio-lab__effect-index">
                {idx + 1}
              </span>
              <span className="audio-lab__effect-category">
                {categoryLabels[effect.category] ?? effect.category}
              </span>
              <span className="audio-lab__effect-name">{effect.name}</span>
              <div className="audio-lab__effect-controls">
                <label className="audio-lab__toggle">
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
                  <label className="audio-lab__toggle audio-lab__toggle--secondary">
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
                  >
                    {effect.expanded ? '▲' : '▼'}
                  </button>
                )}
                <button
                  className="pixel-button audio-lab__effect-reset"
                  onClick={() => resetEffect(effect.id)}
                  title="Reset effect to defaults"
                >
                  ↺
                </button>
              </div>
            </div>

            {/* Expandable parameter controls */}
            {effect.expanded && (
              <div className="audio-lab__effect-params">
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
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
