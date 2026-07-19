/**
 * Retro Computer themes:
 * Amiga, Windows 95, Windows 98, MS-DOS, Macintosh Classic, Windows XP,
 * Windows Vista, Windows 7, Windows 2000, Windows 3.1,
 * Mac OS X Aqua, IBM PC, Commodore 64, Atari ST, DOS Blue
 */
import type { ThemeDefinition } from '../types'
import { PatternPresets, scanlineCss } from '../patterns'

// ═══════════════════════════════════════════════════════════
// Commodore Amiga
// ═══════════════════════════════════════════════════════════
const amiga: ThemeDefinition = {
  id: 'amiga',
  labelKey: 'theme.name.amiga',
  category: 'retro-computers',
  descriptionKey: 'theme.desc.amiga',
  tokens: {
    bgApp: '#1A2A4A', bgPanel: '#2A3A5A', bgPanelLight: '#3A4D70', bgElevated: '#4A608A', bgPanelHover: '#56709E',
    textPrimary: '#E8E4D8', textSecondary: '#A0A8C0', textTertiary: '#556080', textInverse: '#1A2A4A', textLink: '#FF8C42',
    accent: '#FF6B35', accentDark: '#CC4400', accentSecondary: '#6495ED', accentTertiary: '#FFD700', accentPositive: '#50C878', accentNegative: '#FF4444',
    border: '#3A4D70', borderLight: '#2A3A5A', borderFocus: '#FF8C42', borderWidth: '3px', borderRadius: '2px',
    shadowPanel: '4px 4px 0 0 rgba(0, 0, 0, 0.5)', shadowButton: 'inset -1px -1px 0 0 rgba(0,0,0,0.5), inset 1px 1px 0 0 rgba(255,255,255,0.2), 2px 2px 0 0 rgba(0,0,0,0.3)', shadowButtonInset: 'inset 1px 1px 0 0 rgba(0,0,0,0.5), inset -1px -1px 0 0 rgba(255,255,255,0.2)',
    surfaceRaised: '#4A608A', surfaceSunken: '#101A30',
    hoverBg: '#FF8C42', hoverText: '#1A2A4A', activeBg: '#CC4400', activeText: '#E8E4D8', disabledBg: '#2A3A5A', disabledText: '#556080',
    feedbackSuccess: '#50C878', feedbackWarning: '#FFD700', feedbackError: '#FF4444', feedbackInfo: '#6495ED',
    vinylBlack: '#101A30', vinylGroove: '#2A3A5A', vinylLabel: '#FFD700', vinylShine: '#3A4D70',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Windows 95
// ═══════════════════════════════════════════════════════════
const windows95: ThemeDefinition = {
  id: 'windows-95',
  labelKey: 'theme.name.win95',
  category: 'retro-computers',
  descriptionKey: 'theme.desc.win95',
  tokens: {
    bgApp: '#008080', bgPanel: '#C0C0C0', bgPanelLight: '#DFDFDF', bgElevated: '#FFFFFF', bgPanelHover: '#D4D4D4',
    textPrimary: '#000000', textSecondary: '#404040', textTertiary: '#808080', textInverse: '#FFFFFF', textLink: '#0000FF',
    accent: '#000080', accentDark: '#000040', accentSecondary: '#008080', accentTertiary: '#808000', accentPositive: '#008000', accentNegative: '#FF0000',
    border: '#808080', borderLight: '#DFDFDF', borderFocus: '#000000', borderWidth: '3px', borderRadius: '0',
    shadowPanel: '2px 2px 0 0 #808080, -2px -2px 0 0 #FFFFFF, inset 0 0 0 1px #DFDFDF', shadowButton: 'inset -1px -1px 0 0 #808080, inset 1px 1px 0 0 #FFFFFF, 1px 1px 0 0 #000000', shadowButtonInset: 'inset 1px 1px 0 0 #808080, inset -1px -1px 0 0 #FFFFFF',
    surfaceRaised: '#FFFFFF', surfaceSunken: '#C0C0C0',
    hoverBg: '#000080', hoverText: '#FFFFFF', activeBg: '#808080', activeText: '#FFFFFF', disabledBg: '#C0C0C0', disabledText: '#808080',
    feedbackSuccess: '#008000', feedbackWarning: '#808000', feedbackError: '#FF0000', feedbackInfo: '#000080',
    vinylBlack: '#202020', vinylGroove: '#404040', vinylLabel: '#000080', vinylShine: '#606060',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: 'none', bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'false',
  },
}

// ═══════════════════════════════════════════════════════════
// Windows 3.1 — Classic white + blue title bar, chunky bevels
// ═══════════════════════════════════════════════════════════
const windows31: ThemeDefinition = {
  id: 'windows-31',
  labelKey: 'theme.name.win31',
  category: 'retro-computers',
  descriptionKey: 'theme.desc.win31',
  tokens: {
    bgApp: '#000080', bgPanel: '#FFFFFF', bgPanelLight: '#F0F0F0', bgElevated: '#FFFFFF', bgPanelHover: '#E8E8E8',
    textPrimary: '#000000', textSecondary: '#404040', textTertiary: '#808080', textInverse: '#FFFFFF', textLink: '#0000FF',
    accent: '#000080', accentDark: '#000040', accentSecondary: '#008080', accentTertiary: '#C0C0C0', accentPositive: '#008000', accentNegative: '#FF0000',
    border: '#808080', borderLight: '#F0F0F0', borderFocus: '#000080', borderWidth: '3px', borderRadius: '0',
    shadowPanel: '2px 2px 0 0 #808080, -2px -2px 0 0 #FFFFFF, inset 0 0 0 1px #C0C0C0', shadowButton: 'inset -1px -1px 0 0 #808080, inset 1px 1px 0 0 #FFFFFF, 1px 1px 0 0 #000000', shadowButtonInset: 'inset 1px 1px 0 0 #808080, inset -1px -1px 0 0 #FFFFFF',
    surfaceRaised: '#FFFFFF', surfaceSunken: '#C0C0C0',
    hoverBg: '#000080', hoverText: '#FFFFFF', activeBg: '#808080', activeText: '#FFFFFF', disabledBg: '#FFFFFF', disabledText: '#808080',
    feedbackSuccess: '#008000', feedbackWarning: '#808000', feedbackError: '#FF0000', feedbackInfo: '#000080',
    vinylBlack: '#202020', vinylGroove: '#404040', vinylLabel: '#000080', vinylShine: '#606060',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: 'none', bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'false',
  },
}

// ═══════════════════════════════════════════════════════════
// MS-DOS — Classic command-line grey on black
// ═══════════════════════════════════════════════════════════
const msDos: ThemeDefinition = {
  id: 'ms-dos',
  labelKey: 'theme.name.msDos',
  category: 'retro-computers',
  descriptionKey: 'theme.desc.msDos',
  tokens: {
    bgApp: '#000000', bgPanel: '#0A0A0A', bgPanelLight: '#151515', bgElevated: '#202020', bgPanelHover: '#2A2A2A',
    textPrimary: '#C0C0C0', textSecondary: '#808080', textTertiary: '#404040', textInverse: '#000000', textLink: '#00FFFF',
    accent: '#FFFFFF', accentDark: '#888888', accentSecondary: '#00FFFF', accentTertiary: '#FFFF00', accentPositive: '#00FF00', accentNegative: '#FF0000',
    border: '#404040', borderLight: '#202020', borderFocus: '#00FFFF', borderWidth: '2px', borderRadius: '0',
    shadowPanel: '2px 2px 0 0 rgba(0,0,0,0.8)', shadowButton: 'inset -1px -1px 0 0 rgba(0,0,0,0.6), inset 1px 1px 0 0 rgba(255,255,255,0.1)', shadowButtonInset: 'inset 1px 1px 0 0 rgba(0,0,0,0.6), inset -1px -1px 0 0 rgba(255,255,255,0.04)',
    surfaceRaised: '#202020', surfaceSunken: '#000000',
    hoverBg: '#00FFFF', hoverText: '#000000', activeBg: '#FFFFFF', activeText: '#000000', disabledBg: '#0A0A0A', disabledText: '#404040',
    feedbackSuccess: '#00FF00', feedbackWarning: '#FFFF00', feedbackError: '#FF0000', feedbackInfo: '#00FFFF',
    vinylBlack: '#000000', vinylGroove: '#202020', vinylLabel: '#00FFFF', vinylShine: '#151515',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: scanlineCss(0.04, 3), bgAppOverlay: 'none', bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// DOS Blue — Blue background with white text, WordPerfect style
// ═══════════════════════════════════════════════════════════
const dosBlue: ThemeDefinition = {
  id: 'dos-blue',
  labelKey: 'theme.name.dosBlue',
  category: 'retro-computers',
  descriptionKey: 'theme.desc.dosBlue',
  tokens: {
    bgApp: '#0000A8', bgPanel: '#0A0AB8', bgPanelLight: '#1515C8', bgElevated: '#2020D8', bgPanelHover: '#2A2AE8',
    textPrimary: '#FFFFFF', textSecondary: '#C0C0FF', textTertiary: '#6060C0', textInverse: '#0000A8', textLink: '#FFFF00',
    accent: '#FFFFFF', accentDark: '#C0C0FF', accentSecondary: '#FFFF00', accentTertiary: '#FFFFFF', accentPositive: '#00FF00', accentNegative: '#FF4040',
    border: '#3030D0', borderLight: '#1515C8', borderFocus: '#FFFF00', borderWidth: '2px', borderRadius: '0',
    shadowPanel: '2px 2px 0 0 rgba(0,0,0,0.4)', shadowButton: 'inset -1px -1px 0 0 rgba(0,0,0,0.3), inset 1px 1px 0 0 rgba(255,255,255,0.15)', shadowButtonInset: 'inset 1px 1px 0 0 rgba(0,0,0,0.3), inset -1px -1px 0 0 rgba(255,255,255,0.08)',
    surfaceRaised: '#2020D8', surfaceSunken: '#000070',
    hoverBg: '#FFFF00', hoverText: '#0000A8', activeBg: '#FFFFFF', activeText: '#0000A8', disabledBg: '#0A0AB8', disabledText: '#6060C0',
    feedbackSuccess: '#00FF00', feedbackWarning: '#FFFF00', feedbackError: '#FF4040', feedbackInfo: '#FFFFFF',
    vinylBlack: '#000070', vinylGroove: '#1515C8', vinylLabel: '#FFFF00', vinylShine: '#2020D8',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: 'none', bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'false',
  },
}

// ═══════════════════════════════════════════════════════════
// Macintosh Classic — System 6 platinum grey
// ═══════════════════════════════════════════════════════════
const macClassic: ThemeDefinition = {
  id: 'mac-classic',
  labelKey: 'theme.name.macClassic',
  category: 'retro-computers',
  descriptionKey: 'theme.desc.macClassic',
  tokens: {
    bgApp: '#666666', bgPanel: '#DDDDDD', bgPanelLight: '#EEEEEE', bgElevated: '#FFFFFF', bgPanelHover: '#E8E8E8',
    textPrimary: '#000000', textSecondary: '#333333', textTertiary: '#888888', textInverse: '#FFFFFF', textLink: '#0000CC',
    accent: '#000000', accentDark: '#333333', accentSecondary: '#0000CC', accentTertiary: '#666666', accentPositive: '#008000', accentNegative: '#CC0000',
    border: '#999999', borderLight: '#DDDDDD', borderFocus: '#000000', borderWidth: '3px', borderRadius: '3px',
    shadowPanel: '1px 1px 0 0 #FFFFFF, -1px -1px 0 0 #999999, inset 0 0 0 1px #CCCCCC', shadowButton: 'inset -1px -1px 0 0 #999999, inset 1px 1px 0 0 #FFFFFF, 1px 1px 0 0 #666666', shadowButtonInset: 'inset 1px 1px 0 0 #999999, inset -1px -1px 0 0 #FFFFFF',
    surfaceRaised: '#FFFFFF', surfaceSunken: '#CCCCCC',
    hoverBg: '#000000', hoverText: '#FFFFFF', activeBg: '#666666', activeText: '#FFFFFF', disabledBg: '#DDDDDD', disabledText: '#999999',
    feedbackSuccess: '#008000', feedbackWarning: '#888800', feedbackError: '#CC0000', feedbackInfo: '#0000CC',
    vinylBlack: '#222222', vinylGroove: '#444444', vinylLabel: '#DDDDDD', vinylShine: '#666666',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: 'none', bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'false',
  },
}

// ═══════════════════════════════════════════════════════════
// Windows XP — Bliss blue + olive green + silver taskbar
// ═══════════════════════════════════════════════════════════
const windowsXp: ThemeDefinition = {
  id: 'windows-xp',
  labelKey: 'theme.name.winXp',
  category: 'retro-computers',
  descriptionKey: 'theme.desc.winXp',
  tokens: {
    bgApp: '#3A6EA5', bgPanel: '#ECE9D8', bgPanelLight: '#F4F1E6', bgElevated: '#FFFFFF', bgPanelHover: '#E8E5D4',
    textPrimary: '#000000', textSecondary: '#404040', textTertiary: '#888888', textInverse: '#FFFFFF', textLink: '#0066CC',
    accent: '#0066CC', accentDark: '#004488', accentSecondary: '#3A6EA5', accentTertiary: '#FFCC00', accentPositive: '#008000', accentNegative: '#CC0000',
    border: '#A0B8D0', borderLight: '#ECE9D8', borderFocus: '#3A6EA5', borderWidth: '3px', borderRadius: '3px',
    shadowPanel: '1px 1px 0 0 #FFFFFF, -1px -1px 0 0 #A0B8D0, inset 0 0 0 1px #D4D0C8', shadowButton: 'inset -1px -1px 0 0 #A0B8D0, inset 1px 1px 0 0 #FFFFFF, 1px 1px 0 0 #888888', shadowButtonInset: 'inset 1px 1px 0 0 #A0B8D0, inset -1px -1px 0 0 #FFFFFF',
    surfaceRaised: '#FFFFFF', surfaceSunken: '#ECE9D8',
    hoverBg: '#0066CC', hoverText: '#FFFFFF', activeBg: '#004488', activeText: '#FFFFFF', disabledBg: '#ECE9D8', disabledText: '#A0B8D0',
    feedbackSuccess: '#008000', feedbackWarning: '#FFCC00', feedbackError: '#CC0000', feedbackInfo: '#0066CC',
    vinylBlack: '#222222', vinylGroove: '#404040', vinylLabel: '#3A6EA5', vinylShine: '#606868',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: 'none', bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'false',
  },
}

// ═══════════════════════════════════════════════════════════
// Windows Vista — Aero glass, dark taskbar, green start button
// ═══════════════════════════════════════════════════════════
const windowsVista: ThemeDefinition = {
  id: 'windows-vista',
  labelKey: 'theme.name.winVista',
  category: 'retro-computers',
  descriptionKey: 'theme.desc.winVista',
  tokens: {
    bgApp: '#1A1A24', bgPanel: '#242430', bgPanelLight: '#303040', bgElevated: '#3C3C50', bgPanelHover: '#484860',
    textPrimary: '#E8E8F0', textSecondary: '#9898B0', textTertiary: '#585870', textInverse: '#1A1A24', textLink: '#80C0FF',
    accent: '#40B040', accentDark: '#288028', accentSecondary: '#80C0FF', accentTertiary: '#A0FFA0', accentPositive: '#40B040', accentNegative: '#E04040',
    border: '#303040', borderLight: '#242430', borderFocus: '#80C0FF', borderWidth: '3px', borderRadius: '4px',
    shadowPanel: '2px 2px 8px rgba(0,0,0,0.4), 0 0 20px rgba(64,176,64,0.06)', shadowButton: 'inset -1px -1px 0 0 rgba(0,0,0,0.3), inset 1px 1px 0 0 rgba(255,255,255,0.1), 1px 1px 4px rgba(0,0,0,0.3)', shadowButtonInset: 'inset 1px 1px 0 0 rgba(0,0,0,0.3), inset -1px -1px 0 0 rgba(255,255,255,0.06)',
    surfaceRaised: '#3C3C50', surfaceSunken: '#10101A',
    hoverBg: '#40B040', hoverText: '#1A1A24', activeBg: '#288028', activeText: '#E8E8F0', disabledBg: '#242430', disabledText: '#585870',
    feedbackSuccess: '#40B040', feedbackWarning: '#C0B040', feedbackError: '#E04040', feedbackInfo: '#80C0FF',
    vinylBlack: '#10101A', vinylGroove: '#303040', vinylLabel: '#40B040', vinylShine: '#3C3C50',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'linear-gradient(180deg, #242430 0%, #1A1A24 50%, #10101A 100%)', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Windows 7 — Aero blue glass, softer transparency
// ═══════════════════════════════════════════════════════════
const windows7: ThemeDefinition = {
  id: 'windows-7',
  labelKey: 'theme.name.win7',
  category: 'retro-computers',
  descriptionKey: 'theme.desc.win7',
  tokens: {
    bgApp: '#184878', bgPanel: '#D8E8F4', bgPanelLight: '#E8F0F8', bgElevated: '#FFFFFF', bgPanelHover: '#D0E4F0',
    textPrimary: '#1A2A38', textSecondary: '#406078', textTertiary: '#8098B0', textInverse: '#FFFFFF', textLink: '#1868C0',
    accent: '#2888E0', accentDark: '#1860A0', accentSecondary: '#60B8F0', accentTertiary: '#A0D8FF', accentPositive: '#40A050', accentNegative: '#D04040',
    border: '#A0C0E0', borderLight: '#E8F0F8', borderFocus: '#2888E0', borderWidth: '3px', borderRadius: '5px',
    shadowPanel: '2px 2px 8px rgba(0,0,0,0.1), 0 0 20px rgba(40,136,224,0.05)', shadowButton: 'inset -1px -1px 0 0 rgba(0,0,0,0.08), inset 1px 1px 0 0 rgba(255,255,255,0.6), 1px 1px 3px rgba(0,0,0,0.12)', shadowButtonInset: 'inset 1px 1px 0 0 rgba(0,0,0,0.08), inset -1px -1px 0 0 rgba(255,255,255,0.6)',
    surfaceRaised: '#FFFFFF', surfaceSunken: '#C8D8E8',
    hoverBg: '#2888E0', hoverText: '#FFFFFF', activeBg: '#1860A0', activeText: '#FFFFFF', disabledBg: '#D8E8F4', disabledText: '#8098B0',
    feedbackSuccess: '#40A050', feedbackWarning: '#C0A040', feedbackError: '#D04040', feedbackInfo: '#2888E0',
    vinylBlack: '#C0D0E0', vinylGroove: '#A8BCD0', vinylLabel: '#2888E0', vinylShine: '#D0DCE8',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: 'none', bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'false',
  },
}

// ═══════════════════════════════════════════════════════════
// Windows 2000 — Classic grey professional workstation
// ═══════════════════════════════════════════════════════════
const windows2000: ThemeDefinition = {
  id: 'windows-2000',
  labelKey: 'theme.name.win2000',
  category: 'retro-computers',
  descriptionKey: 'theme.desc.win2000',
  tokens: {
    bgApp: '#3A6EA5', bgPanel: '#D4D0C8', bgPanelLight: '#E8E4DC', bgElevated: '#FFFFFF', bgPanelHover: '#DCD8D0',
    textPrimary: '#000000', textSecondary: '#404040', textTertiary: '#808080', textInverse: '#FFFFFF', textLink: '#0000CC',
    accent: '#000080', accentDark: '#000040', accentSecondary: '#3A6EA5', accentTertiary: '#808080', accentPositive: '#008000', accentNegative: '#CC0000',
    border: '#808080', borderLight: '#D4D0C8', borderFocus: '#000080', borderWidth: '3px', borderRadius: '0',
    shadowPanel: '2px 2px 0 0 #808080, -2px -2px 0 0 #FFFFFF, inset 0 0 0 1px #C0C0C0', shadowButton: 'inset -1px -1px 0 0 #808080, inset 1px 1px 0 0 #FFFFFF, 1px 1px 0 0 #404040', shadowButtonInset: 'inset 1px 1px 0 0 #808080, inset -1px -1px 0 0 #FFFFFF',
    surfaceRaised: '#FFFFFF', surfaceSunken: '#D4D0C8',
    hoverBg: '#000080', hoverText: '#FFFFFF', activeBg: '#808080', activeText: '#FFFFFF', disabledBg: '#D4D0C8', disabledText: '#808080',
    feedbackSuccess: '#008000', feedbackWarning: '#808000', feedbackError: '#CC0000', feedbackInfo: '#000080',
    vinylBlack: '#404040', vinylGroove: '#606060', vinylLabel: '#000080', vinylShine: '#808080',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: 'none', bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'false',
  },
}

// ═══════════════════════════════════════════════════════════
// Mac OS X Aqua — Brushed metal + blue gel buttons
// ═══════════════════════════════════════════════════════════
const macOsxAqua: ThemeDefinition = {
  id: 'mac-osx-aqua',
  labelKey: 'theme.name.macAqua',
  category: 'retro-computers',
  descriptionKey: 'theme.desc.macAqua',
  tokens: {
    bgApp: '#8898A8', bgPanel: '#E8ECF0', bgPanelLight: '#F4F6F8', bgElevated: '#FFFFFF', bgPanelHover: '#E0E4E8',
    textPrimary: '#1A1A20', textSecondary: '#484850', textTertiary: '#889098', textInverse: '#FFFFFF', textLink: '#2868E0',
    accent: '#2070E0', accentDark: '#1048A0', accentSecondary: '#68A8F0', accentTertiary: '#A0D0FF', accentPositive: '#40A050', accentNegative: '#D04040',
    border: '#C0C8D0', borderLight: '#E8ECF0', borderFocus: '#2070E0', borderWidth: '3px', borderRadius: '6px',
    shadowPanel: '2px 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)', shadowButton: 'inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.08), 1px 1px 3px rgba(0,0,0,0.1)', shadowButtonInset: 'inset 0 -1px 0 rgba(255,255,255,0.3), inset 0 1px 0 rgba(0,0,0,0.08)',
    surfaceRaised: '#FFFFFF', surfaceSunken: '#D8DCE0',
    hoverBg: '#2070E0', hoverText: '#FFFFFF', activeBg: '#1048A0', activeText: '#FFFFFF', disabledBg: '#E8ECF0', disabledText: '#889098',
    feedbackSuccess: '#40A050', feedbackWarning: '#C0A040', feedbackError: '#D04040', feedbackInfo: '#2070E0',
    vinylBlack: '#C8D0D8', vinylGroove: '#B0B8C0', vinylLabel: '#2070E0', vinylShine: '#D0D8E0',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: 'none', bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'false',
  },
}

// ═══════════════════════════════════════════════════════════
// IBM PC — Beige chassis, green text, classic 5150
// ═══════════════════════════════════════════════════════════
const ibmPc: ThemeDefinition = {
  id: 'ibm-pc',
  labelKey: 'theme.name.ibmPc',
  category: 'retro-computers',
  descriptionKey: 'theme.desc.ibmPc',
  tokens: {
    bgApp: '#C8C0A8', bgPanel: '#D8D0B8', bgPanelLight: '#E8E0C8', bgElevated: '#F4ECD8', bgPanelHover: '#E0D8C0',
    textPrimary: '#1A1810', textSecondary: '#484030', textTertiary: '#887858', textInverse: '#C8C0A8', textLink: '#286828',
    accent: '#485030', accentDark: '#283018', accentSecondary: '#286828', accentTertiary: '#687848', accentPositive: '#287828', accentNegative: '#A02020',
    border: '#B8B098', borderLight: '#D8D0B8', borderFocus: '#485030', borderWidth: '3px', borderRadius: '0',
    shadowPanel: '2px 2px 0 0 rgba(0,0,0,0.12)', shadowButton: 'inset -1px -1px 0 0 rgba(0,0,0,0.15), inset 1px 1px 0 0 rgba(255,255,255,0.4), 1px 1px 0 0 rgba(0,0,0,0.15)', shadowButtonInset: 'inset 1px 1px 0 0 rgba(0,0,0,0.15), inset -1px -1px 0 0 rgba(255,255,255,0.3)',
    surfaceRaised: '#F4ECD8', surfaceSunken: '#B8B098',
    hoverBg: '#485030', hoverText: '#C8C0A8', activeBg: '#283018', activeText: '#D8D0B8', disabledBg: '#D8D0B8', disabledText: '#887858',
    feedbackSuccess: '#287828', feedbackWarning: '#787828', feedbackError: '#A02020', feedbackInfo: '#286828',
    vinylBlack: '#A09880', vinylGroove: '#888070', vinylLabel: '#485030', vinylShine: '#B8B098',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: PatternPresets.warmPaper, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'false',
  },
}

// ═══════════════════════════════════════════════════════════
// Windows 98 — Teal desktop with gradient blue title bars
// ═══════════════════════════════════════════════════════════
const windows98: ThemeDefinition = {
  id: 'windows-98',
  labelKey: 'theme.name.win98',
  category: 'retro-computers',
  descriptionKey: 'theme.desc.win98',
  tokens: {
    bgApp: '#008080', bgPanel: '#C0C0C0', bgPanelLight: '#E8E8E8', bgElevated: '#FFFFFF', bgPanelHover: '#D8D8D8',
    textPrimary: '#000000', textSecondary: '#404040', textTertiary: '#808080', textInverse: '#FFFFFF', textLink: '#0000FF',
    accent: '#0000A8', accentDark: '#000060', accentSecondary: '#008080', accentTertiary: '#A0A0A0', accentPositive: '#008000', accentNegative: '#FF0000',
    border: '#808080', borderLight: '#E8E8E8', borderFocus: '#0000A8', borderWidth: '3px', borderRadius: '0',
    shadowPanel: '2px 2px 0 0 #808080, -2px -2px 0 0 #FFFFFF, inset 0 0 0 1px #C0C0C0', shadowButton: 'inset -1px -1px 0 0 #808080, inset 1px 1px 0 0 #FFFFFF, 1px 1px 0 0 #404040', shadowButtonInset: 'inset 1px 1px 0 0 #808080, inset -1px -1px 0 0 #FFFFFF',
    surfaceRaised: '#FFFFFF', surfaceSunken: '#C0C0C0',
    hoverBg: '#0000A8', hoverText: '#FFFFFF', activeBg: '#808080', activeText: '#FFFFFF', disabledBg: '#C0C0C0', disabledText: '#808080',
    feedbackSuccess: '#008000', feedbackWarning: '#808000', feedbackError: '#FF0000', feedbackInfo: '#0000A8',
    vinylBlack: '#404040', vinylGroove: '#606060', vinylLabel: '#0000A8', vinylShine: '#808080',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: 'none', bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'false',
  },
}

// ═══════════════════════════════════════════════════════════
// Commodore 64 — Breadbin beige + classic blue BASIC screen
// ═══════════════════════════════════════════════════════════
const commodore64: ThemeDefinition = {
  id: 'commodore-64',
  labelKey: 'theme.name.c64',
  category: 'retro-computers',
  descriptionKey: 'theme.desc.c64',
  tokens: {
    bgApp: '#2018A0', bgPanel: '#2820B0', bgPanelLight: '#3028C8', bgElevated: '#3830D8', bgPanelHover: '#4038E8',
    textPrimary: '#A8A0FF', textSecondary: '#7870D0', textTertiary: '#4038A0', textInverse: '#2018A0', textLink: '#E0D0FF',
    accent: '#7868E0', accentDark: '#4840A0', accentSecondary: '#A0D0FF', accentTertiary: '#FFE080', accentPositive: '#60D060', accentNegative: '#E05050',
    border: '#3830C8', borderLight: '#2820B0', borderFocus: '#A0D0FF', borderWidth: '4px', borderRadius: '0',
    shadowPanel: '4px 4px 0 0 rgba(0, 0, 0, 0.45)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.35), inset 2px 2px 0 0 rgba(255,255,255,0.08)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.35), inset -2px -2px 0 0 rgba(255,255,255,0.08)',
    surfaceRaised: '#3830D8', surfaceSunken: '#140E70',
    hoverBg: '#A0D0FF', hoverText: '#2018A0', activeBg: '#7868E0', activeText: '#A8A0FF', disabledBg: '#2820B0', disabledText: '#4038A0',
    feedbackSuccess: '#60D060', feedbackWarning: '#FFE080', feedbackError: '#E05050', feedbackInfo: '#A0D0FF',
    vinylBlack: '#140E70', vinylGroove: '#3028C8', vinylLabel: '#FFE080', vinylShine: '#3830D8',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'heavy', isDark: 'false',
  },
}

// ═══════════════════════════════════════════════════════════
// Atari ST — Grey GEM desktop with green accents
// ═══════════════════════════════════════════════════════════
const atariSt: ThemeDefinition = {
  id: 'atari-st',
  labelKey: 'theme.name.atariSt',
  category: 'retro-computers',
  descriptionKey: 'theme.desc.atariSt',
  tokens: {
    bgApp: '#286828', bgPanel: '#D0D0D0', bgPanelLight: '#E8E8E8', bgElevated: '#FFFFFF', bgPanelHover: '#DCDCDC',
    textPrimary: '#000000', textSecondary: '#404040', textTertiary: '#808080', textInverse: '#FFFFFF', textLink: '#206820',
    accent: '#000000', accentDark: '#404040', accentSecondary: '#286828', accentTertiary: '#808080', accentPositive: '#287828', accentNegative: '#C02020',
    border: '#A0A0A0', borderLight: '#E8E8E8', borderFocus: '#286828', borderWidth: '3px', borderRadius: '2px',
    shadowPanel: '1px 1px 0 0 #FFFFFF, -1px -1px 0 0 #A0A0A0, inset 0 0 0 1px #C0C0C0', shadowButton: 'inset -1px -1px 0 0 #A0A0A0, inset 1px 1px 0 0 #FFFFFF, 1px 1px 0 0 #606060', shadowButtonInset: 'inset 1px 1px 0 0 #A0A0A0, inset -1px -1px 0 0 #FFFFFF',
    surfaceRaised: '#FFFFFF', surfaceSunken: '#C0C0C0',
    hoverBg: '#286828', hoverText: '#FFFFFF', activeBg: '#000000', activeText: '#FFFFFF', disabledBg: '#D0D0D0', disabledText: '#A0A0A0',
    feedbackSuccess: '#287828', feedbackWarning: '#888828', feedbackError: '#C02020', feedbackInfo: '#286828',
    vinylBlack: '#A0A0A0', vinylGroove: '#888888', vinylLabel: '#286828', vinylShine: '#C0C0C0',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: 'none', bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'false',
  },
}

export const retroComputers: ThemeDefinition[] = [
  amiga, windows95, windows98, windows31, msDos, dosBlue, macClassic,
  windowsXp, windowsVista, windows7, windows2000, macOsxAqua, ibmPc,
  commodore64, atariSt,
]
