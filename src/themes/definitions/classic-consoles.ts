/**
 * Classic Console themes:
 * NES, Game Boy, Game Boy Color, SNES, Sega Genesis,
 * Nintendo 64, PlayStation, PlayStation 2, Xbox, Dreamcast, Arcade,
 * Famicom, Virtual Boy, Wii, Wii U, Nintendo Switch,
 * Pokémon Red, Pokémon Blue, Pokémon Gold, Zelda, Mario,
 * Sega Saturn, Sega CD, Game Gear, PSP, PS Vita
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
// Famicom — Burgundy + cream red & gold Japanese Famicom
// ═══════════════════════════════════════════════════════════
const famicom: ThemeDefinition = {
  id: 'famicom',
  labelKey: 'theme.name.famicom',
  category: 'classic-consoles',
  descriptionKey: 'theme.desc.famicom',
  tokens: {
    bgApp: '#1A0D0D', bgPanel: '#2E1515', bgPanelLight: '#441F1F', bgElevated: '#582828', bgPanelHover: '#683030',
    textPrimary: '#FFE8D0', textSecondary: '#D0A080', textTertiary: '#885040', textInverse: '#1A0D0D', textLink: '#FFD040',
    accent: '#D04040', accentDark: '#902020', accentSecondary: '#FFD040', accentTertiary: '#FFE8A0', accentPositive: '#60B050', accentNegative: '#E04040',
    border: '#441F1F', borderLight: '#2E1515', borderFocus: '#FFD040', borderWidth: '4px', borderRadius: '0',
    shadowPanel: '4px 4px 0 0 rgba(0, 0, 0, 0.45)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.4), inset 2px 2px 0 0 rgba(255,255,255,0.06)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.4), inset -2px -2px 0 0 rgba(255,255,255,0.06)',
    surfaceRaised: '#582828', surfaceSunken: '#0F0606',
    hoverBg: '#FFD040', hoverText: '#1A0D0D', activeBg: '#D04040', activeText: '#FFE8D0', disabledBg: '#2E1515', disabledText: '#885040',
    feedbackSuccess: '#60B050', feedbackWarning: '#FFD040', feedbackError: '#E04040', feedbackInfo: '#FFD040',
    vinylBlack: '#0F0606', vinylGroove: '#441F1F', vinylLabel: '#FFD040', vinylShine: '#582828',
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
// Virtual Boy — Red & black stereoscopic 3D console
// ═══════════════════════════════════════════════════════════
const virtualBoy: ThemeDefinition = {
  id: 'virtual-boy',
  labelKey: 'theme.name.virtualBoy',
  category: 'classic-consoles',
  descriptionKey: 'theme.desc.virtualBoy',
  tokens: {
    bgApp: '#0A0000', bgPanel: '#1A0000', bgPanelLight: '#2A0808', bgElevated: '#380A0A', bgPanelHover: '#481010',
    textPrimary: '#FF2020', textSecondary: '#CC1010', textTertiary: '#660808', textInverse: '#0A0000', textLink: '#FF4040',
    accent: '#FF0000', accentDark: '#990000', accentSecondary: '#FF4040', accentTertiary: '#FF8080', accentPositive: '#FF2020', accentNegative: '#FF0000',
    border: '#2A0808', borderLight: '#1A0000', borderFocus: '#FF4040', borderWidth: '3px', borderRadius: '0',
    shadowPanel: '3px 3px 0 0 rgba(255, 0, 0, 0.12)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.6), inset 2px 2px 0 0 rgba(255,0,0,0.06)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.6), inset -2px -2px 0 0 rgba(255,0,0,0.04)',
    surfaceRaised: '#380A0A', surfaceSunken: '#000000',
    hoverBg: '#FF0000', hoverText: '#0A0000', activeBg: '#990000', activeText: '#FF2020', disabledBg: '#1A0000', disabledText: '#660808',
    feedbackSuccess: '#FF2020', feedbackWarning: '#FF2020', feedbackError: '#FF0000', feedbackInfo: '#FF4040',
    vinylBlack: '#000000', vinylGroove: '#2A0808', vinylLabel: '#FF2020', vinylShine: '#380A0A',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'linear-gradient(180deg, #1A0000 0%, #0A0000 50%, #000000 100%)', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
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
// Sega Saturn — Dark grey + deep blue with gold accents
// ═══════════════════════════════════════════════════════════
const segaSaturn: ThemeDefinition = {
  id: 'sega-saturn',
  labelKey: 'theme.name.segaSaturn',
  category: 'classic-consoles',
  descriptionKey: 'theme.desc.segaSaturn',
  tokens: {
    bgApp: '#0C0E14', bgPanel: '#181A22', bgPanelLight: '#242832', bgElevated: '#303640', bgPanelHover: '#3C4250',
    textPrimary: '#E0E0E8', textSecondary: '#8890A0', textTertiary: '#485060', textInverse: '#0C0E14', textLink: '#6090F0',
    accent: '#2848A0', accentDark: '#183070', accentSecondary: '#6090F0', accentTertiary: '#D0A040', accentPositive: '#40B060', accentNegative: '#D04050',
    border: '#242832', borderLight: '#181A22', borderFocus: '#6090F0', borderWidth: '3px', borderRadius: '0',
    shadowPanel: '3px 3px 0 0 rgba(0, 0, 0, 0.5)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.5), inset 2px 2px 0 0 rgba(255,255,255,0.05)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.5), inset -2px -2px 0 0 rgba(255,255,255,0.05)',
    surfaceRaised: '#303640', surfaceSunken: '#06070A',
    hoverBg: '#2848A0', hoverText: '#E0E0E8', activeBg: '#183070', activeText: '#E0E0E8', disabledBg: '#181A22', disabledText: '#485060',
    feedbackSuccess: '#40B060', feedbackWarning: '#D0A040', feedbackError: '#D04050', feedbackInfo: '#6090F0',
    vinylBlack: '#06070A', vinylGroove: '#242832', vinylLabel: '#D0A040', vinylShine: '#303640',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Sega CD — Dark teal + magenta, 90s Sega add-on vibes
// ═══════════════════════════════════════════════════════════
const segaCd: ThemeDefinition = {
  id: 'sega-cd',
  labelKey: 'theme.name.segaCd',
  category: 'classic-consoles',
  descriptionKey: 'theme.desc.segaCd',
  tokens: {
    bgApp: '#061014', bgPanel: '#0E1A22', bgPanelLight: '#162832', bgElevated: '#1E3644', bgPanelHover: '#264450',
    textPrimary: '#D0E8F0', textSecondary: '#6898B0', textTertiary: '#305060', textInverse: '#061014', textLink: '#FF50A0',
    accent: '#D03070', accentDark: '#901840', accentSecondary: '#FF50A0', accentTertiary: '#FFA0C0', accentPositive: '#40C080', accentNegative: '#E04050',
    border: '#162832', borderLight: '#0E1A22', borderFocus: '#FF50A0', borderWidth: '3px', borderRadius: '0',
    shadowPanel: '3px 3px 0 0 rgba(208,48,112,0.08)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.5), inset 2px 2px 0 0 rgba(255,255,255,0.05)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.5), inset -2px -2px 0 0 rgba(255,255,255,0.05)',
    surfaceRaised: '#1E3644', surfaceSunken: '#02080C',
    hoverBg: '#D03070', hoverText: '#D0E8F0', activeBg: '#901840', activeText: '#D0E8F0', disabledBg: '#0E1A22', disabledText: '#305060',
    feedbackSuccess: '#40C080', feedbackWarning: '#C0A040', feedbackError: '#E04050', feedbackInfo: '#FF50A0',
    vinylBlack: '#02080C', vinylGroove: '#162832', vinylLabel: '#FF50A0', vinylShine: '#1E3644',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Game Gear — Dark portable with full color LCD palette
// ═══════════════════════════════════════════════════════════
const gameGear: ThemeDefinition = {
  id: 'game-gear',
  labelKey: 'theme.name.gameGear',
  category: 'classic-consoles',
  descriptionKey: 'theme.desc.gameGear',
  tokens: {
    bgApp: '#0D0D18', bgPanel: '#181830', bgPanelLight: '#242448', bgElevated: '#303060', bgPanelHover: '#3C3C70',
    textPrimary: '#E0D8FF', textSecondary: '#A090D0', textTertiary: '#504878', textInverse: '#0D0D18', textLink: '#FF6090',
    accent: '#E04080', accentDark: '#A02050', accentSecondary: '#FF6090', accentTertiary: '#FFA0C0', accentPositive: '#50D080', accentNegative: '#E05050',
    border: '#242448', borderLight: '#181830', borderFocus: '#FF6090', borderWidth: '3px', borderRadius: '2px',
    shadowPanel: '3px 3px 0 0 rgba(0, 0, 0, 0.5)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.4), inset 2px 2px 0 0 rgba(255,255,255,0.06)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.4), inset -2px -2px 0 0 rgba(255,255,255,0.06)',
    surfaceRaised: '#303060', surfaceSunken: '#060610',
    hoverBg: '#E04080', hoverText: '#0D0D18', activeBg: '#A02050', activeText: '#E0D8FF', disabledBg: '#181830', disabledText: '#504878',
    feedbackSuccess: '#50D080', feedbackWarning: '#D0C040', feedbackError: '#E05050', feedbackInfo: '#FF6090',
    vinylBlack: '#060610', vinylGroove: '#242448', vinylLabel: '#FFA0C0', vinylShine: '#303060',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: PatternPresets.lcdGrid, bgAppOverlay: 'none', bgAppNoise: '0', bgAppScanlines: '0',
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
// Wii — Light silver + blue glowing Wii menu aesthetic
// ═══════════════════════════════════════════════════════════
const wii: ThemeDefinition = {
  id: 'wii',
  labelKey: 'theme.name.wii',
  category: 'classic-consoles',
  descriptionKey: 'theme.desc.wii',
  tokens: {
    bgApp: '#E8ECF0', bgPanel: '#F4F6F8', bgPanelLight: '#FFFFFF', bgElevated: '#FFFFFF', bgPanelHover: '#ECF0F4',
    textPrimary: '#282828', textSecondary: '#585858', textTertiary: '#A0A8B0', textInverse: '#FFFFFF', textLink: '#2888E0',
    accent: '#68B8F0', accentDark: '#3090D0', accentSecondary: '#2888E0', accentTertiary: '#A0D8FF', accentPositive: '#50B060', accentNegative: '#E05050',
    border: '#D0D8E0', borderLight: '#F4F6F8', borderFocus: '#68B8F0', borderWidth: '3px', borderRadius: '6px',
    shadowPanel: '2px 2px 8px rgba(0,0,0,0.08)', shadowButton: 'inset -1px -1px 0 0 rgba(0,0,0,0.1), inset 1px 1px 0 0 rgba(255,255,255,0.8), 1px 1px 3px rgba(0,0,0,0.1)', shadowButtonInset: 'inset 1px 1px 0 0 rgba(0,0,0,0.1), inset -1px -1px 0 0 rgba(255,255,255,0.8)',
    surfaceRaised: '#FFFFFF', surfaceSunken: '#E0E4E8',
    hoverBg: '#68B8F0', hoverText: '#FFFFFF', activeBg: '#3090D0', activeText: '#FFFFFF', disabledBg: '#F4F6F8', disabledText: '#A0A8B0',
    feedbackSuccess: '#50B060', feedbackWarning: '#D0B040', feedbackError: '#E05050', feedbackInfo: '#68B8F0',
    vinylBlack: '#D8DCE0', vinylGroove: '#C0C8D0', vinylLabel: '#68B8F0', vinylShine: '#E0E4E8',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: 'none', bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'false',
  },
}

// ═══════════════════════════════════════════════════════════
// Wii U — Dark + cyan blue, GamePad screen aesthetic
// ═══════════════════════════════════════════════════════════
const wiiU: ThemeDefinition = {
  id: 'wii-u',
  labelKey: 'theme.name.wiiU',
  category: 'classic-consoles',
  descriptionKey: 'theme.desc.wiiU',
  tokens: {
    bgApp: '#101418', bgPanel: '#1A1F24', bgPanelLight: '#242A32', bgElevated: '#303840', bgPanelHover: '#3C4450',
    textPrimary: '#E0E8F0', textSecondary: '#8898B0', textTertiary: '#485868', textInverse: '#101418', textLink: '#40C0F0',
    accent: '#2098D0', accentDark: '#106890', accentSecondary: '#40C0F0', accentTertiary: '#80E0FF', accentPositive: '#50C070', accentNegative: '#E05060',
    border: '#242A32', borderLight: '#1A1F24', borderFocus: '#40C0F0', borderWidth: '4px', borderRadius: '4px',
    shadowPanel: '4px 4px 0 0 rgba(0, 0, 0, 0.4)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.35), inset 2px 2px 0 0 rgba(255,255,255,0.06)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.35), inset -2px -2px 0 0 rgba(255,255,255,0.06)',
    surfaceRaised: '#303840', surfaceSunken: '#080A0E',
    hoverBg: '#2098D0', hoverText: '#E0E8F0', activeBg: '#106890', activeText: '#E0E8F0', disabledBg: '#1A1F24', disabledText: '#485868',
    feedbackSuccess: '#50C070', feedbackWarning: '#D0B040', feedbackError: '#E05060', feedbackInfo: '#40C0F0',
    vinylBlack: '#080A0E', vinylGroove: '#242A32', vinylLabel: '#40C0F0', vinylShine: '#303840',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'heavy', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Nintendo Switch — Neon red + blue joy-con palette
// ═══════════════════════════════════════════════════════════
const nintendoSwitch: ThemeDefinition = {
  id: 'nintendo-switch',
  labelKey: 'theme.name.switch',
  category: 'classic-consoles',
  descriptionKey: 'theme.desc.switch',
  tokens: {
    bgApp: '#1A1A20', bgPanel: '#282830', bgPanelLight: '#363640', bgElevated: '#444450', bgPanelHover: '#525260',
    textPrimary: '#F0F0F0', textSecondary: '#A0A0B0', textTertiary: '#585868', textInverse: '#1A1A20', textLink: '#FF4050',
    accent: '#E04040', accentDark: '#B02028', accentSecondary: '#3080FF', accentTertiary: '#FFD040', accentPositive: '#50C060', accentNegative: '#E04040',
    border: '#363640', borderLight: '#282830', borderFocus: '#FF4050', borderWidth: '4px', borderRadius: '4px',
    shadowPanel: '4px 4px 0 0 rgba(0, 0, 0, 0.4)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.35), inset 2px 2px 0 0 rgba(255,255,255,0.06)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.35), inset -2px -2px 0 0 rgba(255,255,255,0.06)',
    surfaceRaised: '#444450', surfaceSunken: '#101018',
    hoverBg: '#E04040', hoverText: '#F0F0F0', activeBg: '#3080FF', activeText: '#F0F0F0', disabledBg: '#282830', disabledText: '#585868',
    feedbackSuccess: '#50C060', feedbackWarning: '#FFD040', feedbackError: '#E04040', feedbackInfo: '#3080FF',
    vinylBlack: '#101018', vinylGroove: '#363640', vinylLabel: '#E04040', vinylShine: '#444450',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'heavy', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Pokémon Red — Warm red + white, Kanto region
// ═══════════════════════════════════════════════════════════
const pokemonRed: ThemeDefinition = {
  id: 'pokemon-red',
  labelKey: 'theme.name.pokemonRed',
  category: 'classic-consoles',
  descriptionKey: 'theme.desc.pokemonRed',
  tokens: {
    bgApp: '#F8E8E0', bgPanel: '#FFF2EC', bgPanelLight: '#FFFFFF', bgElevated: '#FFFFFF', bgPanelHover: '#FCE8E0',
    textPrimary: '#281818', textSecondary: '#604030', textTertiary: '#B89080', textInverse: '#FFFFFF', textLink: '#D03030',
    accent: '#E04040', accentDark: '#A02020', accentSecondary: '#FF6060', accentTertiary: '#FFA080', accentPositive: '#40A050', accentNegative: '#D03030',
    border: '#E8C8B8', borderLight: '#FFF2EC', borderFocus: '#E04040', borderWidth: '3px', borderRadius: '4px',
    shadowPanel: '2px 2px 0 0 rgba(224,64,64,0.1), -1px -1px 0 0 #FFFFFF', shadowButton: 'inset -1px -1px 0 0 rgba(0,0,0,0.08), inset 1px 1px 0 0 rgba(255,255,255,0.6), 1px 1px 3px rgba(0,0,0,0.1)', shadowButtonInset: 'inset 1px 1px 0 0 rgba(0,0,0,0.08), inset -1px -1px 0 0 rgba(255,255,255,0.6)',
    surfaceRaised: '#FFFFFF', surfaceSunken: '#F0D8D0',
    hoverBg: '#E04040', hoverText: '#FFFFFF', activeBg: '#A02020', activeText: '#FFFFFF', disabledBg: '#FFF2EC', disabledText: '#B89080',
    feedbackSuccess: '#40A050', feedbackWarning: '#D0A040', feedbackError: '#D03030', feedbackInfo: '#E04040',
    vinylBlack: '#E0C8C0', vinylGroove: '#D0B0A8', vinylLabel: '#E04040', vinylShine: '#E8D0C8',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: 'none', bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'false',
  },
}

// ═══════════════════════════════════════════════════════════
// Pokémon Blue — Cool blue + white, water-type style
// ═══════════════════════════════════════════════════════════
const pokemonBlue: ThemeDefinition = {
  id: 'pokemon-blue',
  labelKey: 'theme.name.pokemonBlue',
  category: 'classic-consoles',
  descriptionKey: 'theme.desc.pokemonBlue',
  tokens: {
    bgApp: '#E0EAF8', bgPanel: '#ECF2FF', bgPanelLight: '#FFFFFF', bgElevated: '#FFFFFF', bgPanelHover: '#E0ECFC',
    textPrimary: '#1A2430', textSecondary: '#304860', textTertiary: '#8098B8', textInverse: '#FFFFFF', textLink: '#2858D0',
    accent: '#3868E0', accentDark: '#2040A0', accentSecondary: '#5888FF', accentTertiary: '#80B0FF', accentPositive: '#40A050', accentNegative: '#E04040',
    border: '#C0D0E8', borderLight: '#ECF2FF', borderFocus: '#3868E0', borderWidth: '3px', borderRadius: '4px',
    shadowPanel: '2px 2px 0 0 rgba(56,104,224,0.1), -1px -1px 0 0 #FFFFFF', shadowButton: 'inset -1px -1px 0 0 rgba(0,0,0,0.08), inset 1px 1px 0 0 rgba(255,255,255,0.6), 1px 1px 3px rgba(0,0,0,0.1)', shadowButtonInset: 'inset 1px 1px 0 0 rgba(0,0,0,0.08), inset -1px -1px 0 0 rgba(255,255,255,0.6)',
    surfaceRaised: '#FFFFFF', surfaceSunken: '#D0DCE8',
    hoverBg: '#3868E0', hoverText: '#FFFFFF', activeBg: '#2040A0', activeText: '#FFFFFF', disabledBg: '#ECF2FF', disabledText: '#8098B8',
    feedbackSuccess: '#40A050', feedbackWarning: '#D0B040', feedbackError: '#E04040', feedbackInfo: '#3868E0',
    vinylBlack: '#C0D0E0', vinylGroove: '#A8BCD0', vinylLabel: '#3868E0', vinylShine: '#D0DCE8',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: 'none', bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'false',
  },
}

// ═══════════════════════════════════════════════════════════
// Pokémon Gold — Gold + cream, Johto nostalgia
// ═══════════════════════════════════════════════════════════
const pokemonGold: ThemeDefinition = {
  id: 'pokemon-gold',
  labelKey: 'theme.name.pokemonGold',
  category: 'classic-consoles',
  descriptionKey: 'theme.desc.pokemonGold',
  tokens: {
    bgApp: '#1A1408', bgPanel: '#2A2010', bgPanelLight: '#3D2C15', bgElevated: '#4E3818', bgPanelHover: '#5E4420',
    textPrimary: '#FFE8C0', textSecondary: '#D0A850', textTertiary: '#805828', textInverse: '#1A1408', textLink: '#FFC040',
    accent: '#E0A830', accentDark: '#B08018', accentSecondary: '#FFD060', accentTertiary: '#FFE8A0', accentPositive: '#60B040', accentNegative: '#D05040',
    border: '#3D2C15', borderLight: '#2A2010', borderFocus: '#FFD060', borderWidth: '4px', borderRadius: '2px',
    shadowPanel: '4px 4px 0 0 rgba(224, 168, 48, 0.12)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.4), inset 2px 2px 0 0 rgba(255,255,255,0.06)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.4), inset -2px -2px 0 0 rgba(255,255,255,0.06)',
    surfaceRaised: '#4E3818', surfaceSunken: '#0C0A04',
    hoverBg: '#E0A830', hoverText: '#1A1408', activeBg: '#B08018', activeText: '#FFE8C0', disabledBg: '#2A2010', disabledText: '#805828',
    feedbackSuccess: '#60B040', feedbackWarning: '#FFC040', feedbackError: '#D05040', feedbackInfo: '#FFD060',
    vinylBlack: '#0C0A04', vinylGroove: '#3D2C15', vinylLabel: '#FFE8A0', vinylShine: '#4E3818',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'linear-gradient(180deg, #2A2010 0%, #1A1408 50%, #0C0A04 100%)', bgAppOverlay: PatternPresets.warmPaper, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'heavy', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Zelda — Forest green + gold, Hyrule fantasy
// ═══════════════════════════════════════════════════════════
const zelda: ThemeDefinition = {
  id: 'zelda',
  labelKey: 'theme.name.zelda',
  category: 'classic-consoles',
  descriptionKey: 'theme.desc.zelda',
  tokens: {
    bgApp: '#0A140A', bgPanel: '#142210', bgPanelLight: '#1E3018', bgElevated: '#284020', bgPanelHover: '#325028',
    textPrimary: '#E8E0B0', textSecondary: '#A0B050', textTertiary: '#486030', textInverse: '#0A140A', textLink: '#FFD040',
    accent: '#60A030', accentDark: '#387018', accentSecondary: '#FFD040', accentTertiary: '#FFE080', accentPositive: '#70B040', accentNegative: '#D04040',
    border: '#1E3018', borderLight: '#142210', borderFocus: '#FFD040', borderWidth: '4px', borderRadius: '0',
    shadowPanel: '4px 4px 0 0 rgba(96, 160, 48, 0.08)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.45), inset 2px 2px 0 0 rgba(255,255,255,0.05)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.45), inset -2px -2px 0 0 rgba(255,255,255,0.05)',
    surfaceRaised: '#284020', surfaceSunken: '#040A04',
    hoverBg: '#60A030', hoverText: '#E8E0B0', activeBg: '#FFD040', activeText: '#0A140A', disabledBg: '#142210', disabledText: '#486030',
    feedbackSuccess: '#70B040', feedbackWarning: '#FFD040', feedbackError: '#D04040', feedbackInfo: '#FFD040',
    vinylBlack: '#040A04', vinylGroove: '#1E3018', vinylLabel: '#FFD040', vinylShine: '#284020',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: PatternPresets.lcdGrid, bgAppOverlay: 'none', bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'heavy', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Mario — Bright red + blue overalls, cheerful platformer
// ═══════════════════════════════════════════════════════════
const mario: ThemeDefinition = {
  id: 'mario',
  labelKey: 'theme.name.mario',
  category: 'classic-consoles',
  descriptionKey: 'theme.desc.mario',
  tokens: {
    bgApp: '#2028C8', bgPanel: '#2830D8', bgPanelLight: '#3840F0', bgElevated: '#4860FF', bgPanelHover: '#5870FF',
    textPrimary: '#FFFFFF', textSecondary: '#D0D8FF', textTertiary: '#8090E0', textInverse: '#2028C8', textLink: '#FFD040',
    accent: '#E04030', accentDark: '#B02018', accentSecondary: '#FFD040', accentTertiary: '#FFFFFF', accentPositive: '#50C040', accentNegative: '#E04030',
    border: '#3840F0', borderLight: '#2830D8', borderFocus: '#FFD040', borderWidth: '4px', borderRadius: '2px',
    shadowPanel: '4px 4px 0 0 rgba(0, 0, 0, 0.3)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.3), inset 2px 2px 0 0 rgba(255,255,255,0.15)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.3), inset -2px -2px 0 0 rgba(255,255,255,0.15)',
    surfaceRaised: '#4860FF', surfaceSunken: '#1018A0',
    hoverBg: '#FFD040', hoverText: '#2028C8', activeBg: '#E04030', activeText: '#FFFFFF', disabledBg: '#2830D8', disabledText: '#8090E0',
    feedbackSuccess: '#50C040', feedbackWarning: '#FFD040', feedbackError: '#E04030', feedbackInfo: '#FFD040',
    vinylBlack: '#1018A0', vinylGroove: '#2830D8', vinylLabel: '#FFD040', vinylShine: '#3840F0',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'heavy', isDark: 'false',
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
// PSP — Black + silver, PlayStation Portable sleekness
// ═══════════════════════════════════════════════════════════
const psp: ThemeDefinition = {
  id: 'psp',
  labelKey: 'theme.name.psp',
  category: 'classic-consoles',
  descriptionKey: 'theme.desc.psp',
  tokens: {
    bgApp: '#101012', bgPanel: '#1A1A1E', bgPanelLight: '#262830', bgElevated: '#323640', bgPanelHover: '#3E4250',
    textPrimary: '#E8E8E8', textSecondary: '#9898A0', textTertiary: '#505058', textInverse: '#101012', textLink: '#80B8FF',
    accent: '#606068', accentDark: '#404048', accentSecondary: '#80B8FF', accentTertiary: '#FFB860', accentPositive: '#50B060', accentNegative: '#E05060',
    border: '#262830', borderLight: '#1A1A1E', borderFocus: '#80B8FF', borderWidth: '3px', borderRadius: '4px',
    shadowPanel: '3px 3px 0 0 rgba(0, 0, 0, 0.5)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.4), inset 2px 2px 0 0 rgba(255,255,255,0.06)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.4), inset -2px -2px 0 0 rgba(255,255,255,0.06)',
    surfaceRaised: '#323640', surfaceSunken: '#08080A',
    hoverBg: '#80B8FF', hoverText: '#101012', activeBg: '#606068', activeText: '#E8E8E8', disabledBg: '#1A1A1E', disabledText: '#505058',
    feedbackSuccess: '#50B060', feedbackWarning: '#FFB860', feedbackError: '#E05060', feedbackInfo: '#80B8FF',
    vinylBlack: '#08080A', vinylGroove: '#262830', vinylLabel: '#80B8FF', vinylShine: '#323640',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// PS Vita — Navy + cyan, OLED elegance
// ═══════════════════════════════════════════════════════════
const psVita: ThemeDefinition = {
  id: 'ps-vita',
  labelKey: 'theme.name.psVita',
  category: 'classic-consoles',
  descriptionKey: 'theme.desc.psVita',
  tokens: {
    bgApp: '#060E18', bgPanel: '#0E1828', bgPanelLight: '#162238', bgElevated: '#1E2E50', bgPanelHover: '#263A60',
    textPrimary: '#D8E8F8', textSecondary: '#78A8D0', textTertiary: '#386088', textInverse: '#060E18', textLink: '#40C0FF',
    accent: '#2098E0', accentDark: '#1068A0', accentSecondary: '#40C0FF', accentTertiary: '#80D8FF', accentPositive: '#40B070', accentNegative: '#E05060',
    border: '#162238', borderLight: '#0E1828', borderFocus: '#40C0FF', borderWidth: '3px', borderRadius: '6px',
    shadowPanel: '3px 3px 0 0 rgba(0, 0, 0, 0.5)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.35), inset 2px 2px 0 0 rgba(255,255,255,0.06)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.35), inset -2px -2px 0 0 rgba(255,255,255,0.06)',
    surfaceRaised: '#1E2E50', surfaceSunken: '#020810',
    hoverBg: '#2098E0', hoverText: '#D8E8F8', activeBg: '#1068A0', activeText: '#D8E8F8', disabledBg: '#0E1828', disabledText: '#386088',
    feedbackSuccess: '#40B070', feedbackWarning: '#D0B040', feedbackError: '#E05060', feedbackInfo: '#40C0FF',
    vinylBlack: '#020810', vinylGroove: '#162238', vinylLabel: '#40C0FF', vinylShine: '#1E2E50',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'linear-gradient(180deg, #0E1828 0%, #060E18 60%, #020810 100%)', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'true',
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

export const classicConsoles: ThemeDefinition[] = [
  nes, famicom, gameboy, gameboyColor, virtualBoy, snes, segaGenesis,
  segaSaturn, segaCd, gameGear, nintendo64, wii, wiiU, nintendoSwitch,
  pokemonRed, pokemonBlue, pokemonGold, zelda, mario,
  playstation, playstation2, psp, psVita, xbox, dreamcast, arcade,
]
