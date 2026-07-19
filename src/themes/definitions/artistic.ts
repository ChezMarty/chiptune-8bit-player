/**
 * Artistic themes:
 * Vaporwave, Synthwave Sunset,
 * Tokyo Night, Dracula, Nord, Catppuccin, Gruvbox, Solarized Dark,
 * Moonlight, Aurora, Galaxy, Space, Neon City, Cyberpunk 2077,
 * Sunset Beach, Purple Dream, Midnight Blue, Coffee House,
 * Autumn Forest, Arctic Snow, Desert Sand, Tropical, Deep Ocean,
 * Emerald Forest, Cherry Blossom, Halloween, Christmas, Valentine
 */
import type { ThemeDefinition } from '../types'
import { PatternPresets } from '../patterns'

// ═══════════════════════════════════════════════════════════
// Vaporwave — Pink + cyan pastel synthwave dream
// ═══════════════════════════════════════════════════════════
const vaporwave: ThemeDefinition = {
  id: 'vaporwave',
  labelKey: 'theme.name.vaporwave',
  category: 'artistic',
  descriptionKey: 'theme.desc.vaporwave',
  tokens: {
    bgApp: '#1A0A20', bgPanel: '#2A1030', bgPanelLight: '#3D1A45', bgElevated: '#4E2558', bgPanelHover: '#5E3068',
    textPrimary: '#FFB8D0', textSecondary: '#B878D0', textTertiary: '#684878', textInverse: '#1A0A20', textLink: '#78F0FF',
    accent: '#FF6B9D', accentDark: '#CC3370', accentSecondary: '#78F0FF', accentTertiary: '#FFD700', accentPositive: '#78FFB0', accentNegative: '#FF4478',
    border: '#3D1A45', borderLight: '#2A1030', borderFocus: '#78F0FF', borderWidth: '4px', borderRadius: '4px',
    shadowPanel: '4px 4px 0 0 rgba(255, 107, 157, 0.15)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.3), inset 2px 2px 0 0 rgba(255,255,255,0.08)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.3), inset -2px -2px 0 0 rgba(255,255,255,0.08)',
    surfaceRaised: '#4E2558', surfaceSunken: '#0F0515',
    hoverBg: '#FF6B9D', hoverText: '#1A0A20', activeBg: '#CC3370', activeText: '#FFB8D0', disabledBg: '#2A1030', disabledText: '#684878',
    feedbackSuccess: '#78FFB0', feedbackWarning: '#FFD700', feedbackError: '#FF4478', feedbackInfo: '#78F0FF',
    vinylBlack: '#150820', vinylGroove: '#3D1A45', vinylLabel: '#FF6B9D', vinylShine: '#4E2558',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'linear-gradient(180deg, #2A1030 0%, #1A0A20 40%, #0F0515 100%)', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'heavy', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Synthwave Sunset — Orange/purple neon retrowave
// ═══════════════════════════════════════════════════════════
const synthwave: ThemeDefinition = {
  id: 'synthwave',
  labelKey: 'theme.name.synthwave',
  category: 'artistic',
  descriptionKey: 'theme.desc.synthwave',
  tokens: {
    bgApp: '#1A0820', bgPanel: '#2A0F30', bgPanelLight: '#401840', bgElevated: '#552255', bgPanelHover: '#662866',
    textPrimary: '#FFD8B0', textSecondary: '#E888D0', textTertiary: '#704870', textInverse: '#1A0820', textLink: '#00E5FF',
    accent: '#FF6B35', accentDark: '#CC4400', accentSecondary: '#00E5FF', accentTertiary: '#FFD700', accentPositive: '#50FF88', accentNegative: '#FF3366',
    border: '#401840', borderLight: '#2A0F30', borderFocus: '#00E5FF', borderWidth: '4px', borderRadius: '3px',
    shadowPanel: '4px 4px 0 0 rgba(255, 107, 53, 0.1)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.35), inset 2px 2px 0 0 rgba(255,255,255,0.06)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.35), inset -2px -2px 0 0 rgba(255,255,255,0.06)',
    surfaceRaised: '#552255', surfaceSunken: '#0D0415',
    hoverBg: '#FF6B35', hoverText: '#1A0820', activeBg: '#CC4400', activeText: '#FFD8B0', disabledBg: '#2A0F30', disabledText: '#704870',
    feedbackSuccess: '#50FF88', feedbackWarning: '#FFD700', feedbackError: '#FF3366', feedbackInfo: '#00E5FF',
    vinylBlack: '#120620', vinylGroove: '#401840', vinylLabel: '#FF6B35', vinylShine: '#552255',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'linear-gradient(180deg, #2A0F30 0%, #1A0820 50%, #0F1018 100%)', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'heavy', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Tokyo Night — Neon purple cityscape, popular code editor theme
// ═══════════════════════════════════════════════════════════
const tokyoNight: ThemeDefinition = {
  id: 'tokyo-night',
  labelKey: 'theme.name.tokyoNight',
  category: 'artistic',
  descriptionKey: 'theme.desc.tokyoNight',
  tokens: {
    bgApp: '#1A1B26', bgPanel: '#24283B', bgPanelLight: '#2F3348', bgElevated: '#3B4261', bgPanelHover: '#454C6E',
    textPrimary: '#C0CAF5', textSecondary: '#7AA2F7', textTertiary: '#565F89', textInverse: '#1A1B26', textLink: '#7DCFFF',
    accent: '#7AA2F7', accentDark: '#3D59A1', accentSecondary: '#BB9AF7', accentTertiary: '#FF9E64', accentPositive: '#9ECE6A', accentNegative: '#F7768E',
    border: '#2F3348', borderLight: '#24283B', borderFocus: '#7DCFFF', borderWidth: '3px', borderRadius: '4px',
    shadowPanel: '3px 3px 0 0 rgba(122, 162, 247, 0.08)', shadowButton: 'inset -1px -1px 0 0 rgba(0,0,0,0.3), inset 1px 1px 0 0 rgba(255,255,255,0.05)', shadowButtonInset: 'inset 1px 1px 0 0 rgba(0,0,0,0.3), inset -1px -1px 0 0 rgba(255,255,255,0.05)',
    surfaceRaised: '#3B4261', surfaceSunken: '#13141A',
    hoverBg: '#7AA2F7', hoverText: '#1A1B26', activeBg: '#3D59A1', activeText: '#C0CAF5', disabledBg: '#24283B', disabledText: '#565F89',
    feedbackSuccess: '#9ECE6A', feedbackWarning: '#E0AF68', feedbackError: '#F7768E', feedbackInfo: '#7DCFFF',
    vinylBlack: '#13141A', vinylGroove: '#2F3348', vinylLabel: '#BB9AF7', vinylShine: '#3B4261',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'linear-gradient(180deg, #24283B 0%, #1A1B26 60%, #13141A 100%)', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Dracula — Dark purple/cyan, legendary code editor theme
// ═══════════════════════════════════════════════════════════
const dracula: ThemeDefinition = {
  id: 'dracula',
  labelKey: 'theme.name.dracula',
  category: 'artistic',
  descriptionKey: 'theme.desc.dracula',
  tokens: {
    bgApp: '#1E1F29', bgPanel: '#282A36', bgPanelLight: '#343746', bgElevated: '#44475A', bgPanelHover: '#505270',
    textPrimary: '#F8F8F2', textSecondary: '#BD93F9', textTertiary: '#6272A4', textInverse: '#1E1F29', textLink: '#8BE9FD',
    accent: '#BD93F9', accentDark: '#7B5FB8', accentSecondary: '#8BE9FD', accentTertiary: '#FFB86C', accentPositive: '#50FA7B', accentNegative: '#FF5555',
    border: '#343746', borderLight: '#282A36', borderFocus: '#8BE9FD', borderWidth: '3px', borderRadius: '4px',
    shadowPanel: '3px 3px 0 0 rgba(189, 147, 249, 0.06)', shadowButton: 'inset -1px -1px 0 0 rgba(0,0,0,0.3), inset 1px 1px 0 0 rgba(255,255,255,0.05)', shadowButtonInset: 'inset 1px 1px 0 0 rgba(0,0,0,0.3), inset -1px -1px 0 0 rgba(255,255,255,0.05)',
    surfaceRaised: '#44475A', surfaceSunken: '#14151C',
    hoverBg: '#BD93F9', hoverText: '#1E1F29', activeBg: '#7B5FB8', activeText: '#F8F8F2', disabledBg: '#282A36', disabledText: '#6272A4',
    feedbackSuccess: '#50FA7B', feedbackWarning: '#FFB86C', feedbackError: '#FF5555', feedbackInfo: '#8BE9FD',
    vinylBlack: '#14151C', vinylGroove: '#343746', vinylLabel: '#BD93F9', vinylShine: '#44475A',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'linear-gradient(180deg, #282A36 0%, #1E1F29 50%, #14151C 100%)', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Nord — Cool blue-grey arctic palette
// ═══════════════════════════════════════════════════════════
const nord: ThemeDefinition = {
  id: 'nord',
  labelKey: 'theme.name.nord',
  category: 'artistic',
  descriptionKey: 'theme.desc.nord',
  tokens: {
    bgApp: '#2E3440', bgPanel: '#3B4252', bgPanelLight: '#434C5E', bgElevated: '#4C566A', bgPanelHover: '#576176',
    textPrimary: '#ECEFF4', textSecondary: '#E5E9F0', textTertiary: '#81A1C1', textInverse: '#2E3440', textLink: '#88C0D0',
    accent: '#88C0D0', accentDark: '#5E81AC', accentSecondary: '#81A1C1', accentTertiary: '#EBCB8B', accentPositive: '#A3BE8C', accentNegative: '#BF616A',
    border: '#434C5E', borderLight: '#3B4252', borderFocus: '#88C0D0', borderWidth: '3px', borderRadius: '3px',
    shadowPanel: '3px 3px 0 0 rgba(0, 0, 0, 0.35)', shadowButton: 'inset -1px -1px 0 0 rgba(0,0,0,0.3), inset 1px 1px 0 0 rgba(255,255,255,0.05)', shadowButtonInset: 'inset 1px 1px 0 0 rgba(0,0,0,0.3), inset -1px -1px 0 0 rgba(255,255,255,0.05)',
    surfaceRaised: '#4C566A', surfaceSunken: '#242933',
    hoverBg: '#88C0D0', hoverText: '#2E3440', activeBg: '#5E81AC', activeText: '#ECEFF4', disabledBg: '#3B4252', disabledText: '#81A1C1',
    feedbackSuccess: '#A3BE8C', feedbackWarning: '#EBCB8B', feedbackError: '#BF616A', feedbackInfo: '#88C0D0',
    vinylBlack: '#242933', vinylGroove: '#434C5E', vinylLabel: '#88C0D0', vinylShine: '#4C566A',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'linear-gradient(180deg, #3B4252 0%, #2E3440 60%, #242933 100%)', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Catppuccin — Soft pastel lavender, warm & cozy
// ═══════════════════════════════════════════════════════════
const catppuccin: ThemeDefinition = {
  id: 'catppuccin',
  labelKey: 'theme.name.catppuccin',
  category: 'artistic',
  descriptionKey: 'theme.desc.catppuccin',
  tokens: {
    bgApp: '#1E1E2E', bgPanel: '#313244', bgPanelLight: '#3C3F58', bgElevated: '#45475A', bgPanelHover: '#52556E',
    textPrimary: '#CDD6F4', textSecondary: '#CBA6F7', textTertiary: '#6C7086', textInverse: '#1E1E2E', textLink: '#89B4FA',
    accent: '#CBA6F7', accentDark: '#8B6FC0', accentSecondary: '#89B4FA', accentTertiary: '#F9E2AF', accentPositive: '#A6E3A1', accentNegative: '#F38BA8',
    border: '#3C3F58', borderLight: '#313244', borderFocus: '#89B4FA', borderWidth: '3px', borderRadius: '5px',
    shadowPanel: '3px 3px 0 0 rgba(203, 166, 247, 0.06)', shadowButton: 'inset -1px -1px 0 0 rgba(0,0,0,0.25), inset 1px 1px 0 0 rgba(255,255,255,0.06)', shadowButtonInset: 'inset 1px 1px 0 0 rgba(0,0,0,0.25), inset -1px -1px 0 0 rgba(255,255,255,0.06)',
    surfaceRaised: '#45475A', surfaceSunken: '#16161E',
    hoverBg: '#CBA6F7', hoverText: '#1E1E2E', activeBg: '#8B6FC0', activeText: '#CDD6F4', disabledBg: '#313244', disabledText: '#6C7086',
    feedbackSuccess: '#A6E3A1', feedbackWarning: '#F9E2AF', feedbackError: '#F38BA8', feedbackInfo: '#89B4FA',
    vinylBlack: '#16161E', vinylGroove: '#3C3F58', vinylLabel: '#CBA6F7', vinylShine: '#45475A',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'linear-gradient(180deg, #313244 0%, #1E1E2E 50%, #16161E 100%)', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Gruvbox — Retro earth tones, warm vintage terminal
// ═══════════════════════════════════════════════════════════
const gruvbox: ThemeDefinition = {
  id: 'gruvbox',
  labelKey: 'theme.name.gruvbox',
  category: 'artistic',
  descriptionKey: 'theme.desc.gruvbox',
  tokens: {
    bgApp: '#282828', bgPanel: '#32302F', bgPanelLight: '#3C3836', bgElevated: '#504945', bgPanelHover: '#5A5242',
    textPrimary: '#EBDBB2', textSecondary: '#D5C4A1', textTertiary: '#7C6F64', textInverse: '#282828', textLink: '#83A598',
    accent: '#D79921', accentDark: '#B57614', accentSecondary: '#83A598', accentTertiary: '#FABD2F', accentPositive: '#B8BB26', accentNegative: '#FB4934',
    border: '#3C3836', borderLight: '#32302F', borderFocus: '#83A598', borderWidth: '3px', borderRadius: '2px',
    shadowPanel: '3px 3px 0 0 rgba(0, 0, 0, 0.4)', shadowButton: 'inset -1px -1px 0 0 rgba(0,0,0,0.35), inset 1px 1px 0 0 rgba(255,255,255,0.05)', shadowButtonInset: 'inset 1px 1px 0 0 rgba(0,0,0,0.35), inset -1px -1px 0 0 rgba(255,255,255,0.05)',
    surfaceRaised: '#504945', surfaceSunken: '#1D2021',
    hoverBg: '#D79921', hoverText: '#282828', activeBg: '#B57614', activeText: '#EBDBB2', disabledBg: '#32302F', disabledText: '#7C6F64',
    feedbackSuccess: '#B8BB26', feedbackWarning: '#FABD2F', feedbackError: '#FB4934', feedbackInfo: '#83A598',
    vinylBlack: '#1D2021', vinylGroove: '#3C3836', vinylLabel: '#D79921', vinylShine: '#504945',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'linear-gradient(180deg, #32302F 0%, #282828 50%, #1D2021 100%)', bgAppOverlay: PatternPresets.warmPaper, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Solarized Dark — Teal + blue scientific precision
// ═══════════════════════════════════════════════════════════
const solarizedDark: ThemeDefinition = {
  id: 'solarized-dark',
  labelKey: 'theme.name.solarizedDark',
  category: 'artistic',
  descriptionKey: 'theme.desc.solarizedDark',
  tokens: {
    bgApp: '#002B36', bgPanel: '#073642', bgPanelLight: '#0E4452', bgElevated: '#155868', bgPanelHover: '#1C6A7A',
    textPrimary: '#839496', textSecondary: '#93A1A1', textTertiary: '#586E75', textInverse: '#002B36', textLink: '#268BD2',
    accent: '#268BD2', accentDark: '#1868A0', accentSecondary: '#2AA198', accentTertiary: '#B58900', accentPositive: '#859900', accentNegative: '#DC322F',
    border: '#0E4452', borderLight: '#073642', borderFocus: '#268BD2', borderWidth: '3px', borderRadius: '3px',
    shadowPanel: '3px 3px 0 0 rgba(0, 0, 0, 0.4)', shadowButton: 'inset -1px -1px 0 0 rgba(0,0,0,0.35), inset 1px 1px 0 0 rgba(255,255,255,0.04)', shadowButtonInset: 'inset 1px 1px 0 0 rgba(0,0,0,0.35), inset -1px -1px 0 0 rgba(255,255,255,0.04)',
    surfaceRaised: '#155868', surfaceSunken: '#00151E',
    hoverBg: '#268BD2', hoverText: '#839496', activeBg: '#1868A0', activeText: '#839496', disabledBg: '#073642', disabledText: '#586E75',
    feedbackSuccess: '#859900', feedbackWarning: '#B58900', feedbackError: '#DC322F', feedbackInfo: '#268BD2',
    vinylBlack: '#00151E', vinylGroove: '#0E4452', vinylLabel: '#2AA198', vinylShine: '#155868',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'linear-gradient(180deg, #073642 0%, #002B36 60%, #00151E 100%)', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Moonlight — Silvery blue night, elegant and calm
// ═══════════════════════════════════════════════════════════
const moonlight: ThemeDefinition = {
  id: 'moonlight',
  labelKey: 'theme.name.moonlight',
  category: 'artistic',
  descriptionKey: 'theme.desc.moonlight',
  tokens: {
    bgApp: '#141828', bgPanel: '#1C2238', bgPanelLight: '#242C48', bgElevated: '#2C3658', bgPanelHover: '#344068',
    textPrimary: '#D8E0F0', textSecondary: '#8898C0', textTertiary: '#485878', textInverse: '#141828', textLink: '#80B0F0',
    accent: '#6088C0', accentDark: '#385880', accentSecondary: '#80B0F0', accentTertiary: '#D0D8F8', accentPositive: '#60A870', accentNegative: '#D06070',
    border: '#242C48', borderLight: '#1C2238', borderFocus: '#80B0F0', borderWidth: '3px', borderRadius: '4px',
    shadowPanel: '3px 3px 0 0 rgba(96, 136, 192, 0.08)', shadowButton: 'inset -1px -1px 0 0 rgba(0,0,0,0.3), inset 1px 1px 0 0 rgba(255,255,255,0.06)', shadowButtonInset: 'inset 1px 1px 0 0 rgba(0,0,0,0.3), inset -1px -1px 0 0 rgba(255,255,255,0.06)',
    surfaceRaised: '#2C3658', surfaceSunken: '#0C0E18',
    hoverBg: '#6088C0', hoverText: '#D8E0F0', activeBg: '#385880', activeText: '#D8E0F0', disabledBg: '#1C2238', disabledText: '#485878',
    feedbackSuccess: '#60A870', feedbackWarning: '#C0B060', feedbackError: '#D06070', feedbackInfo: '#80B0F0',
    vinylBlack: '#0C0E18', vinylGroove: '#242C48', vinylLabel: '#D0D8F8', vinylShine: '#2C3658',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'linear-gradient(180deg, #1C2238 0%, #141828 50%, #0C0E18 100%)', bgAppOverlay: PatternPresets.darkVignette, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Aurora — Green/purple northern lights shimmer
// ═══════════════════════════════════════════════════════════
const aurora: ThemeDefinition = {
  id: 'aurora',
  labelKey: 'theme.name.aurora',
  category: 'artistic',
  descriptionKey: 'theme.desc.aurora',
  tokens: {
    bgApp: '#081020', bgPanel: '#101830', bgPanelLight: '#182040', bgElevated: '#202850', bgPanelHover: '#283060',
    textPrimary: '#D0E8F0', textSecondary: '#80B8D0', textTertiary: '#386080', textInverse: '#081020', textLink: '#80FFB0',
    accent: '#40D080', accentDark: '#209850', accentSecondary: '#8040F0', accentTertiary: '#D080FF', accentPositive: '#40D080', accentNegative: '#E05060',
    border: '#182040', borderLight: '#101830', borderFocus: '#80FFB0', borderWidth: '3px', borderRadius: '4px',
    shadowPanel: '3px 3px 0 0 rgba(64, 208, 128, 0.06)', shadowButton: 'inset -1px -1px 0 0 rgba(0,0,0,0.3), inset 1px 1px 0 0 rgba(255,255,255,0.06)', shadowButtonInset: 'inset 1px 1px 0 0 rgba(0,0,0,0.3), inset -1px -1px 0 0 rgba(255,255,255,0.06)',
    surfaceRaised: '#202850', surfaceSunken: '#040810',
    hoverBg: '#40D080', hoverText: '#081020', activeBg: '#209850', activeText: '#D0E8F0', disabledBg: '#101830', disabledText: '#386080',
    feedbackSuccess: '#40D080', feedbackWarning: '#D0C040', feedbackError: '#E05060', feedbackInfo: '#80FFB0',
    vinylBlack: '#040810', vinylGroove: '#182040', vinylLabel: '#8040F0', vinylShine: '#202850',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'linear-gradient(180deg, #101830 0%, #081020 40%, #040810 100%)', bgAppOverlay: PatternPresets.darkVignette, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Galaxy — Deep space purple with starry sparkle
// ═══════════════════════════════════════════════════════════
const galaxy: ThemeDefinition = {
  id: 'galaxy',
  labelKey: 'theme.name.galaxy',
  category: 'artistic',
  descriptionKey: 'theme.desc.galaxy',
  tokens: {
    bgApp: '#0A0A1A', bgPanel: '#14142E', bgPanelLight: '#1E1E42', bgElevated: '#282858', bgPanelHover: '#323268',
    textPrimary: '#D8D0F0', textSecondary: '#A090D0', textTertiary: '#504878', textInverse: '#0A0A1A', textLink: '#D080FF',
    accent: '#9050E0', accentDark: '#6030A0', accentSecondary: '#D080FF', accentTertiary: '#FFC0FF', accentPositive: '#60D090', accentNegative: '#E06070',
    border: '#1E1E42', borderLight: '#14142E', borderFocus: '#D080FF', borderWidth: '4px', borderRadius: '4px',
    shadowPanel: '4px 4px 0 0 rgba(144, 80, 224, 0.08)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.35), inset 2px 2px 0 0 rgba(255,255,255,0.06)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.35), inset -2px -2px 0 0 rgba(255,255,255,0.06)',
    surfaceRaised: '#282858', surfaceSunken: '#050510',
    hoverBg: '#9050E0', hoverText: '#D8D0F0', activeBg: '#6030A0', activeText: '#D8D0F0', disabledBg: '#14142E', disabledText: '#504878',
    feedbackSuccess: '#60D090', feedbackWarning: '#D0C060', feedbackError: '#E06070', feedbackInfo: '#D080FF',
    vinylBlack: '#050510', vinylGroove: '#1E1E42', vinylLabel: '#D080FF', vinylShine: '#282858',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'linear-gradient(180deg, #14142E 0%, #0A0A1A 50%, #050510 100%)', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'heavy', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Space — Dark void with blue highlights, cosmic
// ═══════════════════════════════════════════════════════════
const space: ThemeDefinition = {
  id: 'space',
  labelKey: 'theme.name.space',
  category: 'artistic',
  descriptionKey: 'theme.desc.space',
  tokens: {
    bgApp: '#050A14', bgPanel: '#0A1020', bgPanelLight: '#10182E', bgElevated: '#162038', bgPanelHover: '#1C2844',
    textPrimary: '#C8D8F0', textSecondary: '#7898C0', textTertiary: '#385070', textInverse: '#050A14', textLink: '#60B0F0',
    accent: '#3878C0', accentDark: '#205080', accentSecondary: '#60B0F0', accentTertiary: '#A0D8FF', accentPositive: '#40B070', accentNegative: '#D05060',
    border: '#10182E', borderLight: '#0A1020', borderFocus: '#60B0F0', borderWidth: '3px', borderRadius: '3px',
    shadowPanel: '3px 3px 0 0 rgba(56, 120, 192, 0.06)', shadowButton: 'inset -1px -1px 0 0 rgba(0,0,0,0.35), inset 1px 1px 0 0 rgba(255,255,255,0.05)', shadowButtonInset: 'inset 1px 1px 0 0 rgba(0,0,0,0.35), inset -1px -1px 0 0 rgba(255,255,255,0.05)',
    surfaceRaised: '#162038', surfaceSunken: '#020610',
    hoverBg: '#3878C0', hoverText: '#C8D8F0', activeBg: '#205080', activeText: '#C8D8F0', disabledBg: '#0A1020', disabledText: '#385070',
    feedbackSuccess: '#40B070', feedbackWarning: '#C0B050', feedbackError: '#D05060', feedbackInfo: '#60B0F0',
    vinylBlack: '#020610', vinylGroove: '#10182E', vinylLabel: '#A0D8FF', vinylShine: '#162038',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'linear-gradient(180deg, #0A1020 0%, #050A14 60%, #020610 100%)', bgAppOverlay: PatternPresets.darkVignette, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Neon City — Bright cyan + magenta, cyberpunk streets
// ═══════════════════════════════════════════════════════════
const neonCity: ThemeDefinition = {
  id: 'neon-city',
  labelKey: 'theme.name.neonCity',
  category: 'artistic',
  descriptionKey: 'theme.desc.neonCity',
  tokens: {
    bgApp: '#0A0A18', bgPanel: '#14142C', bgPanelLight: '#1E1E40', bgElevated: '#282854', bgPanelHover: '#323264',
    textPrimary: '#E0E0FF', textSecondary: '#A080FF', textTertiary: '#504888', textInverse: '#0A0A18', textLink: '#00FFFF',
    accent: '#FF00FF', accentDark: '#B000B0', accentSecondary: '#00FFFF', accentTertiary: '#FFFF00', accentPositive: '#40FF60', accentNegative: '#FF2040',
    border: '#1E1E40', borderLight: '#14142C', borderFocus: '#00FFFF', borderWidth: '4px', borderRadius: '2px',
    shadowPanel: '4px 4px 0 0 rgba(255, 0, 255, 0.06)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.4), inset 2px 2px 0 0 rgba(255,255,255,0.08)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.4), inset -2px -2px 0 0 rgba(255,255,255,0.08)',
    surfaceRaised: '#282854', surfaceSunken: '#050510',
    hoverBg: '#FF00FF', hoverText: '#0A0A18', activeBg: '#00FFFF', activeText: '#0A0A18', disabledBg: '#14142C', disabledText: '#504888',
    feedbackSuccess: '#40FF60', feedbackWarning: '#FFFF00', feedbackError: '#FF2040', feedbackInfo: '#00FFFF',
    vinylBlack: '#050510', vinylGroove: '#1E1E40', vinylLabel: '#FF00FF', vinylShine: '#282854',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'linear-gradient(180deg, #14142C 0%, #0A0A18 50%, #050510 100%)', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'heavy', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Cyberpunk 2077 — Yellow + black, Night City edgerunner
// ═══════════════════════════════════════════════════════════
const cyberpunk2077: ThemeDefinition = {
  id: 'cyberpunk-2077',
  labelKey: 'theme.name.cyberpunk2077',
  category: 'artistic',
  descriptionKey: 'theme.desc.cyberpunk2077',
  tokens: {
    bgApp: '#0A0A0A', bgPanel: '#141414', bgPanelLight: '#1E1E1E', bgElevated: '#282828', bgPanelHover: '#323232',
    textPrimary: '#E8E8E0', textSecondary: '#B0B0A0', textTertiary: '#505050', textInverse: '#0A0A0A', textLink: '#FFE000',
    accent: '#FFD800', accentDark: '#C0A000', accentSecondary: '#FF4040', accentTertiary: '#FFE060', accentPositive: '#40C040', accentNegative: '#FF2020',
    border: '#1E1E1E', borderLight: '#141414', borderFocus: '#FFE000', borderWidth: '4px', borderRadius: '0',
    shadowPanel: '4px 4px 0 0 rgba(255, 216, 0, 0.08)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.5), inset 2px 2px 0 0 rgba(255,255,255,0.05)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.5), inset -2px -2px 0 0 rgba(255,255,255,0.05)',
    surfaceRaised: '#282828', surfaceSunken: '#000000',
    hoverBg: '#FFD800', hoverText: '#0A0A0A', activeBg: '#C0A000', activeText: '#0A0A0A', disabledBg: '#141414', disabledText: '#505050',
    feedbackSuccess: '#40C040', feedbackWarning: '#FFD800', feedbackError: '#FF2020', feedbackInfo: '#FFD800',
    vinylBlack: '#000000', vinylGroove: '#1E1E1E', vinylLabel: '#FFD800', vinylShine: '#282828',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'heavy', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Sunset Beach — Warm golden sand + teal ocean
// ═══════════════════════════════════════════════════════════
const sunsetBeach: ThemeDefinition = {
  id: 'sunset-beach',
  labelKey: 'theme.name.sunsetBeach',
  category: 'artistic',
  descriptionKey: 'theme.desc.sunsetBeach',
  tokens: {
    bgApp: '#1A1810', bgPanel: '#2A2418', bgPanelLight: '#3D3220', bgElevated: '#504028', bgPanelHover: '#604E30',
    textPrimary: '#FFE8C0', textSecondary: '#D0B080', textTertiary: '#786040', textInverse: '#1A1810', textLink: '#60D8E0',
    accent: '#E09850', accentDark: '#B06830', accentSecondary: '#60D8E0', accentTertiary: '#FFD8A0', accentPositive: '#60B860', accentNegative: '#D06050',
    border: '#3D3220', borderLight: '#2A2418', borderFocus: '#60D8E0', borderWidth: '4px', borderRadius: '2px',
    shadowPanel: '4px 4px 0 0 rgba(224, 152, 80, 0.1)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.4), inset 2px 2px 0 0 rgba(255,255,255,0.05)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.4), inset -2px -2px 0 0 rgba(255,255,255,0.05)',
    surfaceRaised: '#504028', surfaceSunken: '#0E0C08',
    hoverBg: '#E09850', hoverText: '#1A1810', activeBg: '#B06830', activeText: '#FFE8C0', disabledBg: '#2A2418', disabledText: '#786040',
    feedbackSuccess: '#60B860', feedbackWarning: '#E09850', feedbackError: '#D06050', feedbackInfo: '#60D8E0',
    vinylBlack: '#0E0C08', vinylGroove: '#3D3220', vinylLabel: '#60D8E0', vinylShine: '#504028',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'linear-gradient(180deg, #2A2418 0%, #1A1810 50%, #0E0C08 100%)', bgAppOverlay: PatternPresets.warmPaper, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'heavy', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Purple Dream — Deep violet fantasy, calming amethyst
// ═══════════════════════════════════════════════════════════
const purpleDream: ThemeDefinition = {
  id: 'purple-dream',
  labelKey: 'theme.name.purpleDream',
  category: 'artistic',
  descriptionKey: 'theme.desc.purpleDream',
  tokens: {
    bgApp: '#140A1E', bgPanel: '#1E1030', bgPanelLight: '#2A1844', bgElevated: '#382058', bgPanelHover: '#442868',
    textPrimary: '#E8D8F8', textSecondary: '#C0A0E0', textTertiary: '#684878', textInverse: '#140A1E', textLink: '#D080FF',
    accent: '#A060D0', accentDark: '#7038A0', accentSecondary: '#D080FF', accentTertiary: '#F0C0FF', accentPositive: '#70C880', accentNegative: '#E06070',
    border: '#2A1844', borderLight: '#1E1030', borderFocus: '#D080FF', borderWidth: '4px', borderRadius: '4px',
    shadowPanel: '4px 4px 0 0 rgba(160, 96, 208, 0.08)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.35), inset 2px 2px 0 0 rgba(255,255,255,0.06)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.35), inset -2px -2px 0 0 rgba(255,255,255,0.06)',
    surfaceRaised: '#382058', surfaceSunken: '#0A0512',
    hoverBg: '#A060D0', hoverText: '#E8D8F8', activeBg: '#7038A0', activeText: '#E8D8F8', disabledBg: '#1E1030', disabledText: '#684878',
    feedbackSuccess: '#70C880', feedbackWarning: '#D0C060', feedbackError: '#E06070', feedbackInfo: '#D080FF',
    vinylBlack: '#0A0512', vinylGroove: '#2A1844', vinylLabel: '#D080FF', vinylShine: '#382058',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'linear-gradient(180deg, #1E1030 0%, #140A1E 50%, #0A0512 100%)', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'heavy', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Midnight Blue — Dark navy + silver, sophisticated night
// ═══════════════════════════════════════════════════════════
const midnightBlue: ThemeDefinition = {
  id: 'midnight-blue',
  labelKey: 'theme.name.midnightBlue',
  category: 'artistic',
  descriptionKey: 'theme.desc.midnightBlue',
  tokens: {
    bgApp: '#0A1020', bgPanel: '#101830', bgPanelLight: '#182042', bgElevated: '#202854', bgPanelHover: '#283064',
    textPrimary: '#D0D8F0', textSecondary: '#8898C8', textTertiary: '#485878', textInverse: '#0A1020', textLink: '#80B0F0',
    accent: '#4068B0', accentDark: '#284078', accentSecondary: '#80B0F0', accentTertiary: '#C0D8FF', accentPositive: '#50B068', accentNegative: '#D06070',
    border: '#182042', borderLight: '#101830', borderFocus: '#80B0F0', borderWidth: '3px', borderRadius: '3px',
    shadowPanel: '3px 3px 0 0 rgba(64, 104, 176, 0.08)', shadowButton: 'inset -1px -1px 0 0 rgba(0,0,0,0.3), inset 1px 1px 0 0 rgba(255,255,255,0.06)', shadowButtonInset: 'inset 1px 1px 0 0 rgba(0,0,0,0.3), inset -1px -1px 0 0 rgba(255,255,255,0.06)',
    surfaceRaised: '#202854', surfaceSunken: '#060A14',
    hoverBg: '#4068B0', hoverText: '#D0D8F0', activeBg: '#284078', activeText: '#D0D8F0', disabledBg: '#101830', disabledText: '#485878',
    feedbackSuccess: '#50B068', feedbackWarning: '#C0B060', feedbackError: '#D06070', feedbackInfo: '#80B0F0',
    vinylBlack: '#060A14', vinylGroove: '#182042', vinylLabel: '#C0D8FF', vinylShine: '#202854',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'linear-gradient(180deg, #101830 0%, #0A1020 60%, #060A14 100%)', bgAppOverlay: PatternPresets.darkVignette, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Coffee House — Warm latte brown + cream
// ═══════════════════════════════════════════════════════════
const coffeeHouse: ThemeDefinition = {
  id: 'coffee-house',
  labelKey: 'theme.name.coffeeHouse',
  category: 'artistic',
  descriptionKey: 'theme.desc.coffeeHouse',
  tokens: {
    bgApp: '#1E1410', bgPanel: '#2E1E18', bgPanelLight: '#3D2A20', bgElevated: '#4E3528', bgPanelHover: '#5E4030',
    textPrimary: '#F0E0D0', textSecondary: '#C8A888', textTertiary: '#785840', textInverse: '#1E1410', textLink: '#D4A060',
    accent: '#B87848', accentDark: '#885028', accentSecondary: '#D4A060', accentTertiary: '#F0D0A0', accentPositive: '#80B060', accentNegative: '#D05848',
    border: '#3D2A20', borderLight: '#2E1E18', borderFocus: '#D4A060', borderWidth: '4px', borderRadius: '2px',
    shadowPanel: '4px 4px 0 0 rgba(0, 0, 0, 0.5)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.45), inset 2px 2px 0 0 rgba(255,255,255,0.06)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.45), inset -2px -2px 0 0 rgba(255,255,255,0.06)',
    surfaceRaised: '#4E3528', surfaceSunken: '#100A08',
    hoverBg: '#B87848', hoverText: '#F0E0D0', activeBg: '#885028', activeText: '#F0E0D0', disabledBg: '#2E1E18', disabledText: '#785840',
    feedbackSuccess: '#80B060', feedbackWarning: '#D4A060', feedbackError: '#D05848', feedbackInfo: '#D4A060',
    vinylBlack: '#100A08', vinylGroove: '#3D2A20', vinylLabel: '#F0D0A0', vinylShine: '#4E3528',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: PatternPresets.warmPaper, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'heavy', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Autumn Forest — Rich orange/gold/red fall colors
// ═══════════════════════════════════════════════════════════
const autumnForest: ThemeDefinition = {
  id: 'autumn-forest',
  labelKey: 'theme.name.autumnForest',
  category: 'artistic',
  descriptionKey: 'theme.desc.autumnForest',
  tokens: {
    bgApp: '#1A0E08', bgPanel: '#2C180E', bgPanelLight: '#402014', bgElevated: '#542818', bgPanelHover: '#64301C',
    textPrimary: '#FFD8B0', textSecondary: '#E0A050', textTertiary: '#885028', textInverse: '#1A0E08', textLink: '#FFB040',
    accent: '#D06828', accentDark: '#A04018', accentSecondary: '#FFB040', accentTertiary: '#FFD080', accentPositive: '#70A040', accentNegative: '#D04838',
    border: '#402014', borderLight: '#2C180E', borderFocus: '#FFB040', borderWidth: '4px', borderRadius: '2px',
    shadowPanel: '4px 4px 0 0 rgba(208, 104, 40, 0.1)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.4), inset 2px 2px 0 0 rgba(255,255,255,0.05)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.4), inset -2px -2px 0 0 rgba(255,255,255,0.05)',
    surfaceRaised: '#542818', surfaceSunken: '#0E0604',
    hoverBg: '#D06828', hoverText: '#FFD8B0', activeBg: '#A04018', activeText: '#FFD8B0', disabledBg: '#2C180E', disabledText: '#885028',
    feedbackSuccess: '#70A040', feedbackWarning: '#FFB040', feedbackError: '#D04838', feedbackInfo: '#FFB040',
    vinylBlack: '#0E0604', vinylGroove: '#402014', vinylLabel: '#FFD080', vinylShine: '#542818',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'linear-gradient(180deg, #2C180E 0%, #1A0E08 50%, #0E0604 100%)', bgAppOverlay: PatternPresets.darkVignette, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'heavy', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Desert Sand — Warm beige, terracotta, Southwestern warmth
// ═══════════════════════════════════════════════════════════
const desertSand: ThemeDefinition = {
  id: 'desert-sand',
  labelKey: 'theme.name.desertSand',
  category: 'artistic',
  descriptionKey: 'theme.desc.desertSand',
  tokens: {
    bgApp: '#F4E8D0', bgPanel: '#FAF0DC', bgPanelLight: '#FFF8E8', bgElevated: '#FFFFFF', bgPanelHover: '#F6ECD8',
    textPrimary: '#2A1E10', textSecondary: '#604828', textTertiary: '#A88860', textInverse: '#2A1E10', textLink: '#C07030',
    accent: '#D08840', accentDark: '#A06028', accentSecondary: '#E8B860', accentTertiary: '#F0D080', accentPositive: '#60A040', accentNegative: '#C05040',
    border: '#E0D0B8', borderLight: '#FAF0DC', borderFocus: '#D08840', borderWidth: '3px', borderRadius: '3px',
    shadowPanel: '2px 2px 6px rgba(0,0,0,0.06), 0 0 0 1px #E8D8C0', shadowButton: 'inset -1px -1px 0 0 rgba(0,0,0,0.06), inset 1px 1px 0 0 rgba(255,255,255,0.6), 1px 1px 3px rgba(0,0,0,0.08)', shadowButtonInset: 'inset 1px 1px 0 0 rgba(0,0,0,0.06), inset -1px -1px 0 0 rgba(255,255,255,0.6)',
    surfaceRaised: '#FFFFFF', surfaceSunken: '#E8D8C0',
    hoverBg: '#D08840', hoverText: '#FFFFFF', activeBg: '#A06028', activeText: '#FFFFFF', disabledBg: '#FAF0DC', disabledText: '#A88860',
    feedbackSuccess: '#60A040', feedbackWarning: '#E8B860', feedbackError: '#C05040', feedbackInfo: '#D08840',
    vinylBlack: '#E0D0B8', vinylGroove: '#D0C0A8', vinylLabel: '#D08840', vinylShine: '#F4E8D0',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: 'none', bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'false',
  },
}

// ═══════════════════════════════════════════════════════════
// Tropical — Green palm + turquoise, island paradise
// ═══════════════════════════════════════════════════════════
const tropical: ThemeDefinition = {
  id: 'tropical',
  labelKey: 'theme.name.tropical',
  category: 'artistic',
  descriptionKey: 'theme.desc.tropical',
  tokens: {
    bgApp: '#F0F8F0', bgPanel: '#F6FBF4', bgPanelLight: '#FFFFFF', bgElevated: '#FFFFFF', bgPanelHover: '#E8F4E8',
    textPrimary: '#1A2E1A', textSecondary: '#306030', textTertiary: '#80A880', textInverse: '#FFFFFF', textLink: '#2088B0',
    accent: '#40B860', accentDark: '#288040', accentSecondary: '#40D0D0', accentTertiary: '#80F0C0', accentPositive: '#40B860', accentNegative: '#E05050',
    border: '#C8E0C8', borderLight: '#F6FBF4', borderFocus: '#40B860', borderWidth: '3px', borderRadius: '4px',
    shadowPanel: '2px 2px 6px rgba(0,0,0,0.05), 0 0 0 1px #D8E8D8', shadowButton: 'inset -1px -1px 0 0 rgba(0,0,0,0.05), inset 1px 1px 0 0 rgba(255,255,255,0.6), 1px 1px 3px rgba(0,0,0,0.08)', shadowButtonInset: 'inset 1px 1px 0 0 rgba(0,0,0,0.05), inset -1px -1px 0 0 rgba(255,255,255,0.6)',
    surfaceRaised: '#FFFFFF', surfaceSunken: '#D8E8D8',
    hoverBg: '#40B860', hoverText: '#FFFFFF', activeBg: '#288040', activeText: '#FFFFFF', disabledBg: '#F6FBF4', disabledText: '#80A880',
    feedbackSuccess: '#40B860', feedbackWarning: '#C0B040', feedbackError: '#E05050', feedbackInfo: '#40D0D0',
    vinylBlack: '#D0E0D0', vinylGroove: '#B8D0B8', vinylLabel: '#40B860', vinylShine: '#F0F8F0',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: 'none', bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'false',
  },
}

// ═══════════════════════════════════════════════════════════
// Deep Ocean — Navy blue depths, abyssal mystery
// ═══════════════════════════════════════════════════════════
const deepOcean: ThemeDefinition = {
  id: 'deep-ocean',
  labelKey: 'theme.name.deepOcean',
  category: 'artistic',
  descriptionKey: 'theme.desc.deepOcean',
  tokens: {
    bgApp: '#020A14', bgPanel: '#061020', bgPanelLight: '#0A1630', bgElevated: '#0E1C40', bgPanelHover: '#122250',
    textPrimary: '#B0D8F8', textSecondary: '#5898C8', textTertiary: '#184068', textInverse: '#020A14', textLink: '#40D0F0',
    accent: '#1868A0', accentDark: '#104070', accentSecondary: '#40D0F0', accentTertiary: '#80E8FF', accentPositive: '#30A060', accentNegative: '#D04050',
    border: '#0A1630', borderLight: '#061020', borderFocus: '#40D0F0', borderWidth: '3px', borderRadius: '2px',
    shadowPanel: '3px 3px 0 0 rgba(24, 104, 160, 0.06)', shadowButton: 'inset -1px -1px 0 0 rgba(0,0,0,0.4), inset 1px 1px 0 0 rgba(255,255,255,0.04)', shadowButtonInset: 'inset 1px 1px 0 0 rgba(0,0,0,0.4), inset -1px -1px 0 0 rgba(255,255,255,0.04)',
    surfaceRaised: '#0E1C40', surfaceSunken: '#000508',
    hoverBg: '#1868A0', hoverText: '#B0D8F8', activeBg: '#104070', activeText: '#B0D8F8', disabledBg: '#061020', disabledText: '#184068',
    feedbackSuccess: '#30A060', feedbackWarning: '#A0A040', feedbackError: '#D04050', feedbackInfo: '#40D0F0',
    vinylBlack: '#000508', vinylGroove: '#0A1630', vinylLabel: '#40D0F0', vinylShine: '#0E1C40',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'linear-gradient(180deg, #061020 0%, #020A14 60%, #000508 100%)', bgAppOverlay: PatternPresets.darkVignette, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Emerald Forest — Rich jewel greens, magical woodland
// ═══════════════════════════════════════════════════════════
const emeraldForest: ThemeDefinition = {
  id: 'emerald-forest',
  labelKey: 'theme.name.emeraldForest',
  category: 'artistic',
  descriptionKey: 'theme.desc.emeraldForest',
  tokens: {
    bgApp: '#081408', bgPanel: '#102010', bgPanelLight: '#182E18', bgElevated: '#203C20', bgPanelHover: '#284A28',
    textPrimary: '#C0E8B0', textSecondary: '#70B058', textTertiary: '#306028', textInverse: '#081408', textLink: '#80E040',
    accent: '#40A028', accentDark: '#287018', accentSecondary: '#80E040', accentTertiary: '#B0FF80', accentPositive: '#40A028', accentNegative: '#D05050',
    border: '#182E18', borderLight: '#102010', borderFocus: '#80E040', borderWidth: '4px', borderRadius: '0',
    shadowPanel: '4px 4px 0 0 rgba(64, 160, 40, 0.06)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.4), inset 2px 2px 0 0 rgba(255,255,255,0.04)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.4), inset -2px -2px 0 0 rgba(255,255,255,0.04)',
    surfaceRaised: '#203C20', surfaceSunken: '#040A04',
    hoverBg: '#40A028', hoverText: '#C0E8B0', activeBg: '#287018', activeText: '#C0E8B0', disabledBg: '#102010', disabledText: '#306028',
    feedbackSuccess: '#40A028', feedbackWarning: '#A0A030', feedbackError: '#D05050', feedbackInfo: '#80E040',
    vinylBlack: '#040A04', vinylGroove: '#182E18', vinylLabel: '#80E040', vinylShine: '#203C20',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: PatternPresets.lcdGrid, bgAppOverlay: PatternPresets.darkVignette, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'heavy', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Cherry Blossom — Soft pink + white, spring petals
// ═══════════════════════════════════════════════════════════
const cherryBlossom: ThemeDefinition = {
  id: 'cherry-blossom',
  labelKey: 'theme.name.cherryBlossom',
  category: 'artistic',
  descriptionKey: 'theme.desc.cherryBlossom',
  tokens: {
    bgApp: '#FCF4F8', bgPanel: '#FFF8FC', bgPanelLight: '#FFFFFF', bgElevated: '#FFFFFF', bgPanelHover: '#FDF0F4',
    textPrimary: '#2A1820', textSecondary: '#604050', textTertiary: '#C098A8', textInverse: '#FFFFFF', textLink: '#E06088',
    accent: '#E87898', accentDark: '#C04868', accentSecondary: '#F0A8C0', accentTertiary: '#F8D0E0', accentPositive: '#70B860', accentNegative: '#D85060',
    border: '#F0D8E0', borderLight: '#FFF8FC', borderFocus: '#E87898', borderWidth: '3px', borderRadius: '5px',
    shadowPanel: '2px 2px 6px rgba(232,120,152,0.08), 0 0 0 1px #F4E0E8', shadowButton: 'inset -1px -1px 0 0 rgba(0,0,0,0.04), inset 1px 1px 0 0 rgba(255,255,255,0.6), 1px 1px 3px rgba(0,0,0,0.08)', shadowButtonInset: 'inset 1px 1px 0 0 rgba(0,0,0,0.04), inset -1px -1px 0 0 rgba(255,255,255,0.6)',
    surfaceRaised: '#FFFFFF', surfaceSunken: '#F4E0E8',
    hoverBg: '#E87898', hoverText: '#FFFFFF', activeBg: '#C04868', activeText: '#FFFFFF', disabledBg: '#FFF8FC', disabledText: '#C098A8',
    feedbackSuccess: '#70B860', feedbackWarning: '#D0B860', feedbackError: '#D85060', feedbackInfo: '#E87898',
    vinylBlack: '#F0DCE4', vinylGroove: '#E0C8D0', vinylLabel: '#E87898', vinylShine: '#FCF4F8',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: 'none', bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'false',
  },
}

// ═══════════════════════════════════════════════════════════
// Halloween — Orange + purple, spooky festive
// ═══════════════════════════════════════════════════════════
const halloween: ThemeDefinition = {
  id: 'halloween',
  labelKey: 'theme.name.halloween',
  category: 'artistic',
  descriptionKey: 'theme.desc.halloween',
  tokens: {
    bgApp: '#0E0810', bgPanel: '#1C1020', bgPanelLight: '#2A1830', bgElevated: '#382040', bgPanelHover: '#462850',
    textPrimary: '#FFD880', textSecondary: '#E0A040', textTertiary: '#784828', textInverse: '#0E0810', textLink: '#FFA040',
    accent: '#FF7030', accentDark: '#C04018', accentSecondary: '#C040D0', accentTertiary: '#FFC060', accentPositive: '#60B040', accentNegative: '#E04040',
    border: '#2A1830', borderLight: '#1C1020', borderFocus: '#FFA040', borderWidth: '4px', borderRadius: '2px',
    shadowPanel: '4px 4px 0 0 rgba(255, 112, 48, 0.08)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.45), inset 2px 2px 0 0 rgba(255,255,255,0.06)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.45), inset -2px -2px 0 0 rgba(255,255,255,0.06)',
    surfaceRaised: '#382040', surfaceSunken: '#060408',
    hoverBg: '#FF7030', hoverText: '#0E0810', activeBg: '#C040D0', activeText: '#FFD880', disabledBg: '#1C1020', disabledText: '#784828',
    feedbackSuccess: '#60B040', feedbackWarning: '#FFC060', feedbackError: '#E04040', feedbackInfo: '#FFA040',
    vinylBlack: '#060408', vinylGroove: '#2A1830', vinylLabel: '#FF7030', vinylShine: '#382040',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'linear-gradient(180deg, #1C1020 0%, #0E0810 50%, #060408 100%)', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'heavy', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Christmas — Festive red + green, holiday cheer
// ═══════════════════════════════════════════════════════════
const christmas: ThemeDefinition = {
  id: 'christmas',
  labelKey: 'theme.name.christmas',
  category: 'artistic',
  descriptionKey: 'theme.desc.christmas',
  tokens: {
    bgApp: '#0A1A0A', bgPanel: '#142E14', bgPanelLight: '#1E421E', bgElevated: '#285428', bgPanelHover: '#326432',
    textPrimary: '#FFF8F0', textSecondary: '#C8E8C0', textTertiary: '#487048', textInverse: '#0A1A0A', textLink: '#FFD040',
    accent: '#D03030', accentDark: '#A01818', accentSecondary: '#30A030', accentTertiary: '#FFD040', accentPositive: '#30A030', accentNegative: '#D03030',
    border: '#1E421E', borderLight: '#142E14', borderFocus: '#FFD040', borderWidth: '4px', borderRadius: '2px',
    shadowPanel: '4px 4px 0 0 rgba(208, 48, 48, 0.06)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.4), inset 2px 2px 0 0 rgba(255,255,255,0.06)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.4), inset -2px -2px 0 0 rgba(255,255,255,0.06)',
    surfaceRaised: '#285428', surfaceSunken: '#040C04',
    hoverBg: '#D03030', hoverText: '#FFF8F0', activeBg: '#30A030', activeText: '#FFF8F0', disabledBg: '#142E14', disabledText: '#487048',
    feedbackSuccess: '#30A030', feedbackWarning: '#FFD040', feedbackError: '#D03030', feedbackInfo: '#FFD040',
    vinylBlack: '#040C04', vinylGroove: '#1E421E', vinylLabel: '#FFD040', vinylShine: '#285428',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'linear-gradient(180deg, #142E14 0%, #0A1A0A 50%, #040C04 100%)', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'heavy', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Valentine — Romantic pink + rose, hearts everywhere
// ═══════════════════════════════════════════════════════════
const valentine: ThemeDefinition = {
  id: 'valentine',
  labelKey: 'theme.name.valentine',
  category: 'artistic',
  descriptionKey: 'theme.desc.valentine',
  tokens: {
    bgApp: '#FDF0F2', bgPanel: '#FFF4F6', bgPanelLight: '#FFFFFF', bgElevated: '#FFFFFF', bgPanelHover: '#FFECF0',
    textPrimary: '#2A1820', textSecondary: '#604050', textTertiary: '#D090A0', textInverse: '#FFFFFF', textLink: '#E04070',
    accent: '#E06088', accentDark: '#C03058', accentSecondary: '#F080A8', accentTertiary: '#F8C0D0', accentPositive: '#70B860', accentNegative: '#D84050',
    border: '#F0D0D8', borderLight: '#FFF4F6', borderFocus: '#E06088', borderWidth: '3px', borderRadius: '5px',
    shadowPanel: '2px 2px 6px rgba(224,96,136,0.08), 0 0 0 1px #F4D8E0', shadowButton: 'inset -1px -1px 0 0 rgba(0,0,0,0.04), inset 1px 1px 0 0 rgba(255,255,255,0.6), 1px 1px 3px rgba(0,0,0,0.08)', shadowButtonInset: 'inset 1px 1px 0 0 rgba(0,0,0,0.04), inset -1px -1px 0 0 rgba(255,255,255,0.6)',
    surfaceRaised: '#FFFFFF', surfaceSunken: '#F4D8E0',
    hoverBg: '#E06088', hoverText: '#FFFFFF', activeBg: '#C03058', activeText: '#FFFFFF', disabledBg: '#FFF4F6', disabledText: '#D090A0',
    feedbackSuccess: '#70B860', feedbackWarning: '#D0B860', feedbackError: '#D84050', feedbackInfo: '#E06088',
    vinylBlack: '#F0D0D8', vinylGroove: '#E0BCC4', vinylLabel: '#E06088', vinylShine: '#FDF0F2',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: 'none', bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'false',
  },
}

export const artistic: ThemeDefinition[] = [
  vaporwave, synthwave,
  tokyoNight, dracula, nord, catppuccin, gruvbox, solarizedDark,
  moonlight, aurora, galaxy, space, neonCity, cyberpunk2077,
  sunsetBeach, purpleDream, midnightBlue, coffeeHouse,
  autumnForest, desertSand, tropical, deepOcean,
  emeraldForest, cherryBlossom, halloween, christmas, valentine,
]
