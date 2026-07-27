import { useCallback, useEffect, useRef, useState } from 'react'
import { dspEngine } from '../../../dsp/DspEngine'
import type { EffectParameter } from '../../../dsp/types'

const BAND_LABELS = ['31', '62', '125', '250', '500', '1k', '2k', '4k', '8k', '16k']
const BAND_COLORS = [
  '#E52521', '#E53B21', '#E55221', '#E56921',
  '#E58021', '#E59621', '#E5AD21', '#E5C321',
  '#E5DA21', '#E5E521',
]

/**
 * Equalizer Tab — 10-band graphic EQ with sliders.
 * Shows real-time frequency response curve when dragging.
 */
export function EqTab() {
  const [params, setParams] = useState<EffectParameter[]>([])
  const [responseCurve, setResponseCurve] = useState<number[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Load EQ parameters from the engine.
  useEffect(() => {
    const chain = dspEngine.chain
    // Find the equalizer effect.
    for (const effect of chain.effects) {
      if (effect.id === 'equalizer-10band') {
        const p = effect.getParameters()
        setParams(p)
        break
      }
    }
  }, [])

  // Draw the frequency response curve.
  const drawCurve = useCallback((gains: number[]) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    // Background.
    ctx.fillStyle = 'var(--bg-panel, #1A1A2E)'
    ctx.fillRect(0, 0, w, h)

    // Center line (0 dB).
    const centerY = h / 2
    ctx.strokeStyle = 'var(--border, #2A2A4A)'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(0, centerY)
    ctx.lineTo(w, centerY)
    ctx.stroke()
    ctx.setLineDash([])

    if (gains.length < 10) return

    // Draw the curve.
    const padding = 30
    const graphW = w - padding * 2
    const graphH = h - 20
    const yScale = graphH / 24 // ±12 dB range

    ctx.strokeStyle = 'var(--accent-secondary, #4EE2EC)'
    ctx.lineWidth = 2
    ctx.beginPath()

    // Interpolate between bands for a smooth curve.
    const points = 100
    for (let i = 0; i <= points; i++) {
      const t = i / points
      const bandPos = t * 9
      const bandIdx = Math.floor(bandPos)
      const frac = bandPos - bandIdx
      const gainA = gains[bandIdx] ?? 0
      const gainB = gains[Math.min(bandIdx + 1, 9)] ?? 0
      const gain = gainA * (1 - frac) + gainB * frac
      const x = padding + t * graphW
      const y = centerY - (gain / 12) * yScale
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // Center dot for each band.
    for (let i = 0; i < 10; i++) {
      const x = padding + (i / 9) * graphW
      const y = centerY - (gains[i] / 12) * yScale
      ctx.fillStyle = BAND_COLORS[i]
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [])

  useEffect(() => {
    drawCurve(responseCurve)
  }, [responseCurve, drawCurve])

  const handleSliderChange = useCallback(
    (bandIdx: number, value: number) => {
      const chain = dspEngine.chain
      for (const effect of chain.effects) {
        if (effect.id === 'equalizer-10band') {
          effect.setParameter(`band${bandIdx + 1}`, value)
          // Update local state for curve redraw.
          const updatedParams = effect.getParameters()
          setParams(updatedParams)
          const gains = updatedParams
            .filter((p) => p.id.startsWith('band'))
            .map((p) => Number(p.value))
          setResponseCurve(gains)
          break
        }
      }
    },
    [],
  )

  const handleReset = useCallback(() => {
    const chain = dspEngine.chain
    for (const effect of chain.effects) {
      if (effect.id === 'equalizer-10band') {
        effect.reset()
        const updatedParams = effect.getParameters()
        setParams(updatedParams)
        const gains = updatedParams
          .filter((p) => p.id.startsWith('band'))
          .map((p) => Number(p.value))
        setResponseCurve(gains)
        break
      }
    }
  }, [])

  // Extract band gains from params.
  const bandParams = params.filter((p) => p.id.startsWith('band'))

  return (
    <div className="audio-lab__eq">
      <div className="audio-lab__eq-header">
        <span className="audio-lab__eq-title">10-Band Equalizer</span>
        <button className="pixel-button audio-lab__eq-reset" onClick={handleReset}>
          FLAT
        </button>
      </div>

      {/* Frequency response curve */}
      <canvas
        ref={canvasRef}
        width={600}
        height={120}
        className="audio-lab__eq-curve"
        style={{
          width: '100%',
          height: '120px',
          imageRendering: 'pixelated',
          background: 'var(--bg-panel, #1A1A2E)',
          border: '2px solid var(--border, #2A2A4A)',
          marginBottom: '12px',
        }}
      />

      {/* Sliders */}
      <div className="audio-lab__eq-sliders">
        {bandParams.map((param, idx) => (
          <div key={param.id} className="audio-lab__eq-slider-col">
            <span
              className="audio-lab__eq-slider-value"
              style={{ color: BAND_COLORS[idx] }}
            >
              {Number(param.value) > 0 ? '+' : ''}{Number(param.value).toFixed(1)}
            </span>
            <div className="audio-lab__eq-slider-track">
              <input
                type="range"
                min={param.min ?? -12}
                max={param.max ?? 12}
                step={param.step ?? 0.5}
                value={Number(param.value)}
                onChange={(e) => handleSliderChange(idx, Number(e.target.value))}
                className="audio-lab__eq-slider"
                style={{ '--slider-color': BAND_COLORS[idx] } as React.CSSProperties}
              />
            </div>
            <span className="audio-lab__eq-slider-label">{BAND_LABELS[idx]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
