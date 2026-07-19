/**
 * CRT & Terminal themes:
 * CRT Green, CRT Amber, Matrix,
 * Blue CRT, Monochrome, Hacker Black, Hacker Blue
 */
import type { ThemeDefinition } from '../types'
import { PatternPresets, scanlineCss, combineBackgrounds } from '../patterns'

// ═══════════════════════════════════════════════════════════
// CRT Terminal Green — Classic green phosphor monitor
// ═══════════════════════════════════════════════════════════
const crtGreen: ThemeDefinition = {
  id: 'crt-green',
  labelKey: 'theme.name.crtGreen',
  category: 'crt-terminal',
  descriptionKey: 'theme.desc.crtGreen',
  tokens: {
    bgApp: '#0A0A05', bgPanel: '#0F0F08', bgPanelLight: '#14140A', bgElevated: '#1A1A0C', bgPanelHover: '#202010',
    textPrimary: '#33FF33', textSecondary: '#22CC22', textTertiary: '#0F550F', textInverse: '#0A0A05', textLink: '#66FF66',
    accent: '#33FF33', accentDark: '#0F660F', accentSecondary: '#66FF66', accentTertiary: '#AAFFAA', accentPositive: '#33FF33', accentNegative: '#FF3333',
    border: '#0F550F', borderLight: '#0A2A0A', borderFocus: '#66FF66', borderWidth: '2px', borderRadius: '0',
    shadowPanel: '0 0 10px rgba(51,255,51,0.08), 2px 2px 0 0 rgba(0,0,0,0.8)', shadowButton: 'inset 0 0 4px rgba(51,255,51,0.1), 1px 1px 0 0 rgba(0,0,0,0.6)', shadowButtonInset: 'inset 1px 1px 0 0 rgba(0,0,0,0.6), inset 0 0 4px rgba(51,255,51,0.05)',
    surfaceRaised: '#1A1A0C', surfaceSunken: '#050502',
    hoverBg: '#1A3A0A', hoverText: '#66FF66', activeBg: '#33FF33', activeText: '#0A0A05', disabledBg: '#0F0F08', disabledText: '#0F550F',
    feedbackSuccess: '#33FF33', feedbackWarning: '#AAAA33', feedbackError: '#FF3333', feedbackInfo: '#66FF66',
    vinylBlack: '#0A0A05', vinylGroove: '#0F550F', vinylLabel: '#33FF33', vinylShine: '#1A3A0A',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: PatternPresets.crt(0.07), bgAppOverlay: 'none', bgAppNoise: '0', bgAppScanlines: '1',
    borderWeight: 'light', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// CRT Amber — Warm amber/orange phosphor monitor
// ═══════════════════════════════════════════════════════════
const crtAmber: ThemeDefinition = {
  id: 'crt-amber',
  labelKey: 'theme.name.crtAmber',
  category: 'crt-terminal',
  descriptionKey: 'theme.desc.crtAmber',
  tokens: {
    bgApp: '#0A0800', bgPanel: '#100E02', bgPanelLight: '#161408', bgElevated: '#1C1A0C', bgPanelHover: '#222010',
    textPrimary: '#FFB000', textSecondary: '#CC8800', textTertiary: '#664400', textInverse: '#0A0800', textLink: '#FFD050',
    accent: '#FFB000', accentDark: '#996600', accentSecondary: '#FFCC33', accentTertiary: '#FFE088', accentPositive: '#FFB000', accentNegative: '#FF4422',
    border: '#664400', borderLight: '#332200', borderFocus: '#FFD050', borderWidth: '2px', borderRadius: '0',
    shadowPanel: '0 0 12px rgba(255,176,0,0.06), 2px 2px 0 0 rgba(0,0,0,0.8)', shadowButton: 'inset 0 0 4px rgba(255,176,0,0.1), 1px 1px 0 0 rgba(0,0,0,0.6)', shadowButtonInset: 'inset 1px 1px 0 0 rgba(0,0,0,0.6), inset 0 0 4px rgba(255,176,0,0.05)',
    surfaceRaised: '#1C1A0C', surfaceSunken: '#050400',
    hoverBg: '#332200', hoverText: '#FFD050', activeBg: '#FFB000', activeText: '#0A0800', disabledBg: '#100E02', disabledText: '#664400',
    feedbackSuccess: '#FFB000', feedbackWarning: '#FF8800', feedbackError: '#FF4422', feedbackInfo: '#FFD050',
    vinylBlack: '#0A0800', vinylGroove: '#664400', vinylLabel: '#FFB000', vinylShine: '#332200',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: PatternPresets.crt(0.06), bgAppOverlay: 'none', bgAppNoise: '0', bgAppScanlines: '1',
    borderWeight: 'light', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Blue CRT — Cool blue phosphor display, IBM mainframe style
// ═══════════════════════════════════════════════════════════
const blueCrt: ThemeDefinition = {
  id: 'blue-crt',
  labelKey: 'theme.name.blueCrt',
  category: 'crt-terminal',
  descriptionKey: 'theme.desc.blueCrt',
  tokens: {
    bgApp: '#000308', bgPanel: '#020510', bgPanelLight: '#050A18', bgElevated: '#080E20', bgPanelHover: '#0A1228',
    textPrimary: '#5090FF', textSecondary: '#3068D0', textTertiary: '#103068', textInverse: '#000308', textLink: '#80B0FF',
    accent: '#4080F0', accentDark: '#1850B0', accentSecondary: '#80B0FF', accentTertiary: '#B0D0FF', accentPositive: '#4080F0', accentNegative: '#FF4040',
    border: '#103068', borderLight: '#051028', borderFocus: '#80B0FF', borderWidth: '2px', borderRadius: '0',
    shadowPanel: '0 0 10px rgba(64,128,240,0.06), 2px 2px 0 0 rgba(0,0,0,0.8)', shadowButton: 'inset 0 0 4px rgba(64,128,240,0.08), 1px 1px 0 0 rgba(0,0,0,0.6)', shadowButtonInset: 'inset 1px 1px 0 0 rgba(0,0,0,0.6), inset 0 0 4px rgba(64,128,240,0.04)',
    surfaceRaised: '#080E20', surfaceSunken: '#000104',
    hoverBg: '#183068', hoverText: '#80B0FF', activeBg: '#4080F0', activeText: '#000308', disabledBg: '#020510', disabledText: '#103068',
    feedbackSuccess: '#4080F0', feedbackWarning: '#A0A040', feedbackError: '#FF4040', feedbackInfo: '#80B0FF',
    vinylBlack: '#000308', vinylGroove: '#103068', vinylLabel: '#4080F0', vinylShine: '#183068',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: PatternPresets.crt(0.06), bgAppOverlay: 'none', bgAppNoise: '0', bgAppScanlines: '1',
    borderWeight: 'light', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Monochrome — White phosphor on black, classic terminal
// ═══════════════════════════════════════════════════════════
const monochrome: ThemeDefinition = {
  id: 'monochrome',
  labelKey: 'theme.name.monochrome',
  category: 'crt-terminal',
  descriptionKey: 'theme.desc.monochrome',
  tokens: {
    bgApp: '#060606', bgPanel: '#0A0A0A', bgPanelLight: '#101010', bgElevated: '#161616', bgPanelHover: '#1C1C1C',
    textPrimary: '#E8E8E8', textSecondary: '#A8A8A8', textTertiary: '#484848', textInverse: '#060606', textLink: '#FFFFFF',
    accent: '#D0D0D0', accentDark: '#808080', accentSecondary: '#E8E8E8', accentTertiary: '#FFFFFF', accentPositive: '#D0D0D0', accentNegative: '#FF6060',
    border: '#303030', borderLight: '#181818', borderFocus: '#FFFFFF', borderWidth: '2px', borderRadius: '0',
    shadowPanel: '0 0 8px rgba(208,208,208,0.04), 2px 2px 0 0 rgba(0,0,0,0.8)', shadowButton: 'inset 0 0 3px rgba(208,208,208,0.06), 1px 1px 0 0 rgba(0,0,0,0.6)', shadowButtonInset: 'inset 1px 1px 0 0 rgba(0,0,0,0.6), inset 0 0 3px rgba(208,208,208,0.03)',
    surfaceRaised: '#161616', surfaceSunken: '#020202',
    hoverBg: '#303030', hoverText: '#E8E8E8', activeBg: '#D0D0D0', activeText: '#060606', disabledBg: '#0A0A0A', disabledText: '#484848',
    feedbackSuccess: '#D0D0D0', feedbackWarning: '#CCCC44', feedbackError: '#FF6060', feedbackInfo: '#E8E8E8',
    vinylBlack: '#060606', vinylGroove: '#202020', vinylLabel: '#D0D0D0', vinylShine: '#161616',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: PatternPresets.crt(0.05), bgAppOverlay: 'none', bgAppNoise: '0', bgAppScanlines: '1',
    borderWeight: 'light', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Matrix — Green rain hacker terminal
// ═══════════════════════════════════════════════════════════
const matrix: ThemeDefinition = {
  id: 'matrix',
  labelKey: 'theme.name.matrix',
  category: 'crt-terminal',
  descriptionKey: 'theme.desc.matrix',
  tokens: {
    bgApp: '#000800', bgPanel: '#001A00', bgPanelLight: '#002200', bgElevated: '#003300', bgPanelHover: '#004400',
    textPrimary: '#00FF41', textSecondary: '#00CC33', textTertiary: '#005500', textInverse: '#000800', textLink: '#66FF88',
    accent: '#00FF41', accentDark: '#009922', accentSecondary: '#44FF66', accentTertiary: '#AAFFBB', accentPositive: '#00FF41', accentNegative: '#FF2244',
    border: '#003300', borderLight: '#001A00', borderFocus: '#44FF66', borderWidth: '2px', borderRadius: '0',
    shadowPanel: '0 0 8px rgba(0,255,65,0.06), 2px 2px 0 0 rgba(0,0,0,0.8)', shadowButton: 'inset 0 0 3px rgba(0,255,65,0.08), 1px 1px 0 0 rgba(0,0,0,0.6)', shadowButtonInset: 'inset 1px 1px 0 0 rgba(0,0,0,0.6), inset 0 0 3px rgba(0,255,65,0.04)',
    surfaceRaised: '#003300', surfaceSunken: '#000400',
    hoverBg: '#003300', hoverText: '#44FF66', activeBg: '#00FF41', activeText: '#000800', disabledBg: '#001A00', disabledText: '#005500',
    feedbackSuccess: '#00FF41', feedbackWarning: '#88FF00', feedbackError: '#FF2244', feedbackInfo: '#44FF66',
    vinylBlack: '#000800', vinylGroove: '#003300', vinylLabel: '#00FF41', vinylShine: '#002200',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: combineBackgrounds(scanlineCss(0.06), PatternPresets.lcdGrid), bgAppOverlay: 'none', bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Hacker Black — Pure dark terminal, green accent, kali linux
// ═══════════════════════════════════════════════════════════
const hackerBlack: ThemeDefinition = {
  id: 'hacker-black',
  labelKey: 'theme.name.hackerBlack',
  category: 'crt-terminal',
  descriptionKey: 'theme.desc.hackerBlack',
  tokens: {
    bgApp: '#080808', bgPanel: '#0E0E0E', bgPanelLight: '#141414', bgElevated: '#1A1A1A', bgPanelHover: '#202020',
    textPrimary: '#C0FFC0', textSecondary: '#80C080', textTertiary: '#284828', textInverse: '#080808', textLink: '#60FF60',
    accent: '#20C020', accentDark: '#108010', accentSecondary: '#60FF60', accentTertiary: '#A0FFA0', accentPositive: '#20C020', accentNegative: '#E04040',
    border: '#1A3A1A', borderLight: '#0E1A0E', borderFocus: '#60FF60', borderWidth: '2px', borderRadius: '0',
    shadowPanel: '0 0 6px rgba(32,192,32,0.04), 2px 2px 0 0 rgba(0,0,0,0.8)', shadowButton: 'inset -1px -1px 0 0 rgba(0,0,0,0.6), inset 1px 1px 0 0 rgba(32,192,32,0.06), 1px 1px 0 0 rgba(0,0,0,0.5)', shadowButtonInset: 'inset 1px 1px 0 0 rgba(0,0,0,0.6), inset -1px -1px 0 0 rgba(32,192,32,0.03)',
    surfaceRaised: '#1A1A1A', surfaceSunken: '#040404',
    hoverBg: '#1A3A1A', hoverText: '#60FF60', activeBg: '#20C020', activeText: '#080808', disabledBg: '#0E0E0E', disabledText: '#284828',
    feedbackSuccess: '#20C020', feedbackWarning: '#A0A020', feedbackError: '#E04040', feedbackInfo: '#60FF60',
    vinylBlack: '#040404', vinylGroove: '#1A1A1A', vinylLabel: '#20C020', vinylShine: '#141414',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: scanlineCss(0.04, 2), bgAppOverlay: 'none', bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Hacker Blue — Deep blue terminal, cyberpunk hacking
// ═══════════════════════════════════════════════════════════
const hackerBlue: ThemeDefinition = {
  id: 'hacker-blue',
  labelKey: 'theme.name.hackerBlue',
  category: 'crt-terminal',
  descriptionKey: 'theme.desc.hackerBlue',
  tokens: {
    bgApp: '#020810', bgPanel: '#060E18', bgPanelLight: '#0A1420', bgElevated: '#0E1A28', bgPanelHover: '#122030',
    textPrimary: '#80D0F0', textSecondary: '#5098C0', textTertiary: '#184060', textInverse: '#020810', textLink: '#A0E8FF',
    accent: '#2088C0', accentDark: '#105880', accentSecondary: '#A0E8FF', accentTertiary: '#D0F0FF', accentPositive: '#30C060', accentNegative: '#E04050',
    border: '#0E2440', borderLight: '#081830', borderFocus: '#A0E8FF', borderWidth: '2px', borderRadius: '0',
    shadowPanel: '0 0 8px rgba(32,136,192,0.05), 2px 2px 0 0 rgba(0,0,0,0.8)', shadowButton: 'inset -1px -1px 0 0 rgba(0,0,0,0.6), inset 1px 1px 0 0 rgba(32,136,192,0.08), 1px 1px 0 0 rgba(0,0,0,0.5)', shadowButtonInset: 'inset 1px 1px 0 0 rgba(0,0,0,0.6), inset -1px -1px 0 0 rgba(32,136,192,0.04)',
    surfaceRaised: '#0E1A28', surfaceSunken: '#000408',
    hoverBg: '#0E2440', hoverText: '#A0E8FF', activeBg: '#2088C0', activeText: '#020810', disabledBg: '#060E18', disabledText: '#184060',
    feedbackSuccess: '#30C060', feedbackWarning: '#A0A040', feedbackError: '#E04050', feedbackInfo: '#A0E8FF',
    vinylBlack: '#000408', vinylGroove: '#0E2440', vinylLabel: '#2088C0', vinylShine: '#0E1A28',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: scanlineCss(0.04, 2), bgAppOverlay: 'none', bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'true',
  },
}

export const crtTerminal: ThemeDefinition[] = [crtGreen, crtAmber, blueCrt, monochrome, matrix, hackerBlack, hackerBlue]
