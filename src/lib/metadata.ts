import { parseBuffer } from 'music-metadata'
import { convertFileSrc } from '@tauri-apps/api/core'

export interface TrackMetadata {
  title: string
  artist: string
  album?: string
  durationSec: number
  hasArt: boolean
  artDataUrl?: string | null
}

/**
 * Read tags from a local audio file via Tauri's asset protocol.
 * Falls back gracefully on parse errors.
 */
export async function readMetadata(
  filePath: string,
  fileName: string,
): Promise<TrackMetadata> {
  const fallback = (): TrackMetadata => ({
    title: stripExt(fileName),
    artist: 'Unknown',
    durationSec: 0,
    hasArt: false,
    artDataUrl: null,
  })

  try {
    const url = convertFileSrc(filePath)
    const res = await fetch(url)
    if (!res.ok) return fallback()
    const buf = await res.arrayBuffer()
    const meta = await parseBuffer(new Uint8Array(buf), {
      mimeType: guessMime(fileName),
    })
    const picture = meta.common.picture?.[0]
    const artDataUrl = picture ? toDataUrl(picture.data, picture.format) : null
    return {
      title: meta.common.title?.trim() || stripExt(fileName),
      artist: meta.common.artist?.trim() || 'Unknown Artist',
      album: meta.common.album?.trim(),
      durationSec: Math.round(meta.format.duration ?? 0),
      hasArt: !!picture,
      artDataUrl,
    }
  } catch (err) {
    console.warn('[metadata] parse failed for', filePath, err)
    return fallback()
  }
}

function stripExt(name: string): string {
  const i = name.lastIndexOf('.')
  return i > 0 ? name.slice(0, i) : name
}

function guessMime(name: string): string | undefined {
  const ext = name.toLowerCase().split('.').pop() || ''
  switch (ext) {
    case 'mp3':
      return 'audio/mpeg'
    case 'm4a':
    case 'aac':
      return 'audio/aac'
    case 'flac':
      return 'audio/flac'
    case 'wav':
      return 'audio/wav'
    case 'ogg':
    case 'oga':
      return 'audio/ogg'
    case 'opus':
      return 'audio/opus'
    default:
      return undefined
  }
}

function toDataUrl(data: Uint8Array, format: string): string {
  // music-metadata v11 returns picture.data as Uint8Array in browser context.
  // Chunked string builder avoids the apply() arg-length limit on huge buffers.
  let bin = ''
  const chunkSize = 0x8000
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.subarray(i, i + chunkSize)
    bin += String.fromCharCode.apply(null, Array.from(chunk))
  }
  return `data:${format};base64,${btoa(bin)}`
}
