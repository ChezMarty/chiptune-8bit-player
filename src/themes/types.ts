/**
 * Theme System Type Definitions
 *
 * Each theme is a flat record of semantic token names → CSS values.
 * The ThemeEngine maps these to CSS custom properties on <html>.
 * Theme names use a "semantic grouping" lowercase convention
 * (e.g. bgApp, textPrimary) and are converted to CSS vars
 * (--bg-app, --text-primary) by the engine.
 */

/** All available theme IDs. Extend this as new themes are added. */
export type ThemeId =
  | 'amiga'
  | 'arcade'
  | 'arctic-ice'
  | 'aurora'
  | 'autumn-forest'
  | 'blue-crt'
  | 'boombox'
  | 'cassette'
  | 'catppuccin'
  | 'cherry-blossom'
  | 'christmas'
  | 'coffee-house'
  | 'cozy-coffee'
  | 'crt-amber'
  | 'crt-green'
  | 'cyberpunk-2077'
  | 'deep-ocean'
  | 'desert-sand'
  | 'dos-blue'
  | 'dracula'
  | 'dreamcast'
  | 'emerald-forest'
  | 'famicom'
  | 'forest'
  | 'galaxy'
  | 'game-gear'
  | 'gameboy'
  | 'gameboy-color'
  | 'gruvbox'
  | 'hacker-black'
  | 'hacker-blue'
  | 'halloween'
  | 'hifi-stereo'
  | 'ibm-pc'
  | 'mac-classic'
  | 'mac-osx-aqua'
  | 'mario'
  | 'matrix'
  | 'midnight'
  | 'midnight-blue'
  | 'monochrome'
  | 'moonlight'
  | 'ms-dos'
  | 'neon-city'
  | 'nes'
  | 'nintendo-64'
  | 'nintendo-switch'
  | 'nord'
  | 'ocean'
  | 'playstation'
  | 'playstation-2'
  | 'pokemon-blue'
  | 'pokemon-gold'
  | 'pokemon-red'
  | 'ps-vita'
  | 'psp'
  | 'purple-dream'
  | 'sakura'
  | 'sega-cd'
  | 'sega-genesis'
  | 'sega-saturn'
  | 'snes'
  | 'solarized-dark'
  | 'space'
  | 'studio-monitor'
  | 'sunset'
  | 'sunset-beach'
  | 'synthwave'
  | 'tokyo-night'
  | 'tropical'
  | 'valentine'
  | 'vaporwave'
  | 'vinyl-studio'
  | 'virtual-boy'
  | 'walkman'
  | 'wii'
  | 'wii-u'
  | 'windows-2000'
  | 'windows-31'
  | 'windows-7'
  | 'windows-95'
  | 'windows-vista'
  | 'windows-xp'
  | 'xbox'
  | 'zelda'

/** Theme categories for UI grouping. */
export type ThemeCategory =
  | 'classic-consoles'
  | 'retro-computers'
  | 'crt-terminal'
  | 'artistic'
  | 'music-audio'
  | 'nature-mood'

/** Category display metadata. */
export interface CategoryMeta {
  id: ThemeCategory
  labelKey: string // i18n key
  emoji: string
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'classic-consoles', labelKey: 'theme.category.consoles', emoji: '🎮' },
  { id: 'retro-computers', labelKey: 'theme.category.computers', emoji: '💻' },
  { id: 'crt-terminal', labelKey: 'theme.category.crt', emoji: '📺' },
  { id: 'artistic', labelKey: 'theme.category.artistic', emoji: '🌅' },
  { id: 'music-audio', labelKey: 'theme.category.music', emoji: '🎵' },
  { id: 'nature-mood', labelKey: 'theme.category.nature', emoji: '🌿' },
]

/** Theme sort modes in the picker. */
export type ThemeSortMode = 'name' | 'favorites'

/**
 * Theme token definition. Every theme MUST provide all keys.
 * Values are CSS-compatible strings (colors, lengths, etc.).
 */
export interface ThemeTokens {
  // ── Background ──────────────────────────────────────
  bgApp: string
  bgPanel: string
  bgPanelLight: string
  bgElevated: string
  bgPanelHover: string

  // ── Text ────────────────────────────────────────────
  textPrimary: string
  textSecondary: string
  textTertiary: string
  textInverse: string
  textLink: string

  // ── Accent ──────────────────────────────────────────
  accent: string
  accentDark: string
  accentSecondary: string
  accentTertiary: string
  accentPositive: string
  accentNegative: string

  // ── Borders ─────────────────────────────────────────
  border: string
  borderLight: string
  borderFocus: string
  borderWidth: string
  borderRadius: string

  // ── Shadows ─────────────────────────────────────────
  shadowPanel: string
  shadowButton: string
  shadowButtonInset: string

  // ── Surfaces ────────────────────────────────────────
  surfaceRaised: string
  surfaceSunken: string

  // ── Interactive states ──────────────────────────────
  hoverBg: string
  hoverText: string
  activeBg: string
  activeText: string
  disabledBg: string
  disabledText: string

  // ── Feedback ────────────────────────────────────────
  feedbackSuccess: string
  feedbackWarning: string
  feedbackError: string
  feedbackInfo: string

  // ── Vinyl Record Player ─────────────────────────────
  vinylBlack: string
  vinylGroove: string
  vinylLabel: string
  vinylShine: string

  // ── Typography ──────────────────────────────────────
  fontPixel: string
  fontBody: string

  // ── Background effects ──────────────────────────────
  bgAppPattern: string // CSS background value (gradient, etc.)
  bgAppOverlay: string // Optional SVG data-uri overlay
  bgAppNoise: string   // Opacity for CSS noise
  bgAppScanlines: string // Opacity for CRT scanlines

  // ── Visual style hints ──────────────────────────────
  /** Pixel-border weight: 'heavy' = 4px, 'light' = 2px */
  borderWeight: 'heavy' | 'light'
  /** Is this a predominantly dark theme? */
  isDark: 'true' | 'false'
}

/**
 * A theme definition includes its tokens plus metadata for the UI.
 */
export interface ThemeDefinition {
  id: ThemeId
  labelKey: string // i18n key for the display name
  category: ThemeCategory
  /** Short description shown in the theme picker tooltip. */
  descriptionKey: string
  tokens: ThemeTokens
}

/**
 * Maps `ThemeTokens` camelCase keys to CSS custom property kebab-case names.
 * Example: "bgApp" → "--bg-app"
 */
export function tokenToCssVar(key: keyof ThemeTokens): string {
  return `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
}

/**
 * Convert a ThemeTokens object into a flat record of CSS var names → values.
 */
export function tokensToCssVars(tokens: ThemeTokens): Record<string, string> {
  const vars: Record<string, string> = {}
  for (const [key, value] of Object.entries(tokens)) {
    vars[tokenToCssVar(key as keyof ThemeTokens)] = String(value)
  }
  return vars
}

/** User-facing theme metadata stored in localStorage (favorites). */
export interface ThemeUserMeta {
  favorites: ThemeId[]
  lastCategory: ThemeCategory | null
  sortMode: ThemeSortMode
}
