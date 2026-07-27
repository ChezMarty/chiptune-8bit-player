import { useRef, useEffect, useCallback } from 'react'
import type { AnalyzerData } from '../../../dsp/types'

interface Props {
  data: AnalyzerData | null
  lineThickness?: number
  color?: string
}

/**
 * Waveform Visualizer — time-domain waveform display.
 * Renders the raw audio waveform as an oscilloscope-style line.
 */
export function WaveformVisualizer({ data, lineThickness = 2, color }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const draw = useCallback(
    (waveform: Float32Array) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const w = canvas.width
      const h = canvas.height
      const len = waveform.length

      const accentColor = color ||
        getComputedStyle(document.documentElement)
          .getPropertyValue('--accent-secondary').trim() || '#4EE2EC'

      ctx.clearRect(0, 0, w, h)

      // Draw center line.
      ctx.strokeStyle = 'var(--border, #2A2A4A)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, h / 2)
      ctx.lineTo(w, h / 2)
      ctx.stroke()

      // Draw waveform.
      ctx.strokeStyle = accentColor
      ctx.lineWidth = lineThickness
      ctx.beginPath()

      const step = Math.max(1, Math.floor(len / w))
      for (let x = 0; x < w; x++) {
        const idx = Math.min(Math.floor(x * step), len - 1)
        const sample = waveform[idx] ?? 0
        const y = (sample * 0.5 + 0.5) * h // Map -1..1 to 0..h
        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()

      // Pixel glow effect.
      ctx.shadowColor = accentColor
      ctx.shadowBlur = 4
      ctx.stroke()
      ctx.shadowBlur = 0
    },
    [lineThickness, color],
  )

  useEffect(() => {
    if (data) {
      draw(data.waveform)
    }
  }, [data, draw])

  return (
    <canvas
      ref={canvasRef}
      width={512}
      height={160}
      className="audio-lab__visualizer-canvas"
      style={{
        width: '100%',
        height: '160px',
        imageRendering: 'pixelated',
        background: 'var(--bg-panel, #1A1A2E)',
        border: '2px solid var(--border, #2A2A4A)',
      }}
    />
  )
}
