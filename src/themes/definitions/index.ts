/**
 * Theme definitions index — exports all themes as a flat array
 * and a lookup map for the theme engine.
 */
import type { ThemeDefinition } from '../types'
import { classicConsoles } from './classic-consoles'
import { retroComputers } from './retro-computers'
import { crtTerminal } from './crt-terminal'
import { artistic } from './artistic'
import { musicAudio } from './music-audio'
import { natureMood } from './nature-mood'

/** All theme definitions in display order. */
export const ALL_THEMES: ThemeDefinition[] = [
  ...classicConsoles,
  ...retroComputers,
  ...crtTerminal,
  ...artistic,
  ...musicAudio,
  ...natureMood,
]

/** O(1) lookup by id. */
export const THEME_MAP: Record<string, ThemeDefinition> = {}
for (const def of ALL_THEMES) {
  THEME_MAP[def.id] = def
}

/** Re-export individual theme files for direct imports if needed. */
export { classicConsoles } from './classic-consoles'
export { retroComputers } from './retro-computers'
export { crtTerminal } from './crt-terminal'
export { artistic } from './artistic'
export { musicAudio } from './music-audio'
export { natureMood } from './nature-mood'
