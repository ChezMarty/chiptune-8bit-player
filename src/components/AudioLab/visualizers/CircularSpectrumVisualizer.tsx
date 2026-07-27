import { useRef, useEffect, useCallback } from 'react'
import type { AnalyzerData } from '../../../dsp/types'

interface Props {
  data: AnalyzerData | null
  barCount?: number
  radius?: number
  rotationSpeed?: number
}

/**
 * Circular Spectrum Visualizer — radial bar chart.
 * Inspired by Winamp-style circular visualizations.
 */
export function CircularSpectrumVisualizer({
  data,
  barCount = 48,
  radius = 60,
  rotationSpeed = 0,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const barsRef = useRef<number[]>(new Array(barCount).fill(0))
  const rotationRef = useRef(0)

  const draw = useCallback(
    (spectrum: Float32Array) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const w = canvas.width
      const h = canvas.height
      const cx = w / 2
      const cy = h / 2
      const binCount = spectrum.length

      // Update rotation.
      rotationRef.current += rotationSpeed

      // Map FFT bins to bars.
      const binsPerBar = Math.floor(binCount / barCount)
      const newBars: number[] = []
      const fallSpeed = 0.9

      for (let i = 0; i < barCount; i++) {
        let sum = 0
        let count = 0
        const start = i * binsPerBar
        const end = Math.min(start + binsPerBar, binCount)
        for (let j = start; j < end; j++) {
          sum += (spectrum[j] + 100) / 100
          count++
        }
        const raw = count > 0 ? Math.max(0, Math.min(1, sum / count)) : 0
        const prev = barsRef.current[i] ?? 0
        const smoothed = raw >= prev ? raw : prev * fallSpeed + raw * (1 - fallSpeed)
        newBars.push(smoothed)
      }
      barsRef.current = newBars

      const accentSecondary = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent-secondary').trim() || '#4EE2EC'

      ctx.clearRect(0, 0, w, h)

      // Draw outer ring.
      ctx.strokeStyle = 'var(--border, #2A2A4A)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2)
      ctx.stroke()

      // Draw bars radiating from center.
      const angleStep = (Math.PI * 2) / barCount

      for (let i = 0; i < barCount; i++) {
        const barHeight = newBars[i] * radius * 0.8
        const angle = angleStep * i + rotationRef.current
        const innerR = radius * 0.3

        const x1 = cx + Math.cos(angle) * innerR
        const y1 = cy + Math.sin(angle) * innerR
        const x2 = cx + Math.cos(angle) * (innerR + barHeight)
        const y2 = cy + Math.sin(angle) * (innerR + barHeight)

        ctx.strokeStyle = `hsl(${200 - newBars[i] * 200}, 80%, ${50 + newBars[i] * 30}%)`
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }

      // Draw center dot.
      ctx.fillStyle = accentSecondary
      ctx.beginPath()
      ctx.arc(cx, cy, 4, 0, Math.PI * 2)
      ctx.fill()
    },
    [barCount, radius, rotationSpeed],
  )

  useEffect(() => {
    if (data) {
      draw(data.spectrum)
    }
  }, [data, draw])

  return (
    <canvas
      ref={canvasRef}
      width={256}
      height={256}
      className="audio-lab__visualizer-canvas"
      style={{
        width: '256px',
        height: '256px',
        margin: '0 auto',
        imageRendering: 'pixelated',
        background: 'var(--bg-panel, #1A1A2E)',
        border: '2px solid var(--border, #2A2A4A)',
        borderRadius: '50%',
      }}
    />
  )
}
