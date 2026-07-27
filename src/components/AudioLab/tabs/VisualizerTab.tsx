import { useEffect, useState } from 'react'
import { dspEngine } from '../../../dsp/DspEngine'
import type { AnalyzerData, VisualizerMode } from '../../../dsp/types'
import { SpectrumVisualizer } from '../visualizers/SpectrumVisualizer'
import { WaveformVisualizer } from '../visualizers/WaveformVisualizer'
import { CircularSpectrumVisualizer } from '../visualizers/CircularSpectrumVisualizer'

/**
 * Visualizer Tab — shows real-time audio analysis visualizations.
 */
export function VisualizerTab() {
  const [mode, setMode] = useState<VisualizerMode>('spectrum')
  const [analyserSource, setAnalyserSource] = useState<'post-fx' | 'pre-fx'>('post-fx')
  const [data, setData] = useState<AnalyzerData | null>(null)
  // Subscribe to analyzer data.
  useEffect(() => {
    const unsubscribe = dspEngine.analyzerService.subscribe((d) => {
      setData(d)
    })
    return unsubscribe
  }, [])

  const handleModeChange = (newMode: VisualizerMode) => {
    setMode(newMode)
  }

  const handleSourceChange = () => {
    const newSource = analyserSource === 'post-fx' ? 'pre-fx' : 'post-fx'
    setAnalyserSource(newSource)
    dspEngine.setAnalyserSource(newSource)
  }

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
                  ? 'SPECTRUM'
                  : m === 'waveform'
                    ? 'WAVEFORM'
                    : 'CIRCULAR'}
              </button>
            ),
          )}
        </div>

        <label className="audio-lab__toggle">
          <input
            type="checkbox"
            checked={analyserSource === 'pre-fx'}
            onChange={handleSourceChange}
            className="audio-lab__toggle-input"
          />
          <span className="audio-lab__toggle-label">
            {analyserSource === 'post-fx' ? 'POST-FX' : 'PRE-FX'}
          </span>
        </label>
      </div>

      {/* Visualizer display */}
      <div className="audio-lab__visualizer-display">
        {mode === 'spectrum' && <SpectrumVisualizer data={data} />}
        {mode === 'waveform' && <WaveformVisualizer data={data} />}
        {mode === 'circular-spectrum' && <CircularSpectrumVisualizer data={data} />}

        {/* Peak meter with hold/decay + clip indicator */}
        <div className="audio-lab__visualizer-peak-meter">
          <div className="audio-lab__visualizer-peak-label">
            Peak
            {data?.clipped && (
              <span className="audio-lab__visualizer-clip-badge" title="Signal approaching 0 dBFS">CLIP</span>
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
            {/* Raw frame peak marker */}
            {data && (
              <div
                className="audio-lab__visualizer-raw-peak-marker"
                style={{ left: `${Math.min(100, data.rawPeak * 100)}%` }}
                title={`Raw: ${(data.rawPeak * 100).toFixed(0)}%`}
              />
            )}
          </div>
          <span className="audio-lab__visualizer-peak-value">
            {(data?.peak ?? 0) > 0.01
              ? `${(20 * Math.log10(data!.peak)).toFixed(1)} dBFS`
              : '-∞ dBFS'}
          </span>
        </div>

        <div className="audio-lab__visualizer-rms-meter">
          <div className="audio-lab__visualizer-peak-label">RMS</div>
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
      </div>
    </div>
  )
}
