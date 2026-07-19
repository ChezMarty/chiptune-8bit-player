/**
 * Classic Console themes:
 * NES, Game Boy, Game Boy Color, SNES, Sega Genesis,
 * Nintendo 64, PlayStation, PlayStation 2, Xbox, Dreamcast, Arcade
 */
import type { ThemeDefinition } from '../types'
import { PatternPresets } from '../patterns'

// ═══════════════════════════════════════════════════════════
// NES — Refined Nintendo Entertainment System
// ═══════════════════════════════════════════════════════════
const nes: ThemeDefinition = {
  id: 'nes',
  labelKey: 'theme.name.nes',
  category: 'classic-consoles',
  descriptionKey: 'theme.desc.nes',
  tokens: {
    bgApp: '#0D0D1A', bgPanel: '#1A1A2E', bgPanelLight: '#252544', bgElevated: '#2E2E50', bgPanelHover: '#35355A',
    textPrimary: '#F0EDE5', textSecondary: '#8B8FA4', textTertiary: '#4A4E65', textInverse: '#0D0D1A', textLink: '#4EE2EC',
    accent: '#E52521', accentDark: '#8C1410', accentSecondary: '#4EE2EC', accentTertiary: '#F1B94C', accentPositive: '#58D68D', accentNegative: '#E52521',
    border: '#2A2A4A', borderLight: '#1F1F3A', borderFocus: '#4EE2EC', borderWidth: '4px', borderRadius: '0',
    shadowPanel: '4px 4px 0 0 rgba(0, 0, 0, 0.45)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.4), inset 2px 2px 0 0 rgba(255,255,255,0.06)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.4), inset -2px -2px 0 0 rgba(255,255,255,0.06)',
    surfaceRaised: '#2E2E50', surfaceSunken: '#0D0D1A',
    hoverBg: '#4EE2EC', hoverText: '#0D0D1A', activeBg: '#F1B94C', activeText: '#0D0D1A', disabledBg: '#1A1A2E', disabledText: '#4A4E65',
    feedbackSuccess: '#58D68D', feedbackWarning: '#F1B94C', feedbackError: '#E52521', feedbackInfo: '#4EE2EC',
    vinylBlack: '#141414', vinylGroove: '#2A2A2A', vinylLabel: '#F1B94C', vinylShine: '#5A4A2A',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'heavy', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Game Boy
// ═══════════════════════════════════════════════════════════
const gameboy: ThemeDefinition = {
  id: 'gameboy',
  labelKey: 'theme.name.gameboy',
  category: 'classic-consoles',
  descriptionKey: 'theme.desc.gameboy',
  tokens: {
    bgApp: '#0F380F', bgPanel: '#1A4A1A', bgPanelLight: '#306230', bgElevated: '#3A7A3A', bgPanelHover: '#458845',
    textPrimary: '#9BBC0F', textSecondary: '#8BAC0F', textTertiary: '#306230', textInverse: '#0F380F', textLink: '#9BBC0F',
    accent: '#8BAC0F', accentDark: '#306230', accentSecondary: '#9BBC0F', accentTertiary: '#9BBC0F', accentPositive: '#9BBC0F', accentNegative: '#8B6914',
    border: '#306230', borderLight: '#1A4A1A', borderFocus: '#9BBC0F', borderWidth: '3px', borderRadius: '0',
    shadowPanel: '3px 3px 0 0 rgba(0, 0, 0, 0.5)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.4), inset 2px 2px 0 0 rgba(255,255,255,0.04)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.4), inset -2px -2px 0 0 rgba(255,255,255,0.04)',
    surfaceRaised: '#3A7A3A', surfaceSunken: '#0A2A0A',
    hoverBg: '#9BBC0F', hoverText: '#0F380F', activeBg: '#8BAC0F', activeText: '#0F380F', disabledBg: '#1A4A1A', disabledText: '#306230',
    feedbackSuccess: '#9BBC0F', feedbackWarning: '#8B6914', feedbackError: '#8B6914', feedbackInfo: '#8BAC0F',
    vinylBlack: '#0A2A0A', vinylGroove: '#306230', vinylLabel: '#8BAC0F', vinylShine: '#4A7A2A',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: PatternPresets.lcdGrid, bgAppOverlay: 'none', bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Game Boy Color — Vibrant translucent purple/teal shell
// ═══════════════════════════════════════════════════════════
const gameboyColor: ThemeDefinition = {
  id: 'gameboy-color',
  labelKey: 'theme.name.gbc',
  category: 'classic-consoles',
  descriptionKey: 'theme.desc.gbc',
  tokens: {
    bgApp: '#1A0A2E', bgPanel: '#2A103E', bgPanelLight: '#3D1858', bgElevated: '#4E2268', bgPanelHover: '#5E2C78',
    textPrimary: '#E8D8F0', textSecondary: '#B080D0', textTertiary: '#684878', textInverse: '#1A0A2E', textLink: '#78D0FF',
    accent: '#C060E0', accentDark: '#8030A0', accentSecondary: '#78D0FF', accentTertiary: '#FFD060', accentPositive: '#60D080', accentNegative: '#E06070',
    border: '#3D1858', borderLight: '#2A103E', borderFocus: '#78D0FF', borderWidth: '3px', borderRadius: '2px',
    shadowPanel: '3px 3px 0 0 rgba(0, 0, 0, 0.5)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.35), inset 2px 2px 0 0 rgba(255,255,255,0.06)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.35), inset -2px -2px 0 0 rgba(255,255,255,0.06)',
    surfaceRaised: '#4E2268', surfaceSunken: '#100520',
    hoverBg: '#C060E0', hoverText: '#1A0A2E', activeBg: '#8030A0', activeText: '#E8D8F0', disabledBg: '#2A103E', disabledText: '#684878',
    feedbackSuccess: '#60D080', feedbackWarning: '#FFD060', feedbackError: '#E06070', feedbackInfo: '#78D0FF',
    vinylBlack: '#100520', vinylGroove: '#3D1858', vinylLabel: '#FFD060', vinylShine: '#4E2268',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'linear-gradient(180deg, #2A103E 0%, #1A0A2E 50%, #100520 100%)', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// SNES
// ═══════════════════════════════════════════════════════════
const snes: ThemeDefinition = {
  id: 'snes',
  labelKey: 'theme.name.snes',
  category: 'classic-consoles',
  descriptionKey: 'theme.desc.snes',
  tokens: {
    bgApp: '#1A1225', bgPanel: '#2A1F3D', bgPanelLight: '#3D2D5C', bgElevated: '#4A376B', bgPanelHover: '#55407A',
    textPrimary: '#E8E0F0', textSecondary: '#9B8FB5', textTertiary: '#5A4B78', textInverse: '#1A1225', textLink: '#8EB8FF',
    accent: '#8B6FC0', accentDark: '#5A3E8A', accentSecondary: '#6FC0F0', accentTertiary: '#C0B060', accentPositive: '#60C080', accentNegative: '#C06060',
    border: '#3D2D5C', borderLight: '#2A1F3D', borderFocus: '#8EB8FF', borderWidth: '4px', borderRadius: '2px',
    shadowPanel: '4px 4px 0 0 rgba(0, 0, 0, 0.5)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.35), inset 2px 2px 0 0 rgba(255,255,255,0.08)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.35), inset -2px -2px 0 0 rgba(255,255,255,0.08)',
    surfaceRaised: '#4A376B', surfaceSunken: '#130C1F',
    hoverBg: '#8EB8FF', hoverText: '#1A1225', activeBg: '#C0B060', activeText: '#1A1225', disabledBg: '#2A1F3D', disabledText: '#5A4B78',
    feedbackSuccess: '#60C080', feedbackWarning: '#C0B060', feedbackError: '#C06060', feedbackInfo: '#6FC0F0',
    vinylBlack: '#1A0F25', vinylGroove: '#3D2D5C', vinylLabel: '#C0B060', vinylShine: '#5A4080',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'heavy', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Sega Genesis
// ═══════════════════════════════════════════════════════════
const segaGenesis: ThemeDefinition = {
  id: 'sega-genesis',
  labelKey: 'theme.name.segaGenesis',
  category: 'classic-consoles',
  descriptionKey: 'theme.desc.segaGenesis',
  tokens: {
    bgApp: '#0A0F14', bgPanel: '#131B24', bgPanelLight: '#1C2836', bgElevated: '#253548', bgPanelHover: '#2E4056',
    textPrimary: '#E0E8F0', textSecondary: '#7B8FA5', textTertiary: '#3D5068', textInverse: '#0A0F14', textLink: '#4DA6FF',
    accent: '#0066CC', accentDark: '#003D7A', accentSecondary: '#4DA6FF', accentTertiary: '#D4AF37', accentPositive: '#00CC66', accentNegative: '#CC3333',
    border: '#1C2836', borderLight: '#131B24', borderFocus: '#4DA6FF', borderWidth: '3px', borderRadius: '0',
    shadowPanel: '3px 3px 0 0 rgba(0, 0, 0, 0.5)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.5), inset 2px 2px 0 0 rgba(255,255,255,0.05)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.5), inset -2px -2px 0 0 rgba(255,255,255,0.05)',
    surfaceRaised: '#253548', surfaceSunken: '#060A10',
    hoverBg: '#0066CC', hoverText: '#E0E8F0', activeBg: '#003D7A', activeText: '#E0E8F0', disabledBg: '#131B24', disabledText: '#3D5068',
    feedbackSuccess: '#00CC66', feedbackWarning: '#D4AF37', feedbackError: '#CC3333', feedbackInfo: '#4DA6FF',
    vinylBlack: '#050A10', vinylGroove: '#1C2836', vinylLabel: '#D4AF37', vinylShine: '#203040',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: PatternPresets.techStripes, bgAppOverlay: 'none', bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Nintendo 64 — Dark charcoal with N64 logo color accents
// ═══════════════════════════════════════════════════════════
const nintendo64: ThemeDefinition = {
  id: 'nintendo-64',
  labelKey: 'theme.name.n64',
  category: 'classic-consoles',
  descriptionKey: 'theme.desc.n64',
  tokens: {
    bgApp: '#181818', bgPanel: '#242424', bgPanelLight: '#303030', bgElevated: '#3C3C3C', bgPanelHover: '#484848',
    textPrimary: '#E8E8E0', textSecondary: '#A0A0A0', textTertiary: '#585858', textInverse: '#181818', textLink: '#50B0FF',
    accent: '#5050C0', accentDark: '#303080', accentSecondary: '#50B0FF', accentTertiary: '#FFC040', accentPositive: '#40C040', accentNegative: '#E04040',
    border: '#303030', borderLight: '#242424', borderFocus: '#50B0FF', borderWidth: '4px', borderRadius: '0',
    shadowPanel: '4px 4px 0 0 rgba(0, 0, 0, 0.55)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.45), inset 2px 2px 0 0 rgba(255,255,255,0.05)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.45), inset -2px -2px 0 0 rgba(255,255,255,0.05)',
    surfaceRaised: '#3C3C3C', surfaceSunken: '#0E0E0E',
    hoverBg: '#5050C0', hoverText: '#E8E8E0', activeBg: '#303080', activeText: '#E8E8E0', disabledBg: '#242424', disabledText: '#585858',
    feedbackSuccess: '#40C040', feedbackWarning: '#FFC040', feedbackError: '#E04040', feedbackInfo: '#50B0FF',
    vinylBlack: '#0E0E0E', vinylGroove: '#303030', vinylLabel: '#FFC040', vinylShine: '#3C3C3C',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'heavy', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// PlayStation — Classic grey with colored logo accents
// ═══════════════════════════════════════════════════════════
const playstation: ThemeDefinition = {
  id: 'playstation',
  labelKey: 'theme.name.ps1',
  category: 'classic-consoles',
  descriptionKey: 'theme.desc.ps1',
  tokens: {
    bgApp: '#1A1A1C', bgPanel: '#28282C', bgPanelLight: '#363640', bgElevated: '#444450', bgPanelHover: '#52525E',
    textPrimary: '#E8E8E4', textSecondary: '#9898A0', textTertiary: '#585860', textInverse: '#1A1A1C', textLink: '#6090FF',
    accent: '#909098', accentDark: '#606068', accentSecondary: '#6090FF', accentTertiary: '#FFB040', accentPositive: '#40C060', accentNegative: '#E04050',
    border: '#363640', borderLight: '#28282C', borderFocus: '#6090FF', borderWidth: '3px', borderRadius: '0',
    shadowPanel: '3px 3px 0 0 rgba(0, 0, 0, 0.5)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.4), inset 2px 2px 0 0 rgba(255,255,255,0.05)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.4), inset -2px -2px 0 0 rgba(255,255,255,0.05)',
    surfaceRaised: '#444450', surfaceSunken: '#101012',
    hoverBg: '#6090FF', hoverText: '#1A1A1C', activeBg: '#909098', activeText: '#1A1A1C', disabledBg: '#28282C', disabledText: '#585860',
    feedbackSuccess: '#40C060', feedbackWarning: '#FFB040', feedbackError: '#E04050', feedbackInfo: '#6090FF',
    vinylBlack: '#101012', vinylGroove: '#363640', vinylLabel: '#FFB040', vinylShine: '#444450',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// PlayStation 2 — Deep navy/black with blue glow
// ═══════════════════════════════════════════════════════════
const playstation2: ThemeDefinition = {
  id: 'playstation-2',
  labelKey: 'theme.name.ps2',
  category: 'classic-consoles',
  descriptionKey: 'theme.desc.ps2',
  tokens: {
    bgApp: '#080C18', bgPanel: '#101830', bgPanelLight: '#182248', bgElevated: '#202E60', bgPanelHover: '#283870',
    textPrimary: '#D8E0F0', textSecondary: '#8098C0', textTertiary: '#405078', textInverse: '#080C18', textLink: '#4080FF',
    accent: '#2048A0', accentDark: '#103070', accentSecondary: '#4080FF', accentTertiary: '#80C0FF', accentPositive: '#40A060', accentNegative: '#D04050',
    border: '#182248', borderLight: '#101830', borderFocus: '#4080FF', borderWidth: '4px', borderRadius: '2px',
    shadowPanel: '4px 4px 0 0 rgba(0, 0, 0, 0.5)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.4), inset 2px 2px 0 0 rgba(255,255,255,0.05)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.4), inset -2px -2px 0 0 rgba(255,255,255,0.05)',
    surfaceRaised: '#202E60', surfaceSunken: '#040810',
    hoverBg: '#4080FF', hoverText: '#080C18', activeBg: '#2048A0', activeText: '#D8E0F0', disabledBg: '#101830', disabledText: '#405078',
    feedbackSuccess: '#40A060', feedbackWarning: '#C0A040', feedbackError: '#D04050', feedbackInfo: '#4080FF',
    vinylBlack: '#040810', vinylGroove: '#182248', vinylLabel: '#80C0FF', vinylShine: '#202E60',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'linear-gradient(180deg, #101830 0%, #080C18 60%, #040810 100%)', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'heavy', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Xbox — Dark green + black, iconic Xbox green glow
// ═══════════════════════════════════════════════════════════
const xbox: ThemeDefinition = {
  id: 'xbox',
  labelKey: 'theme.name.xbox',
  category: 'classic-consoles',
  descriptionKey: 'theme.desc.xbox',
  tokens: {
    bgApp: '#0A0F0A', bgPanel: '#141A14', bgPanelLight: '#1E261E', bgElevated: '#283428', bgPanelHover: '#324032',
    textPrimary: '#E0E8D8', textSecondary: '#88A080', textTertiary: '#405840', textInverse: '#0A0F0A', textLink: '#60D040',
    accent: '#107C10', accentDark: '#085008', accentSecondary: '#60D040', accentTertiary: '#A0FF80', accentPositive: '#40B040', accentNegative: '#D04040',
    border: '#1E261E', borderLight: '#141A14', borderFocus: '#60D040', borderWidth: '4px', borderRadius: '2px',
    shadowPanel: '4px 4px 0 0 rgba(0, 0, 0, 0.55)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.45), inset 2px 2px 0 0 rgba(255,255,255,0.05)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.45), inset -2px -2px 0 0 rgba(255,255,255,0.05)',
    surfaceRaised: '#283428', surfaceSunken: '#050A05',
    hoverBg: '#107C10', hoverText: '#E0E8D8', activeBg: '#085008', activeText: '#E0E8D8', disabledBg: '#141A14', disabledText: '#405840',
    feedbackSuccess: '#40B040', feedbackWarning: '#C0C040', feedbackError: '#D04040', feedbackInfo: '#60D040',
    vinylBlack: '#050A05', vinylGroove: '#1E261E', vinylLabel: '#A0FF80', vinylShine: '#283428',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'heavy', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Dreamcast — White + orange, clean late-90s Sega aesthetic
// ═══════════════════════════════════════════════════════════
const dreamcast: ThemeDefinition = {
  id: 'dreamcast',
  labelKey: 'theme.name.dreamcast',
  category: 'classic-consoles',
  descriptionKey: 'theme.desc.dreamcast',
  tokens: {
    bgApp: '#1A1A28', bgPanel: '#262640', bgPanelLight: '#323258', bgElevated: '#404070', bgPanelHover: '#4E4E80',
    textPrimary: '#E8E4E0', textSecondary: '#9890B8', textTertiary: '#585068', textInverse: '#1A1A28', textLink: '#FF8040',
    accent: '#E86020', accentDark: '#A04010', accentSecondary: '#FF8040', accentTertiary: '#FFB880', accentPositive: '#40C060', accentNegative: '#E04050',
    border: '#323258', borderLight: '#262640', borderFocus: '#FF8040', borderWidth: '3px', borderRadius: '2px',
    shadowPanel: '3px 3px 0 0 rgba(0, 0, 0, 0.5)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.35), inset 2px 2px 0 0 rgba(255,255,255,0.06)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.35), inset -2px -2px 0 0 rgba(255,255,255,0.06)',
    surfaceRaised: '#404070', surfaceSunken: '#101020',
    hoverBg: '#E86020', hoverText: '#1A1A28', activeBg: '#A04010', activeText: '#E8E4E0', disabledBg: '#262640', disabledText: '#585068',
    feedbackSuccess: '#40C060', feedbackWarning: '#FFB040', feedbackError: '#E04050', feedbackInfo: '#FF8040',
    vinylBlack: '#101020', vinylGroove: '#323258', vinylLabel: '#FF8040', vinylShine: '#404070',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Arcade (Improved) — Vibrant neon cabinet with deep contrast
// ═══════════════════════════════════════════════════════════
const arcade: ThemeDefinition = {
  id: 'arcade',
  labelKey: 'theme.name.arcade',
  category: 'classic-consoles',
  descriptionKey: 'theme.desc.arcade',
  tokens: {
    bgApp: '#080810', bgPanel: '#141028', bgPanelLight: '#201840', bgElevated: '#2C2058', bgPanelHover: '#382868',
    textPrimary: '#FFFFFF', textSecondary: '#D0A0FF', textTertiary: '#604888', textInverse: '#080810', textLink: '#FF40FF',
    accent: '#FF2080', accentDark: '#B00050', accentSecondary: '#00FFFF', accentTertiary: '#FFFF00', accentPositive: '#40FF60', accentNegative: '#FF2040',
    border: '#201840', borderLight: '#141028', borderFocus: '#FF40FF', borderWidth: '4px', borderRadius: '0',
    shadowPanel: '4px 4px 0 0 rgba(255, 32, 128, 0.12)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.5), inset 2px 2px 0 0 rgba(255,255,255,0.08)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.5), inset -2px -2px 0 0 rgba(255,255,255,0.08)',
    surfaceRaised: '#2C2058', surfaceSunken: '#040408',
    hoverBg: '#FF2080', hoverText: '#080810', activeBg: '#FFFF00', activeText: '#080810', disabledBg: '#141028', disabledText: '#604888',
    feedbackSuccess: '#40FF60', feedbackWarning: '#FFFF00', feedbackError: '#FF2040', feedbackInfo: '#00FFFF',
    vinylBlack: '#040408', vinylGroove: '#201840', vinylLabel: '#FF40FF', vinylShine: '#FF2080',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'heavy', isDark: 'true',
  },
}

export const classicConsoles: ThemeDefinition[] = [nes, gameboy, gameboyColor, snes, segaGenesis, nintendo64, playstation, playstation2, xbox, dreamcast, arcade]
