/**
 * Theme pattern utilities — generates CSS background values for
 * theme background effects (noise, scanlines, grids, textures).
 *
 * Returns CSS values that can be assigned to --bg-app-pattern,
 * --bg-app-overlay, etc.
 *
 * All patterns are pure CSS (gradients) or inline SVG data URIs.
 * No external image assets required.
 */

/**
 * Create a CSS noise/grain overlay using an SVG feTurbulence filter.
 * Returns an SVG data URI that can be used as a background-image.
 * `opacity` is the alpha for the noise layer (0–1).
 * `baseFrequency` controls grain size (0.3 = fine, 0.8 = coarse).
 */
export function noiseSvgDataUri(
  opacity: number = 0.03,
  baseFrequency: number = 0.6,
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
    <filter id="n">
      <feTurbulence type="fractalNoise" baseFrequency="${baseFrequency}" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturation" values="0"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#n)" opacity="${opacity}"/>
  </svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

/**
 * Create CSS scanline pattern using repeating-linear-gradient.
 * `opacity` controls the darkness of scanlines (0 = invisible, 1 = solid).
 * `size` is the scanline pair height in pixels (typical: 4px for CRT look).
 */
export function scanlineCss(
  opacity: number = 0.08,
  size: number = 4,
): string {
  return `repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent ${Math.floor(size / 2)}px,
    rgba(0, 0, 0, ${opacity}) ${Math.floor(size / 2)}px,
    rgba(0, 0, 0, ${opacity}) ${size}px
  )`
}

/**
 * Pixel grid overlay — subtle 2x2 pixel grid like a retro LCD.
 */
export function pixelGridCss(color: string = 'rgba(0,0,0,0.06)', size: number = 2): string {
  return `repeating-conic-gradient(${color} 0% 25%, transparent 0% 50%) 0 0 / ${size}px ${size}px`
}

/**
 * CRT vignette — radial gradient darkening the edges.
 */
export function vignetteCss(intensity: number = 0.3): string {
  return `radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,${intensity}) 100%)`
}

/**
 * Diagonal stripe pattern (for Genesis-era techy feel).
 */
export function diagonalStripesCss(
  color: string = 'rgba(255,255,255,0.03)',
  size: number = 8,
): string {
  return `repeating-linear-gradient(
    45deg,
    transparent,
    transparent ${size / 2}px,
    ${color} ${size / 2}px,
    ${color} ${size}px
  )`
}

/**
 * Dotted grid pattern (subtle dot matrix).
 */
export function dotGridCss(
  color: string = 'rgba(255,255,255,0.04)',
  size: number = 4,
  dotSize: number = 1,
): string {
  return `radial-gradient(circle, ${color} ${dotSize}px, transparent ${dotSize}px) 0 0 / ${size}px ${size}px`
}

/**
 * Combine multiple background layers into a single CSS background value.
 */
export function combineBackgrounds(...layers: string[]): string {
  return layers.filter(Boolean).join(', ')
}

/**
 * Pre-built common pattern presets that theme definitions can reference.
 */
export const PatternPresets = {
  /** Subtle CRT scanlines + vignette for terminal themes. */
  crt: (scanlineOpacity: number = 0.06): string =>
    combineBackgrounds(scanlineCss(scanlineOpacity), vignetteCss(0.25)),

  /** Fine film grain noise. */
  filmGrain: noiseSvgDataUri(0.025, 0.7),

  /** Coarse retro pixel noise. */
  pixelNoise: noiseSvgDataUri(0.04, 0.4),

  /** Subtle pixel grid for handheld LCD feel. */
  lcdGrid: pixelGridCss('rgba(0,0,0,0.04)', 2),

  /** Diagonal tech pattern (Sega Genesis / synthwave). */
  techStripes: diagonalStripesCss('rgba(255,255,255,0.04)', 6),

  /** Warm paper texture (vinyl/cassette). */
  warmPaper: noiseSvgDataUri(0.02, 0.3),

  /** Dark vignette for atmospheric themes. */
  darkVignette: vignetteCss(0.35),

  /** Light vignette for bright themes. */
  lightVignette: vignetteCss(0.12),
} as const
