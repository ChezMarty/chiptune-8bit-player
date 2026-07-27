import { useRef, useEffect, useCallback } from 'react'
import type { AnalyzerData } from '../../../dsp/types'

interface Props {
  data: AnalyzerData | null
  barCount?: number
  color?: string
  gradient?: boolean
  fallSpeed?: number
  /** EMA smoothing factor (0..1). 0 = off (uses only falloff), 1 = instant. Default 0. */
  smoothing?: number
  /** Sensitivity scale factor (0..∞). >1 amplifies, <1 reduces. Default 1. */
  sensitivity?: number
}

/**
 * Spectrum Visualizer — vertical bar chart of frequency vs magnitude.
 * Renders FFT data as retro 8-bit style bars.
 *
 * Smoothing: uses a dual-stage approach — EMA smoothing (configurable)
 * smooths frame-to-frame jitter, while falloff creates the classic
 * "needle drop" effect (slow decay, instant rise).
 */
export function SpectrumVisualizer({
  data,
  barCount = 32,
  color = 'var(--accent, #E52521)',
  gradient = true,
  fallSpeed = 0.8,
  smoothing = 0,
  sensitivity = 1,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const barsRef = useRef<number[]>(new Array(barCount).fill(0))
  const emaRef = useRef<number[]>(new Array(barCount).fill(0))
  // Cache CSS custom property lookups to avoid forced reflows.
  const cssCacheRef = useRef<{ accent: string; accentSecondary: string } | null>(null)

  const draw = useCallback(
    (spectrum: Float32Array) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const w = canvas.width
      const h = canvas.height
      const binCount = spectrum.length

      // Cache CSS lookups once (re-read on theme switch via invalidation above).
      if (!cssCacheRef.current) {
        cssCacheRef.current = {
          accent: getComputedStyle(document.documentElement)
            .getPropertyValue('--accent').trim() || '#E52521',
          accentSecondary: getComputedStyle(document.documentElement)
            .getPropertyValue('--accent-secondary').trim() || '#4EE2EC',
        }
      }
      const { accent: accentColor, accentSecondary } = cssCacheRef.current

      // Map FFT bins to visual bars.
      const barsPerBin = Math.floor(binCount / barCount)
      const newBars: number[] = []

      for (let i = 0; i < barCount; i++) {
        // Average the dB values in this bar's range.
        let sum = 0
        let count = 0
        const start = i * barsPerBin
        const end = Math.min(start + barsPerBin, binCount)
        for (let j = start; j < end; j++) {
          // Convert dB (-100..0) to 0..1, apply sensitivity.
          const val = ((spectrum[j] + 100) / 100) * sensitivity
          sum += Math.max(0, Math.min(1, val))
          count++
        }
        const raw = count > 0 ? Math.max(0, Math.min(1, sum / count)) : 0

        // Stage 1: EMA smoothing (frame-to-frame jitter reduction).
        const emaPrev = emaRef.current[i] ?? 0
        const emaVal = smoothing > 0
          ? emaPrev + smoothing * (raw - emaPrev)
          : raw
        emaRef.current[i] = emaVal

        // Stage 2: Falloff smoothing (slow decay, instant rise).
        const prev = barsRef.current[i] ?? 0
        const smoothed = emaVal >= prev ? emaVal : prev * fallSpeed + emaVal * (1 - fallSpeed)
        newBars.push(smoothed)
      }
      barsRef.current = newBars

      // Clear canvas.
      ctx.clearRect(0, 0, w, h)

      const barW = w / barCount

      for (let i = 0; i < barCount; i++) {
        const barH = newBars[i] * h * 0.9 // Leave 10% headroom
        const x = i * barW
        const y = h - barH

        // Draw bar.
        ctx.fillStyle = gradient
          ? `hsl(${200 - newBars[i] * 200}, 80%, ${50 + newBars[i] * 30}%)`
          : accentColor
        ctx.fillRect(x + 1, y, barW - 2, barH)

        // Draw pixel-style border on each bar.
        ctx.strokeStyle = accentSecondary
        ctx.lineWidth = 1
        ctx.strokeRect(x + 1, y, barW - 2, barH)
      }
    },
    [barCount, color, gradient, fallSpeed, smoothing, sensitivity],
  )

  useEffect(() => {
    if (data) {
      draw(data.spectrum)
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
