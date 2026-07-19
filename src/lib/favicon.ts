/**
 * Dynamic theme-colored favicon generator.
 *
 * Renders the 16×16 pixel-art cassette tape icon using the current
 * theme's CSS custom properties. Called from the theme engine whenever
 * a theme is applied, and on initial boot from main.tsx.
 *
 * The 16×16 GRID layout is the source of truth — shared with the
 * build-time icon generator at scripts/gen-favicon.mjs.
 */

// ─── Cassette tape 16×16 pixel grid ──────────────────────────────
// Palette indices:
//   0 = transparent
//   1 = border (outer cassette edge)
//   2 = body panel (main housing)
//   3 = label (cream band, text background)
//   4 = dash-1 (red, mapped to accent)
//   5 = dash-2 (amber, mapped to accentTertiary)
//   6 = dash-3 (cyan, mapped to accentSecondary)
//   7 = reel shadow (dark tape window)
const W = 16;
const H = 16;

const GRID: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0],
  [0, 1, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 1, 0],
  [0, 1, 2, 3, 4, 5, 6, 3, 3, 3, 3, 3, 3, 2, 1, 0],
  [0, 1, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 1, 0],
  [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0],
  [0, 1, 2, 7, 7, 7, 7, 2, 2, 7, 7, 7, 7, 2, 1, 0],
  [0, 1, 2, 7, 3, 3, 7, 2, 2, 7, 3, 3, 7, 2, 1, 0],
  [0, 1, 2, 7, 7, 7, 7, 2, 2, 7, 7, 7, 7, 2, 1, 0],
  [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

// ─── CSS var → palette index mapping ─────────────────────────────
// The theme engine sets CSS custom properties on <html>. We read
// them via getComputedStyle and map each palette index to a specific
// token so the cassette icon colors shift with the theme.
//
// Index → token mapping rationale:
//   1 (border):     textTertiary — subtle support color, visible edge
//   2 (body panel): bgPanel — main housing body
//   3 (label):      bgPanelLight — lighter band for the cassette label
//   4 (dash-1):     accent — primary brand color
//   5 (dash-2):     accentTertiary — secondary warm/neutral accent
//   6 (dash-3):     accentSecondary — complementary cool accent
//   7 (reel):       bgApp — darkest color for tape window recess

const CSS_VAR_MAP: Record<number, string> = {
  1: '--text-tertiary',
  2: '--bg-panel',
  3: '--bg-panel-light',
  4: '--accent',
  5: '--accent-tertiary',
  6: '--accent-secondary',
  7: '--bg-app',
};

// ─── CSS color parser ────────────────────────────────────────────

interface RGB {
  r: number;
  g: number;
  b: number;
}

/** Parse a CSS color value (hex, rgb(), or named) to {r, g, b}. */
function parseColor(cssValue: string): RGB {
  // Handle hex: #RGB or #RRGGBB
  const hexMatch = cssValue.match(
    /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i,
  );
  if (hexMatch) {
    const h = hexMatch[1];
    if (h.length === 3) {
      return {
        r: parseInt(h[0] + h[0], 16),
        g: parseInt(h[1] + h[1], 16),
        b: parseInt(h[2] + h[2], 16),
      };
    }
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }

  // Handle rgb(r, g, b) / rgba(r, g, b, a)
  const rgbMatch = cssValue.match(
    /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/,
  );
  if (rgbMatch) {
    return { r: +rgbMatch[1], g: +rgbMatch[2], b: +rgbMatch[3] };
  }

  // Fallback: use a temporary canvas element to resolve named colors
  // and other formats. This handles modern CSS color syntax (lab(), oklch(), etc.)
  // as well as classic named colors transparently.
  try {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 1;
    tempCanvas.height = 1;
    const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.fillStyle = cssValue;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      return { r, g, b };
    }
  } catch {
    // canvas unavailable; fall through
  }

  return { r: 128, g: 128, b: 128 };
}

// ─── Favicon rendering ───────────────────────────────────────────

/** Build the theme-colored palette from current CSS custom properties. */
function buildPalette(): RGB[] {
  if (typeof document === 'undefined') {
    // SSR guard — return a neutral fallback
    return [
      { r: 0, g: 0, b: 0 },
      { r: 43, g: 43, b: 43 },
      { r: 74, g: 74, b: 74 },
      { r: 220, g: 218, b: 200 },
      { r: 200, g: 100, b: 100 },
      { r: 200, g: 160, b: 60 },
      { r: 80, g: 180, b: 210 },
      { r: 24, g: 24, b: 24 },
    ];
  }

  const styles = getComputedStyle(document.documentElement);
  const palette: RGB[] = [
    { r: 0, g: 0, b: 0 }, // 0: transparent — placeholder, alpha forced later
  ];

  for (let i = 1; i <= 7; i++) {
    const varName = CSS_VAR_MAP[i];
    const raw = styles.getPropertyValue(varName).trim();
    palette.push(raw ? parseColor(raw) : { r: 128, g: 128, b: 128 });
  }

  return palette;
}

/**
 * Render the cassette favicon to a canvas and inject it as the browser
 * tab icon. Safe to call before the DOM is ready (no-ops gracefully).
 */
function renderFavicon(palette: RGB[]): void {
  if (typeof document === 'undefined') return;

  // Use a small offscreen canvas. 32×32 gives crisp 2× pixel blocks
  // from the 16×16 grid, rendering well in browser tabs.
  const SIZE = 32;
  const SCALE = SIZE / W; // = 2

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  const imgData = ctx.createImageData(SIZE, SIZE);
  const data = imgData.data;

  for (let gy = 0; gy < H; gy++) {
    for (let gx = 0; gx < W; gx++) {
      const idx = GRID[gy][gx];
      const { r, g, b } = palette[idx];
      const alpha = idx === 0 ? 0 : 255;

      // Fill the SCALE×SCALE block for this grid cell
      for (let dy = 0; dy < SCALE; dy++) {
        for (let dx = 0; dx < SCALE; dx++) {
          const px = gx * SCALE + dx;
          const py = gy * SCALE + dy;
          const pi = (py * SIZE + px) * 4;
          data[pi] = r;
          data[pi + 1] = g;
          data[pi + 2] = b;
          data[pi + 3] = alpha;
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Convert to PNG data URL and inject into the favicon link
  const dataUrl = canvas.toDataURL('image/png');

  // Update or create the SVG favicon link (primary)
  let svgLink = document.querySelector<HTMLLinkElement>(
    'link[rel="icon"][type="image/svg+xml"]',
  );
  if (svgLink) {
    svgLink.href = dataUrl;
  }

  // Also update the ICO fallback link
  let icoLink = document.querySelector<HTMLLinkElement>(
    'link[rel="alternate icon"]',
  );
  if (icoLink) {
    icoLink.href = dataUrl;
  }
}

/**
 * Update the browser tab favicon to reflect the current theme.
 * Reads CSS custom properties from <html> and regenerates the
 * pixel-art cassette tape icon with theme-matched colors.
 *
 * Safe to call at any time (SSR, before DOM ready, etc).
 */
export function updateFavicon(): void {
  if (typeof document === 'undefined') return;

  // Use requestAnimationFrame so we read computed styles after
  // the browser has applied the new CSS custom properties.
  // Without this, getComputedStyle may return stale values in
  // the same synchronous tick that setProperty was called.
  requestAnimationFrame(() => {
    const palette = buildPalette();
    renderFavicon(palette);
  });
}
