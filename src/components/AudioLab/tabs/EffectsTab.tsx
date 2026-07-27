import { useCallback, useEffect, useState } from 'react'
import { dspEngine } from '../../../dsp/DspEngine'
import { useT } from '../../../i18n/useT'
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

const EFFECT_ICONS: Record<string, string> = {
  preamp: '📡',
  'equalizer-10band': '📊',
  'bass-boost': '🔊',
  'treble-boost': '🔊',
  balance: '⚖️',
  'stereo-width': '↔️',
  'master-volume': '🔈',
}

function categoryLabel(t: (key: string) => string, cat: string): string {
  const known: Record<string, string> = {
    filter: 'audioLab.category.filter',
    dynamic: 'audioLab.category.dynamic',
    spatial: 'audioLab.category.spatial',
    time: 'audioLab.category.time',
    modulation: 'audioLab.category.modulation',
    utility: 'audioLab.category.utility',
    distortion: 'audioLab.category.distortion',
    pitch: 'audioLab.category.pitch',
  }
  const key = known[cat]
  return key ? t(key) : cat
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
  const { t } = useT()
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
        <span className="audio-lab__effects-title">{t('audioLab.effects.title')}</span>
      </div>

      {effects.length === 0 && (
        <div className="audio-lab__effects-empty">
          {t('audioLab.effects.empty')}
        </div>
      )}

      <div className="audio-lab__effects-list">
        {effects.map((effect, idx) => {
          const icon = EFFECT_ICONS[effect.id] ?? '🔘'
          const descKey = t(`audioLab.effect.${effect.id}.desc`)
          const desc = descKey !== `audioLab.effect.${effect.id}.desc` ? descKey : undefined
          const nameKey = t(`audioLab.effect.${effect.id}.name`)
          const effectName = nameKey !== `audioLab.effect.${effect.id}.name` ? nameKey : effect.name
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
                  title={desc}
                >
                  {icon}
                </span>
                <span className="audio-lab__effect-index">{idx + 1}</span>
                <span className="audio-lab__effect-category">
                  {categoryLabel(t, effect.category)}
                </span>
                <span className="audio-lab__effect-name" title={desc}>
                  {effectName}
                </span>
                {effect.edited && (
                  <span
                    className="audio-lab__effect-edited-badge"
                    title={t('audioLab.effects.edited.title')}
                  >
                    {t('audioLab.effects.edited')}
                  </span>
                )}
                <div className="audio-lab__effect-controls">
                  <label className="audio-lab__toggle" title={t('audioLab.effects.toggle.enable')}>
                    <input
                      type="checkbox"
                      checked={effect.enabled}
                      onChange={() => toggleEnabled(effect.id)}
                      className="audio-lab__toggle-input"
                    />
                    <span className="audio-lab__toggle-label">
                      {effect.enabled ? t('audioLab.effects.on') : t('audioLab.effects.off')}
                    </span>
                  </label>
                  {effect.enabled && (
                    <label className="audio-lab__toggle audio-lab__toggle--secondary" title={t('audioLab.effects.toggle.bypass')}>
                      <input
                        type="checkbox"
                        checked={effect.bypassed}
                        onChange={() => toggleBypassed(effect.id)}
                        className="audio-lab__toggle-input"
                      />
                      <span className="audio-lab__toggle-label">
                        {effect.bypassed ? t('audioLab.effects.bypass') : t('audioLab.effects.active')}
                      </span>
                    </label>
                  )}
                  {effect.params.length > 0 && (
                    <button
                      className="pixel-button audio-lab__effect-expand"
                      onClick={() => toggleExpanded(effect.id)}
                      title={effect.expanded ? t('audioLab.effects.collapse') : t('audioLab.effects.expand')}
                    >
                      {effect.expanded ? '▲' : '▼'}
                    </button>
                  )}
                  <button
                    className="pixel-button audio-lab__effect-reset"
                    onClick={() => resetEffect(effect.id)}
                    title={t('audioLab.effects.reset')}
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
