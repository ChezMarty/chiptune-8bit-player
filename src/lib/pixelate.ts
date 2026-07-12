/**
 * Down-sample an image (data URL) into a posterized "8-bit" art rendition
 * using nearest-neighbor scaling then a fixed-step color quantization.
 * The output is a small PNG which we then CSS-scale to look chunky.
 */
export async function pixelateImage(
  source: string,
  size: number = 64,
  paletteSteps: number = 4,
): Promise<string> {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = (e) => reject(e)
    img.src = source
  })

  // 1. Draw the source to an offscreen canvas at low resolution with no
  //    smoothing. imageSmoothingEnabled=false keeps the squares sharp.
  const small = document.createElement('canvas')
  small.width = size
  small.height = size
  const ctx = small.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context not available')
  ctx.imageSmoothingEnabled = false

  // Cover-fit (aspect-fill) the image into the pixel grid.
  const ratio = Math.max(img.width / size, img.height / size)
  const w = img.width / ratio
  const h = img.height / ratio
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)

  // 2. Quantize each pixel's RGB to a coarse palette.
  const data = ctx.getImageData(0, 0, size, size)
  const out = ctx.createImageData(size, size)
  for (let i = 0; i < data.data.length; i += 4) {
    out.data[i] = quantize(data.data[i], paletteSteps)
    out.data[i + 1] = quantize(data.data[i + 1], paletteSteps)
    out.data[i + 2] = quantize(data.data[i + 2], paletteSteps)
    out.data[i + 3] = 255
  }
  ctx.putImageData(out, 0, 0)
  return small.toDataURL('image/png')
}

function quantize(v: number, steps: number): number {
  const s = Math.max(2, steps)
  return Math.round((v / 255) * (s - 1)) / (s - 1) * 255
}
