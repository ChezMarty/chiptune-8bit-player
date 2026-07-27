import { useCallback, useEffect, useState } from 'react'
import { dspEngine } from '../../../dsp/DspEngine'
import type { Preset } from '../../../dsp/types'

interface PresetsTabProps {
  /** Callback invoked after a preset is applied — used to refresh other tabs. */
  onPresetApplied?: () => void
}

/**
 * Presets Tab — browse, apply, and manage audio presets.
 */
export function PresetsTab({ onPresetApplied }: PresetsTabProps) {
  const [presets, setPresets] = useState<Preset[]>([])
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')

  // Load presets.
  useEffect(() => {
    const pm = dspEngine.presetManager
    setPresets(pm.allPresets)
    setActivePreset(dspEngine.getActivePresetName())

    // Subscribe to preset changes.
    pm.onChange = (all: Preset[]) => {
      setPresets(all)
    }

    return () => {
      pm.onChange = null
    }
  }, [])

  // Filter presets based on search and category.
  const filteredPresets = presets.filter((p) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (
        !p.name.toLowerCase().includes(q) &&
        !p.description.toLowerCase().includes(q) &&
        !p.tags.some((t) => t.toLowerCase().includes(q))
      ) {
        return false
      }
    }
    if (filterCategory !== 'all' && p.category !== filterCategory) {
      return false
    }
    return true
  })

  const builtinPresets = filteredPresets.filter((p) => p.author === 'Chiptune 8-Bit Player')
  const userPresets = filteredPresets.filter((p) => p.author !== 'Chiptune 8-Bit Player')

  const handleApply = useCallback((preset: Preset) => {
    dspEngine.applyPreset(preset)
    setActivePreset(preset.name)
    onPresetApplied?.()
  }, [onPresetApplied])

  const handleSave = useCallback(async () => {
    if (!newPresetName.trim()) return

    const chain = dspEngine.serializeChain()
    const preset: Preset = {
      formatVersion: 1,
      name: newPresetName.trim(),
      author: 'User',
      description: '',
      category: 'custom',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      qualityPreset: 'balanced',
      chain,
    }

    await dspEngine.presetManager.savePreset(preset)
    dspEngine.applyPreset(preset)
    setShowSaveDialog(false)
    setNewPresetName('')
    setActivePreset(preset.name)
    onPresetApplied?.()
  }, [newPresetName, onPresetApplied])

  const handleDelete = useCallback(
    async (name: string) => {
      await dspEngine.presetManager.deletePreset(name)
      if (activePreset === name) {
        setActivePreset(null)
      }
    },
    [activePreset],
  )

  const handleExport = useCallback(
    async (preset: Preset) => {
      await dspEngine.presetManager.exportPreset(preset)
    },
    [],
  )

  const handleImport = useCallback(async () => {
    const preset = await dspEngine.presetManager.importPreset()
    if (preset) {
      await dspEngine.presetManager.savePreset(preset)
      dspEngine.applyPreset(preset)
      onPresetApplied?.()
    }
  }, [onPresetApplied])

  const categories = ['all', ...new Set(presets.map((p) => p.category))]

  return (
    <div className="audio-lab__presets">
      {/* Toolbar */}
      <div className="audio-lab__presets-toolbar">
        <input
          type="text"
          className="audio-lab__presets-search"
          placeholder="Search presets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="audio-lab__presets-filter"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
        <button
          className="pixel-button audio-lab__presets-btn"
          onClick={() => setShowSaveDialog(true)}
        >
          SAVE
        </button>
        <button
          className="pixel-button audio-lab__presets-btn"
          onClick={handleImport}
        >
          IMPORT
        </button>
      </div>

      {/* Save dialog */}
      {showSaveDialog && (
        <div className="audio-lab__presets-save-dialog">
          <input
            type="text"
            className="audio-lab__presets-save-input"
            placeholder="Preset name..."
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') setShowSaveDialog(false)
            }}
          />
          <button className="pixel-button" onClick={handleSave}>
            SAVE
          </button>
          <button
            className="pixel-button"
            onClick={() => setShowSaveDialog(false)}
          >
            CANCEL
          </button>
        </div>
      )}

      {/* Built-in presets */}
      <div className="audio-lab__presets-section">
        <h3 className="audio-lab__presets-section-title">Built-in Presets</h3>
        <div className="audio-lab__presets-grid">
          {builtinPresets.map((preset) => (
            <PresetCard
              key={preset.name}
              preset={preset}
              isActive={activePreset === preset.name}
              onApply={handleApply}
              onExport={handleExport}
            />
          ))}
        </div>
      </div>

      {/* User presets */}
      {userPresets.length > 0 && (
        <div className="audio-lab__presets-section">
          <h3 className="audio-lab__presets-section-title">User Presets</h3>
          <div className="audio-lab__presets-grid">
            {userPresets.map((preset) => (
              <PresetCard
                key={preset.name}
                preset={preset}
                isActive={activePreset === preset.name}
                onApply={handleApply}
                onDelete={handleDelete}
                onExport={handleExport}
              />
            ))}
          </div>
        </div>
      )}

      {filteredPresets.length === 0 && (
        <div className="audio-lab__presets-empty">
          No presets match your search.
        </div>
      )}
    </div>
  )
}

// ── Preset Card Component ────────────────────────────────

interface PresetCardProps {
  preset: Preset
  isActive: boolean
  onApply: (preset: Preset) => void
  onDelete?: (name: string) => void
  onExport: (preset: Preset) => void
}

function PresetCard({ preset, isActive, onApply, onDelete, onExport }: PresetCardProps) {
  return (
    <div
      className={`audio-lab__preset-card ${isActive ? 'is-active' : ''}`}
      onClick={() => onApply(preset)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onApply(preset)
        }
      }}
    >
      <div className="audio-lab__preset-card-header">
        <span className="audio-lab__preset-card-name">{preset.name}</span>
        {isActive && <span className="audio-lab__preset-card-active">ACTIVE</span>}
      </div>
      {preset.description && (
        <p className="audio-lab__preset-card-desc">{preset.description}</p>
      )}
      <div className="audio-lab__preset-card-tags">
        {preset.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="audio-lab__preset-card-tag">
            {tag}
          </span>
        ))}
        {preset.tags.length > 3 && (
          <span className="audio-lab__preset-card-tag">+{preset.tags.length - 3}</span>
        )}
      </div>
      <div className="audio-lab__preset-card-actions">
        <button
          className="pixel-button"
          onClick={(e) => {
            e.stopPropagation()
            onExport(preset)
          }}
        >
          EXPORT
        </button>
        {onDelete && (
          <button
            className="pixel-button audio-lab__preset-card-delete"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(preset.name)
            }}
          >
            DELETE
          </button>
        )}
      </div>
    </div>
  )
}
