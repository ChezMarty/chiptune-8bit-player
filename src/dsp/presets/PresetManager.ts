import type { Preset, ChainEffectSerialized } from '../types'

/**
 * PresetManager — manages built-in and user presets.
 *
 * Built-in presets are bundled with the app and loaded at startup.
 * User presets are stored in the app's data directory as JSON files
 * via the Tauri filesystem plugin.
 *
 * Each preset file contains the full chain configuration:
 * effect order, enable/disable state, parameter values, and metadata.
 */
export class PresetManager {
  private _builtinPresets: Preset[] = []
  private _userPresets: Preset[] = []
  private _onChange: ((presets: Preset[]) => void) | null = null

  /** Get all presets (built-in + user). */
  get allPresets(): Preset[] {
    return [...this._builtinPresets, ...this._userPresets]
  }

  /** Get only built-in presets. */
  get builtinPresets(): Preset[] {
    return [...this._builtinPresets]
  }

  /** Get only user presets. */
  get userPresets(): Preset[] {
    return [...this._userPresets]
  }

  /** Register a callback for when the preset list changes. */
  set onChange(cb: ((presets: Preset[]) => void) | null) {
    this._onChange = cb
  }

  /**
   * Load all presets at startup.
   * Built-in presets are loaded from the bundled JSON files.
   * User presets are loaded from the app data directory.
   */
  async loadPresets(): Promise<void> {
    // Load built-in presets (bundled via dynamic imports).
    await this._loadBuiltinPresets()

    // Load user presets from Tauri filesystem.
    await this._loadUserPresets()
  }

  /** Add and save a new user preset. */
  async savePreset(preset: Preset): Promise<void> {
    // Check if a preset with this name already exists — replace it.
    const existing = this._userPresets.findIndex((p) => p.name === preset.name)
    if (existing >= 0) {
      this._userPresets[existing] = preset
    } else {
      this._userPresets.push(preset)
    }
    await this._persistUserPresets()
    this._notifyChange()
  }

  /** Delete a user preset by name. */
  async deletePreset(name: string): Promise<void> {
    const idx = this._userPresets.findIndex((p) => p.name === name)
    if (idx < 0) return
    this._userPresets.splice(idx, 1)
    await this._persistUserPresets()
    this._notifyChange()
  }

  /** Rename a user preset. */
  async renamePreset(oldName: string, newName: string): Promise<void> {
    const preset = this._userPresets.find((p) => p.name === oldName)
    if (!preset) return
    preset.name = newName
    preset.updatedAt = new Date().toISOString()
    await this._persistUserPresets()
    this._notifyChange()
  }

  /** Duplicate a user preset. */
  async duplicatePreset(name: string, newName: string): Promise<void> {
    const original = this._userPresets.find((p) => p.name === name)
    if (!original) return
    const copy: Preset = {
      ...original,
      name: newName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this._userPresets.push(copy)
    await this._persistUserPresets()
    this._notifyChange()
  }

  /** Export a preset (allows user to save it wherever they want). */
  async exportPreset(preset: Preset): Promise<void> {
    try {
      const { save } = await import('@tauri-apps/plugin-dialog')
      const { writeTextFile } = await import('@tauri-apps/plugin-fs')
      const filePath = await save({
        filters: [
          { name: 'Preset', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        defaultPath: `${preset.name}.json`,
      })
      if (!filePath) return
      const content = JSON.stringify(preset, null, 2)
      await writeTextFile(filePath, content)
    } catch (e) {
      console.warn('[presets] Export failed (Tauri APIs may not be available):', e)
      // Fallback: download as blob.
      this._downloadAsFile(JSON.stringify(preset, null, 2), `${preset.name}.json`)
    }
  }

  /** Import a preset from a file chosen by the user. */
  async importPreset(): Promise<Preset | null> {
    try {
      const { open, message } = await import('@tauri-apps/plugin-dialog')
      const { readTextFile } = await import('@tauri-apps/plugin-fs')
      const selected = await open({
        filters: [
          { name: 'Preset', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        multiple: false,
      })
      if (!selected) return null

      const content = await readTextFile(selected as string)
      const preset = this._parsePresetFile(content)
      if (!preset) {
        await message('Invalid preset file.', {
          title: 'Import Error',
          kind: 'error',
        })
        return null
      }
      return preset
    } catch (e) {
      console.warn('[presets] Import failed:', e)
      return null
    }
  }

  /** Search presets by name, tags, or description. */
  search(query: string): Preset[] {
    const q = query.toLowerCase()
    return this.allPresets.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
    )
  }

  /** Filter presets by category/tags. */
  filterByCategory(category: string): Preset[] {
    return this.allPresets.filter(
      (p) =>
        p.category.toLowerCase() === category.toLowerCase() ||
        p.tags.some((t) => t.toLowerCase() === category.toLowerCase()),
    )
  }

  // ── Private ──────────────────────────────────────────────

  /** Load built-in presets that are bundled with the app. */
  private async _loadBuiltinPresets(): Promise<void> {
    // Built-in presets are embedded as static data.
    this._builtinPresets = BUILTIN_PRESETS.map((data) => ({
      ...data,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }))
  }

  /** Load user presets from the app data directory. */
  private async _loadUserPresets(): Promise<void> {
    try {
      const { appDataDir } = await import('@tauri-apps/api/path')
      const { readDir, readTextFile, exists, mkdir } = await import(
        '@tauri-apps/plugin-fs'
      )

      const dataDir = await appDataDir()
      const presetsDir = `${dataDir}/presets/user`

      // Ensure the directory exists.
      if (!(await exists(presetsDir))) {
        await mkdir(presetsDir, { recursive: true })
        return
      }

      const entries = await readDir(presetsDir)
      const loaded: Preset[] = []

      for (const entry of entries) {
        if (!entry.name || !entry.name.endsWith('.json')) continue
        try {
          const content = await readTextFile(`${presetsDir}/${entry.name}`)
          const preset = this._parsePresetFile(content)
          if (preset) loaded.push(preset)
        } catch {
          // Skip invalid files.
          console.warn(`[presets] Skipping invalid file: ${entry.name}`)
        }
      }

      this._userPresets = loaded
    } catch (e) {
      console.warn('[presets] Could not load user presets:', e)
      // Not critical — user presets start empty.
    }
  }

  /** Persist all user presets to disk. */
  private async _persistUserPresets(): Promise<void> {
    try {
      const { appDataDir } = await import('@tauri-apps/api/path')
      const { writeTextFile, exists, mkdir } = await import(
        '@tauri-apps/plugin-fs'
      )

      const dataDir = await appDataDir()
      const presetsDir = `${dataDir}/presets/user`

      // Ensure directory exists.
      if (!(await exists(presetsDir))) {
        await mkdir(presetsDir, { recursive: true })
      }

      // Write each preset as a separate JSON file.
      // Filename is sanitized preset name + .json
      for (const preset of this._userPresets) {
        const safeName = preset.name.replace(/[^a-zA-Z0-9_-]/g, '_')
        const filePath = `${presetsDir}/${safeName}.json`
        await writeTextFile(filePath, JSON.stringify(preset, null, 2))
      }
    } catch (e) {
      console.warn('[presets] Could not persist user presets:', e)
    }
  }

  /** Parse and validate a preset file's JSON content. */
  private _parsePresetFile(content: string): Preset | null {
    try {
      const data = JSON.parse(content)
      if (!data.name || !data.chain || !Array.isArray(data.chain)) {
        return null
      }
      return {
        formatVersion: data.formatVersion ?? 1,
        name: data.name,
        author: data.author ?? 'Unknown',
        description: data.description ?? '',
        category: data.category ?? 'custom',
        tags: data.tags ?? [],
        createdAt: data.createdAt ?? new Date().toISOString(),
        updatedAt: data.updatedAt ?? new Date().toISOString(),
        qualityPreset: data.qualityPreset ?? 'balanced',
        chain: data.chain,
      }
    } catch {
      return null
    }
  }

  /** Fallback download for non-Tauri environments. */
  private _downloadAsFile(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  /** Notify the onChange callback. */
  private _notifyChange(): void {
    this._onChange?.(this.allPresets)
  }
}

// ── Built-in Preset Data ─────────────────────────────────────

/** Helper to create a preset with specific EQ bands. */
function eqPreset(
  name: string,
  description: string,
  bands: number[],
  category: string = 'music',
  tags: string[] = [],
): Omit<Preset, 'createdAt' | 'updatedAt'> {
  const eqParams: Record<string, number | boolean | string> = { q: 1.0 }
  bands.forEach((gain, i) => {
    eqParams[`band${i + 1}`] = gain
  })

  const chain: ChainEffectSerialized[] = [
    { effectId: 'preamp', enabled: true, bypassed: false, parameters: { gain: 0 } },
    { effectId: 'equalizer-10band', enabled: true, bypassed: false, parameters: eqParams },
    { effectId: 'bass-boost', enabled: false, bypassed: false, parameters: { gain: 4.0, frequency: 100 } },
    { effectId: 'treble-boost', enabled: false, bypassed: false, parameters: { gain: 3.0, frequency: 8000 } },
    { effectId: 'balance', enabled: true, bypassed: false, parameters: { pan: 0 } },
    { effectId: 'stereo-width', enabled: false, bypassed: false, parameters: { width: 1.0 } },
    { effectId: 'master-volume', enabled: true, bypassed: false, parameters: { volume: 0.7 } },
  ]

  return {
    formatVersion: 1,
    name,
    author: 'Chiptune 8-Bit Player',
    description,
    category,
    tags,
    qualityPreset: 'balanced',
    chain,
  }
}

const BUILTIN_PRESETS: Omit<Preset, 'createdAt' | 'updatedAt'>[] = [
  eqPreset('Flat', 'No EQ adjustment — pure, uncolored sound.',
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'music', ['flat', 'neutral']),

  eqPreset('Rock', 'Enhanced low-end and presence for rock music.',
    [4, 3, 2, 1, 0, 0, 1, 2, 3, 4],
    'music', ['rock', 'energetic']),

  eqPreset('Pop', 'Slight bass boost with clear mids for vocals.',
    [3, 2, 1, 2, 1, 0, 0, 1, 2, 3],
    'music', ['pop', 'vocal']),

  eqPreset('Dance', 'Heavy bass with crisp highs for electronic/dance.',
    [5, 4, 3, 0, 0, 0, 0, 2, 4, 5],
    'music', ['dance', 'electronic', 'edm']),

  eqPreset('Classical', 'Natural sound with slight high-end lift for classical music.',
    [0, 0, 0, 0, 0, 0, 1, 2, 3, 4],
    'music', ['classical', 'orchestral']),

  eqPreset('Bass Boost', 'Maximized low-end with rolled-off highs for deep bass.',
    [6, 6, 5, 3, 0, 0, -1, -2, -2, -2],
    'music', ['bass', 'heavy']),

  eqPreset('Vocal', 'Mid-focused EQ for vocal clarity and presence.',
    [-1, -1, 0, 3, 4, 4, 3, 0, -1, -1],
    'music', ['vocal', 'podcast', 'speech']),

  eqPreset('Jazz', 'Warm low-mids with smooth highs for jazz music.',
    [3, 2, 2, 2, 1, 1, 0, 0, 1, 2],
    'music', ['jazz', 'warm']),

  eqPreset('Electronic', 'Punchy bass and crisp highs for electronic music.',
    [5, 4, 3, 0, -1, 0, 2, 3, 4, 5],
    'music', ['electronic', 'synth']),

  eqPreset('Acoustic', 'Clear, natural sound with presence boost for acoustic music.',
    [1, 1, 0, 1, 2, 2, 1, 0, 1, 2],
    'music', ['acoustic', 'folk']),

  eqPreset('Headphones', 'Subtle EQ correction for headphone listening.',
    [2, 1, 0, 0, 0, 0, 1, 2, 3, 3],
    'music', ['headphones', 'listening']),

  // Loudness preset — emulates Fletcher-Munson curve
  {
    formatVersion: 1,
    name: 'Loudness',
    author: 'Chiptune 8-Bit Player',
    description: 'Fletcher-Munson loudness compensation. Boosts bass and treble at lower listening levels.',
    category: 'music',
    tags: ['loudness', 'fletcher-munson', 'compensation'],
    qualityPreset: 'balanced',
    chain: [
      { effectId: 'preamp', enabled: true, bypassed: false, parameters: { gain: 0 } },
      {
        effectId: 'equalizer-10band', enabled: true, bypassed: false,
        parameters: {
          band1: 7, band2: 5, band3: 3, band4: 1, band5: 0,
          band6: 0, band7: 1, band8: 2, band9: 4, band10: 6,
          q: 0.7,
        },
      },
      { effectId: 'bass-boost', enabled: false, bypassed: false, parameters: { gain: 4.0, frequency: 100 } },
      { effectId: 'treble-boost', enabled: false, bypassed: false, parameters: { gain: 3.0, frequency: 8000 } },
      { effectId: 'balance', enabled: true, bypassed: false, parameters: { pan: 0 } },
      { effectId: 'stereo-width', enabled: false, bypassed: false, parameters: { width: 1.0 } },
      { effectId: 'master-volume', enabled: true, bypassed: false, parameters: { volume: 0.7 } },
    ],
  },
]
