/**
 * Music & Audio themes:
 * Vinyl Studio, Cassette Player,
 * Walkman, Hi-Fi Stereo, Boombox, Studio Monitor
 */
import type { ThemeDefinition } from '../types'
import { PatternPresets } from '../patterns'

// ═══════════════════════════════════════════════════════════
// Vinyl Studio — Warm analog listening lounge
// ═══════════════════════════════════════════════════════════
const vinylStudio: ThemeDefinition = {
  id: 'vinyl-studio',
  labelKey: 'theme.name.vinylStudio',
  category: 'music-audio',
  descriptionKey: 'theme.desc.vinylStudio',
  tokens: {
    bgApp: '#1E1812', bgPanel: '#2C2218', bgPanelLight: '#3D3022', bgElevated: '#4E3D2A', bgPanelHover: '#5E4830',
    textPrimary: '#F0E8D0', textSecondary: '#B8A080', textTertiary: '#6B5540', textInverse: '#1E1812', textLink: '#D4A050',
    accent: '#C49450', accentDark: '#8B6030', accentSecondary: '#D4A868', accentTertiary: '#E8D4A0', accentPositive: '#70B868', accentNegative: '#C45050',
    border: '#3D3022', borderLight: '#2C2218', borderFocus: '#D4A050', borderWidth: '4px', borderRadius: '0',
    shadowPanel: '4px 4px 0 0 rgba(0, 0, 0, 0.55)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.45), inset 2px 2px 0 0 rgba(255,255,255,0.06)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.45), inset -2px -2px 0 0 rgba(255,255,255,0.06)',
    surfaceRaised: '#4E3D2A', surfaceSunken: '#120E0A',
    hoverBg: '#C49450', hoverText: '#1E1812', activeBg: '#8B6030', activeText: '#F0E8D0', disabledBg: '#2C2218', disabledText: '#6B5540',
    feedbackSuccess: '#70B868', feedbackWarning: '#D4A050', feedbackError: '#C45050', feedbackInfo: '#D4A868',
    vinylBlack: '#0A0806', vinylGroove: '#2C2218', vinylLabel: '#C49450', vinylShine: '#4E3D2A',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: PatternPresets.warmPaper, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'heavy', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Cassette Player — Warm 80s tape aesthetic
// ═══════════════════════════════════════════════════════════
const cassette: ThemeDefinition = {
  id: 'cassette',
  labelKey: 'theme.name.cassette',
  category: 'music-audio',
  descriptionKey: 'theme.desc.cassette',
  tokens: {
    bgApp: '#1E1410', bgPanel: '#2E2018', bgPanelLight: '#3D2A20', bgElevated: '#4E3528', bgPanelHover: '#5E4030',
    textPrimary: '#F0E0C8', textSecondary: '#C09870', textTertiary: '#705840', textInverse: '#1E1410', textLink: '#E8A040',
    accent: '#E08040', accentDark: '#B05020', accentSecondary: '#F0A868', accentTertiary: '#FFD8A0', accentPositive: '#80B860', accentNegative: '#D05040',
    border: '#3D2A20', borderLight: '#2E2018', borderFocus: '#F0A868', borderWidth: '4px', borderRadius: '0',
    shadowPanel: '4px 4px 0 0 rgba(0, 0, 0, 0.5)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.45), inset 2px 2px 0 0 rgba(255,255,255,0.05)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.45), inset -2px -2px 0 0 rgba(255,255,255,0.05)',
    surfaceRaised: '#4E3528', surfaceSunken: '#100A08',
    hoverBg: '#E08040', hoverText: '#1E1410', activeBg: '#B05020', activeText: '#F0E0C8', disabledBg: '#2E2018', disabledText: '#705840',
    feedbackSuccess: '#80B860', feedbackWarning: '#E8A040', feedbackError: '#D05040', feedbackInfo: '#F0A868',
    vinylBlack: '#100A08', vinylGroove: '#3D2A20', vinylLabel: '#E08040', vinylShine: '#4E3528',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: PatternPresets.warmPaper, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'heavy', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Walkman — Sony yellow + dark grey, portable cassette era
// ═══════════════════════════════════════════════════════════
const walkman: ThemeDefinition = {
  id: 'walkman',
  labelKey: 'theme.name.walkman',
  category: 'music-audio',
  descriptionKey: 'theme.desc.walkman',
  tokens: {
    bgApp: '#1A1A1A', bgPanel: '#282828', bgPanelLight: '#363636', bgElevated: '#444444', bgPanelHover: '#525252',
    textPrimary: '#F0E830', textSecondary: '#D0C830', textTertiary: '#685828', textInverse: '#1A1A1A', textLink: '#F0F040',
    accent: '#F0D830', accentDark: '#C0A820', accentSecondary: '#F0F040', accentTertiary: '#FFF8A0', accentPositive: '#60C040', accentNegative: '#E05050',
    border: '#363636', borderLight: '#282828', borderFocus: '#F0F040', borderWidth: '3px', borderRadius: '2px',
    shadowPanel: '3px 3px 0 0 rgba(0, 0, 0, 0.55)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.45), inset 2px 2px 0 0 rgba(255,255,255,0.06)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.45), inset -2px -2px 0 0 rgba(255,255,255,0.06)',
    surfaceRaised: '#444444', surfaceSunken: '#0E0E0E',
    hoverBg: '#F0D830', hoverText: '#1A1A1A', activeBg: '#C0A820', activeText: '#F0E830', disabledBg: '#282828', disabledText: '#685828',
    feedbackSuccess: '#60C040', feedbackWarning: '#F0D830', feedbackError: '#E05050', feedbackInfo: '#F0F040',
    vinylBlack: '#0E0E0E', vinylGroove: '#363636', vinylLabel: '#F0D830', vinylShine: '#444444',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Hi-Fi Stereo — Silver + blue VU meters, audiophile grade
// ═══════════════════════════════════════════════════════════
const hifiStereo: ThemeDefinition = {
  id: 'hifi-stereo',
  labelKey: 'theme.name.hifiStereo',
  category: 'music-audio',
  descriptionKey: 'theme.desc.hifiStereo',
  tokens: {
    bgApp: '#1A1A20', bgPanel: '#282830', bgPanelLight: '#363640', bgElevated: '#444450', bgPanelHover: '#525260',
    textPrimary: '#E8E8F0', textSecondary: '#A0A0B8', textTertiary: '#585870', textInverse: '#1A1A20', textLink: '#80C0F0',
    accent: '#5068A0', accentDark: '#304870', accentSecondary: '#A0D0F0', accentTertiary: '#D0E8FF', accentPositive: '#50B060', accentNegative: '#D05060',
    border: '#363640', borderLight: '#282830', borderFocus: '#80C0F0', borderWidth: '3px', borderRadius: '3px',
    shadowPanel: '3px 3px 0 0 rgba(0, 0, 0, 0.45)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.35), inset 2px 2px 0 0 rgba(255,255,255,0.08)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.35), inset -2px -2px 0 0 rgba(255,255,255,0.08)',
    surfaceRaised: '#444450', surfaceSunken: '#101018',
    hoverBg: '#5068A0', hoverText: '#E8E8F0', activeBg: '#304870', activeText: '#E8E8F0', disabledBg: '#282830', disabledText: '#585870',
    feedbackSuccess: '#50B060', feedbackWarning: '#C0B040', feedbackError: '#D05060', feedbackInfo: '#A0D0F0',
    vinylBlack: '#101018', vinylGroove: '#363640', vinylLabel: '#A0D0F0', vinylShine: '#444450',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Boombox — Bold red + black, 80s street sound system
// ═══════════════════════════════════════════════════════════
const boombox: ThemeDefinition = {
  id: 'boombox',
  labelKey: 'theme.name.boombox',
  category: 'music-audio',
  descriptionKey: 'theme.desc.boombox',
  tokens: {
    bgApp: '#1A0A0A', bgPanel: '#2E1010', bgPanelLight: '#441818', bgElevated: '#582020', bgPanelHover: '#682828',
    textPrimary: '#FFE0C0', textSecondary: '#E0A080', textTertiary: '#804838', textInverse: '#1A0A0A', textLink: '#FF8040',
    accent: '#E04030', accentDark: '#A02018', accentSecondary: '#FF8040', accentTertiary: '#FFB880', accentPositive: '#60B040', accentNegative: '#E04030',
    border: '#441818', borderLight: '#2E1010', borderFocus: '#FF8040', borderWidth: '4px', borderRadius: '0',
    shadowPanel: '4px 4px 0 0 rgba(0, 0, 0, 0.5)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.4), inset 2px 2px 0 0 rgba(255,255,255,0.06)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.4), inset -2px -2px 0 0 rgba(255,255,255,0.06)',
    surfaceRaised: '#582020', surfaceSunken: '#0F0505',
    hoverBg: '#E04030', hoverText: '#FFE0C0', activeBg: '#A02018', activeText: '#FFE0C0', disabledBg: '#2E1010', disabledText: '#804838',
    feedbackSuccess: '#60B040', feedbackWarning: '#FF8040', feedbackError: '#E04030', feedbackInfo: '#FF8040',
    vinylBlack: '#0F0505', vinylGroove: '#441818', vinylLabel: '#FF8040', vinylShine: '#582020',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'heavy', isDark: 'true',
  },
}

// ═══════════════════════════════════════════════════════════
// Studio Monitor — Flat grey + green, professional studio desk
// ═══════════════════════════════════════════════════════════
const studioMonitor: ThemeDefinition = {
  id: 'studio-monitor',
  labelKey: 'theme.name.studioMonitor',
  category: 'music-audio',
  descriptionKey: 'theme.desc.studioMonitor',
  tokens: {
    bgApp: '#14181A', bgPanel: '#1E2326', bgPanelLight: '#283034', bgElevated: '#323E44', bgPanelHover: '#3C4A50',
    textPrimary: '#D8E0E4', textSecondary: '#88989C', textTertiary: '#485458', textInverse: '#14181A', textLink: '#60E080',
    accent: '#40B050', accentDark: '#287030', accentSecondary: '#60E080', accentTertiary: '#90F0A0', accentPositive: '#40B050', accentNegative: '#E05050',
    border: '#283034', borderLight: '#1E2326', borderFocus: '#60E080', borderWidth: '3px', borderRadius: '2px',
    shadowPanel: '3px 3px 0 0 rgba(0, 0, 0, 0.5)', shadowButton: 'inset -2px -2px 0 0 rgba(0,0,0,0.4), inset 2px 2px 0 0 rgba(255,255,255,0.05)', shadowButtonInset: 'inset 2px 2px 0 0 rgba(0,0,0,0.4), inset -2px -2px 0 0 rgba(255,255,255,0.05)',
    surfaceRaised: '#323E44', surfaceSunken: '#0A0C0E',
    hoverBg: '#40B050', hoverText: '#14181A', activeBg: '#287030', activeText: '#D8E0E4', disabledBg: '#1E2326', disabledText: '#485458',
    feedbackSuccess: '#40B050', feedbackWarning: '#C0B040', feedbackError: '#E05050', feedbackInfo: '#60E080',
    vinylBlack: '#0A0C0E', vinylGroove: '#283034', vinylLabel: '#40B050', vinylShine: '#323E44',
    fontPixel: "'Press Start 2P', monospace", fontBody: "'VT323', system-ui, monospace",
    bgAppPattern: 'none', bgAppOverlay: PatternPresets.pixelNoise, bgAppNoise: '0', bgAppScanlines: '0',
    borderWeight: 'light', isDark: 'true',
  },
}

export const musicAudio: ThemeDefinition[] = [vinylStudio, cassette, walkman, hifiStereo, boombox, studioMonitor]
