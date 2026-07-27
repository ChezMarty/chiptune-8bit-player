// ── Signal Measurement ─────────────────────────────────────────

/** Compute RMS, peak, and silent flag from a Float32Array of PCM samples. */
export function computeSignalMetrics(samples: Float32Array): {
  rms: number
  peak: number
  silent: boolean
  frames: number
} {
  if (samples.length === 0) {
    return { rms: 0, peak: 0, silent: true, frames: 0 }
  }
  let sumSq = 0
  let peak = 0
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i]!
    sumSq += s * s
    const abs = Math.abs(s)
    if (abs > peak) peak = abs
  }
  const rms = Math.sqrt(sumSq / samples.length)
  return {
    rms,
    peak,
    silent: peak < 0.0001,
    frames: samples.length,
  }
}

// ── Disconnect Logger ─────────────────────────────────────────

let _disconnectCounter = 0

/** Log every AudioNode.disconnect() call with node type, caller, and stack. */
export function logDisconnect(nodeName: string, caller: string): void {
  _disconnectCounter++
  const stack = new Error().stack?.split('\n').slice(2, 5).join(' → ') ?? '?'
  console.log('[DSP-DISCONNECT] #' + _disconnectCounter + ' ' + nodeName + ' disconnected by ' + caller + ' | stack=' + stack)
}
