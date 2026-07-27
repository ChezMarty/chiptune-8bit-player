import { useCallback, useEffect, useState } from 'react'
import { dspEngine } from '../../../dsp/DspEngine'
import { useT } from '../../../i18n/useT'
import type { AnalyzerData, VisualizerMode } from '../../../dsp/types'
import { SpectrumVisualizer } from '../visualizers/SpectrumVisualizer'
import { WaveformVisualizer } from '../visualizers/WaveformVisualizer'
import { CircularSpectrumVisualizer } from '../visualizers/CircularSpectrumVisualizer'
import {
  loadVisualizerSettings,
  saveVisualizerSettings,
  DEFAULT_VISUALIZER_SETTINGS,
} from '../../../lib/visualizerSettings'
import type { VisualizerSettings } from '../../../lib/visualizerSettings'

/**
 * Visualizer Tab — shows real-time audio analysis visualizations
 * with a collapsible settings panel.
 */
/** Slider control for the settings panel. */
function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (v: number) => void
}) {
  return (
    <div className="audio-lab__slider-row">
      <span className="audio-lab__slider-label">{label}</span>
      <input
        type="range"
        className="audio-lab__param-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="audio-lab__slider-value">
        {value}{unit ?? ''}
      </span>
    </div>
  )
}

/** Toggle control for the settings panel. */
function ToggleRow({
  label,
  checked,
  onChange,
  onLabel,
  offLabel,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  onLabel: string
  offLabel: string
}) {
  return (
    <label className="audio-lab__toggle audio-lab__slider-row">
      <span className="audio-lab__slider-label">{label}</span>
      <input
        type="checkbox"
        className="audio-lab__toggle-input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="audio-lab__toggle-label">{checked ? onLabel : offLabel}</span>
    </label>
  )
}

/** Visualizer color theme options. */
const VISUALIZER_THEMES = [
  { value: 'accent', label: 'Default (Red/Cyan)' },
  { value: '#E52521', label: 'Classic Red' },
  { value: '#4EE2EC', label: 'Cyan' },
  { value: '#58D68D', label: 'Green' },
  { value: '#F1B94C', label: 'Amber' },
  { value: '#A78BFA', label: 'Purple' },
  { value: '#F472B6', label: 'Pink' },
  { value: '#60A5FA', label: 'Blue' },
] as const

export function VisualizerTab() {
  const { t } = useT()
  const [mode, setMode] = useState<VisualizerMode>('spectrum')
  const [analyserSource, setAnalyserSource] = useState<'post-fx' | 'pre-fx'>('post-fx')
  const [data, setData] = useState<AnalyzerData | null>(null)
  const [settings, setSettings] = useState<VisualizerSettings>(() => loadVisualizerSettings())
  const [showSettings, setShowSettings] = useState(false)

  // Subscribe to analyzer data.
  useEffect(() => {
    const unsubscribe = dspEngine.analyzerService.subscribe((d) => {
      setData(d)
    })
    return unsubscribe
  }, [])

  // ── Apply AnalyzerService settings on change ───────────────
  useEffect(() => {
    const svc = dspEngine.analyzerService
    svc.fftSize = settings.fftSize
    svc.smoothingTimeConstant = 1 - settings.spectrumSmoothing * 0.5 // map 0..1 → 1..0.5
    svc.peakHoldMs = settings.peakHoldMs
    svc.peakDecayDbPerSec = settings.peakDecayDbPerSec
    svc.rmsSmoothing = settings.rmsSmoothing
  }, [
    settings.fftSize,
    settings.spectrumSmoothing,
    settings.peakHoldMs,
    settings.peakDecayDbPerSec,
    settings.rmsSmoothing,
  ])

  // Persist on every change.
  useEffect(() => {
    saveVisualizerSettings(settings)
  }, [settings])

  const handleModeChange = useCallback((newMode: VisualizerMode) => {
    setMode(newMode)
  }, [])

  const handleSourceChange = useCallback(() => {
    setAnalyserSource((prev) => {
      const next = prev === 'post-fx' ? 'pre-fx' : 'post-fx'
      dspEngine.setAnalyserSource(next)
      return next
    })
  }, [])

  const updateSetting = useCallback(
    <K extends keyof VisualizerSettings>(key: K, value: VisualizerSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  return (
    <div className="audio-lab__visualizer">
      {/* Controls */}
      <div className="audio-lab__visualizer-controls">
        <div className="audio-lab__visualizer-modes">
          {(['spectrum', 'waveform', 'circular-spectrum'] as VisualizerMode[]).map(
            (m) => (
              <button
                key={m}
                className={`pixel-button audio-lab__visualizer-mode-btn ${
                  mode === m ? 'is-active' : ''
                }`}
                onClick={() => handleModeChange(m)}
              >
                {m === 'spectrum'
                  ? t('audioLab.visualizer.spectrum')
                  : m === 'waveform'
                    ? t('audioLab.visualizer.waveform')
                    : t('audioLab.visualizer.circular')}
              </button>
            ),
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            className="pixel-button audio-lab__visualizer-settings-btn"
            onClick={() => setShowSettings((s) => !s)}
            title={showSettings ? t('audioLab.visualizer.settingsBtnHide') : t('audioLab.visualizer.settingsBtn')}
            style={{
              background: showSettings ? 'var(--accent-secondary, #4EE2EC)' : undefined,
              color: showSettings ? 'var(--text-inverse, #0D0D1A)' : undefined,
            }}
          >
            ⚙
          </button>
          <label className="audio-lab__toggle">
            <input
              type="checkbox"
              checked={analyserSource === 'pre-fx'}
              onChange={handleSourceChange}
              className="audio-lab__toggle-input"
            />
            <span className="audio-lab__toggle-label">
              {analyserSource === 'post-fx' ? t('audioLab.visualizer.postFx') : t('audioLab.visualizer.preFx')}
            </span>
          </label>
        </div>
      </div>

      {/* Visualizer display */}
      <div className="audio-lab__visualizer-display">
        {mode === 'spectrum' && (
          <SpectrumVisualizer
            data={data}
            barCount={settings.barCount}
            color={settings.colorTheme !== 'theme' ? settings.colorTheme : undefined}
            smoothing={settings.spectrumSmoothing}
            sensitivity={settings.spectrumSensitivity}
          />
        )}
        {mode === 'waveform' && (
          <WaveformVisualizer
            data={data}
            color={settings.colorTheme !== 'theme' ? settings.colorTheme : undefined}
            smoothing={settings.waveformSmoothing}
            sensitivity={settings.waveformSensitivity}
          />
        )}
        {mode === 'circular-spectrum' && (
          <CircularSpectrumVisualizer
            data={data}
            barCount={Math.min(settings.barCount, 64)}
            color={settings.colorTheme !== 'theme' ? settings.colorTheme : undefined}
            smoothing={settings.circularSmoothing}
            sensitivity={settings.circularSensitivity}
          />
        )}

        {/* Peak meter */}
        {settings.showPeakMeter && (
          <div className="audio-lab__visualizer-peak-meter">
            <div className="audio-lab__visualizer-peak-label">
              {t('audioLab.visualizer.peak')}
              {settings.showClipIndicator && data?.clipped && (
                <span className="audio-lab__visualizer-clip-badge" title={t('audioLab.visualizer.clip.title')}>{t('audioLab.visualizer.clip')}</span>
              )}
            </div>
            <div className="audio-lab__visualizer-peak-bar">
              <div
                className="audio-lab__visualizer-peak-fill"
                style={{
                  width: `${Math.min(100, (data?.peak ?? 0) * 100)}%`,
                  background:
                    data?.clipped
                      ? 'var(--accent-negative, #E52521)'
                      : (data?.peak ?? 0) > 0.9
                        ? 'var(--accent-negative, #E52521)'
                        : 'var(--accent-positive, #58D68D)',
                }}
              />
              {data && (
                <div
                  className="audio-lab__visualizer-raw-peak-marker"
                  style={{ left: `${Math.min(100, data.rawPeak * 100)}%` }}
                  title={t('audioLab.visualizer.rawPeak', { pct: (data.rawPeak * 100).toFixed(0) })}
                />
              )}
            </div>
            <span className="audio-lab__visualizer-peak-value">
              {(data?.peak ?? 0) > 0.01
                ? `${(20 * Math.log10(data!.peak)).toFixed(1)} dBFS`
                : '-∞ dBFS'}
            </span>
          </div>
        )}

        {/* RMS meter */}
        {settings.showRmsMeter && (
          <div className="audio-lab__visualizer-rms-meter">
            <div className="audio-lab__visualizer-peak-label">{t('audioLab.visualizer.rms')}</div>
            <div className="audio-lab__visualizer-peak-bar">
              <div
                className="audio-lab__visualizer-peak-fill"
                style={{
                  width: `${Math.min(100, (data?.rms ?? 0) * 100)}%`,
                  background: 'var(--accent-secondary, #4EE2EC)',
                }}
              />
            </div>
            <span className="audio-lab__visualizer-peak-value">
              {(data?.rms ?? 0) > 0.01
                ? `${(20 * Math.log10(data!.rms)).toFixed(1)} dBFS`
                : '-∞ dBFS'}
            </span>
          </div>
        )}
      </div>

      {/* ── Settings panel ───────────────────────────────── */}
      {showSettings && (
        <div className="audio-lab__visualizer-settings">
          <div className="audio-lab__visualizer-settings-title">{t('audioLab.visualizer.settings')}</div>

          <div className="audio-lab__visualizer-settings-section">
            <div className="audio-lab__visualizer-settings-section-title">{t('audioLab.visualizer.section.general')}</div>
            <SliderRow
              label={t('audioLab.visualizer.fftSize')}
              value={settings.fftSize}
              min={256}
              max={4096}
              step={256}
              onChange={(v) => {
                // Round to power of 2.
                const sizes = [256, 512, 1024, 2048, 4096]
                const nearest = sizes.reduce((a, b) =>
                  Math.abs(b - v) < Math.abs(a - v) ? b : a,
                )
                updateSetting('fftSize', nearest)
              }}
            />
            <SliderRow
              label={t('audioLab.visualizer.bars')}
              value={settings.barCount}
              min={8}
              max={128}
              step={4}
              onChange={(v) => updateSetting('barCount', v)}
            />
            <div className="audio-lab__slider-row">
              <span className="audio-lab__slider-label">{t('audioLab.visualizer.color')}</span>
              <select
                className="audio-lab__param-select"
                value={settings.colorTheme}
                onChange={(e) => updateSetting('colorTheme', e.target.value)}
                style={{ flex: 1 }}
              >
                {VISUALIZER_THEMES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="audio-lab__visualizer-settings-section">
            <div className="audio-lab__visualizer-settings-section-title">{t('audioLab.visualizer.section.smoothing')}</div>
            <SliderRow
              label={t('audioLab.visualizer.spectrumLabel')}
              value={settings.spectrumSmoothing}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => updateSetting('spectrumSmoothing', v)}
            />
            <SliderRow
              label={t('audioLab.visualizer.waveformLabel')}
              value={settings.waveformSmoothing}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => updateSetting('waveformSmoothing', v)}
            />
            <SliderRow
              label={t('audioLab.visualizer.circularLabel')}
              value={settings.circularSmoothing}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => updateSetting('circularSmoothing', v)}
            />
          </div>

          <div className="audio-lab__visualizer-settings-section">
            <div className="audio-lab__visualizer-settings-section-title">{t('audioLab.visualizer.section.sensitivity')}</div>
            <SliderRow
              label={t('audioLab.visualizer.spectrumLabel')}
              value={settings.spectrumSensitivity}
              min={0.1}
              max={5}
              step={0.1}
              onChange={(v) => updateSetting('spectrumSensitivity', v)}
            />
            <SliderRow
              label={t('audioLab.visualizer.waveformLabel')}
              value={settings.waveformSensitivity}
              min={0.1}
              max={5}
              step={0.1}
              onChange={(v) => updateSetting('waveformSensitivity', v)}
            />
            <SliderRow
              label={t('audioLab.visualizer.circularLabel')}
              value={settings.circularSensitivity}
              min={0.1}
              max={5}
              step={0.1}
              onChange={(v) => updateSetting('circularSensitivity', v)}
            />
          </div>

          <div className="audio-lab__visualizer-settings-section">
            <div className="audio-lab__visualizer-settings-section-title">{t('audioLab.visualizer.section.metering')}</div>
            <SliderRow
              label={t('audioLab.visualizer.peakHold')}
              value={settings.peakHoldMs}
              min={0}
              max={5000}
              step={100}
              unit="ms"
              onChange={(v) => updateSetting('peakHoldMs', v)}
            />
            <SliderRow
              label={t('audioLab.visualizer.peakDecay')}
              value={settings.peakDecayDbPerSec}
              min={0}
              max={60}
              step={1}
              unit=" dB/s"
              onChange={(v) => updateSetting('peakDecayDbPerSec', v)}
            />
            <SliderRow
              label={t('audioLab.visualizer.rmsSmooth')}
              value={settings.rmsSmoothing}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => updateSetting('rmsSmoothing', v)}
            />
          </div>

          <div className="audio-lab__visualizer-settings-section">
            <div className="audio-lab__visualizer-settings-section-title">{t('audioLab.visualizer.section.display')}</div>
            <ToggleRow
              label={t('audioLab.visualizer.peakMeter')}
              checked={settings.showPeakMeter}
              onChange={(v) => updateSetting('showPeakMeter', v)}
              onLabel={t('audioLab.visualizer.peakOn')}
              offLabel={t('audioLab.visualizer.peakOff')}
            />
            <ToggleRow
              label={t('audioLab.visualizer.rmsMeter')}
              checked={settings.showRmsMeter}
              onChange={(v) => updateSetting('showRmsMeter', v)}
              onLabel={t('audioLab.visualizer.peakOn')}
              offLabel={t('audioLab.visualizer.peakOff')}
            />
            <ToggleRow
              label={t('audioLab.visualizer.clipIndicator')}
              checked={settings.showClipIndicator}
              onChange={(v) => updateSetting('showClipIndicator', v)}
              onLabel={t('audioLab.visualizer.peakOn')}
              offLabel={t('audioLab.visualizer.peakOff')}
            />
          </div>

          <div className="audio-lab__visualizer-settings-reset">
            <button
              className="pixel-button"
              onClick={() => {
                setSettings({ ...DEFAULT_VISUALIZER_SETTINGS })
              }}
              title={t('audioLab.visualizer.resetSettings')}
            >
              {t('audioLab.visualizer.resetSettings')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
