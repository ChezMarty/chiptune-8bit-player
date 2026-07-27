import { useCallback, useEffect, useState } from 'react'
import { dspEngine } from '../../../dsp/DspEngine'
import { useT } from '../../../i18n/useT'
import type { Preset } from '../../../dsp/types'

interface PresetsTabProps {
  /** Callback invoked after a preset is applied — used to refresh other tabs. */
  onPresetApplied?: () => void
}

/**
 * Presets Tab — browse, apply, and manage audio presets.
 */
export function PresetsTab({ onPresetApplied }: PresetsTabProps) {
  const { t } = useT()
  const [presets, setPresets] = useState<Preset[]>([])
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [saveOverwriteConfirm, setSaveOverwriteConfirm] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [renamingPreset, setRenamingPreset] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

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

  const doSavePreset = useCallback(async (name: string) => {
    const chain = dspEngine.serializeChain()
    const preset: Preset = {
      formatVersion: 1,
      name,
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
    setSaveOverwriteConfirm(null)
    onPresetApplied?.()
  }, [onPresetApplied])

  const handleSave = useCallback(async () => {
    if (!newPresetName.trim()) return
    const name = newPresetName.trim()

    const existing = presets.find((p) => p.name.toLowerCase() === name.toLowerCase())
    if (existing && existing.author !== 'Chiptune 8-Bit Player') {
      setSaveOverwriteConfirm(name)
      return
    }

    await doSavePreset(name)
  }, [newPresetName, presets, doSavePreset])

  const handleSaveOverwrite = useCallback(async () => {
    if (!saveOverwriteConfirm) return
    await doSavePreset(saveOverwriteConfirm)
    setSaveOverwriteConfirm(null)
  }, [saveOverwriteConfirm, doSavePreset])

  const handleDelete = useCallback(
    async (name: string) => {
      setConfirmDelete(name)
    },
    [],
  )

  const confirmDeleteAction = useCallback(async () => {
    if (!confirmDelete) return
    await dspEngine.presetManager.deletePreset(confirmDelete)
    if (activePreset === confirmDelete) {
      setActivePreset(null)
    }
    setConfirmDelete(null)
  }, [confirmDelete, activePreset])

  const handleDuplicate = useCallback(
    async (name: string) => {
      let newName = `${name} (copy)`
      let counter = 1
      while (presets.some((p) => p.name === newName && p.author !== 'Chiptune 8-Bit Player')) {
        counter++
        newName = `${name} (copy ${counter})`
      }
      await dspEngine.presetManager.duplicatePreset(name, newName)
      dspEngine.applyPresetByName(newName)
      setActivePreset(newName)
      onPresetApplied?.()
    },
    [presets, onPresetApplied],
  )

  const handleRename = useCallback(
    async (oldName: string, newName: string) => {
      if (!newName.trim() || newName.trim() === oldName) {
        setRenamingPreset(null)
        return
      }
      await dspEngine.presetManager.renamePreset(oldName, newName.trim())
      if (activePreset === oldName) {
        setActivePreset(newName.trim())
      }
      setRenamingPreset(null)
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
          placeholder={t('audioLab.presets.search.placeholder')}
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
          title={t('audioLab.presets.save.title')}
        >
          {t('audioLab.presets.save')}
        </button>
        <button
          className="pixel-button audio-lab__presets-btn"
          onClick={handleImport}
          title={t('audioLab.presets.import.title')}
        >
          {t('audioLab.presets.import')}
        </button>
      </div>

      {/* Save dialog */}
      {showSaveDialog && (
        <div className="audio-lab__presets-save-dialog">
          <input
            type="text"
            className="audio-lab__presets-save-input"
            placeholder={t('audioLab.presets.saveDialog')}
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') setShowSaveDialog(false)
            }}
          />
          <button className="pixel-button" onClick={handleSave} title={t('audioLab.presets.save.title')}>
            {t('audioLab.presets.save')}
          </button>
          <button
            className="pixel-button"
            onClick={() => setShowSaveDialog(false)}
            title={t('audioLab.presets.cancel')}
          >
            {t('audioLab.presets.cancel')}
          </button>
        </div>
      )}

      {/* Overwrite confirmation dialog */}
      {saveOverwriteConfirm && (
        <div className="audio-lab__presets-save-dialog">
          <div style={{ fontSize: '11px', marginBottom: '8px', fontFamily: 'var(--font-pixel, monospace)' }}>
            {t('audioLab.presets.overwrite', { name: saveOverwriteConfirm })}
          </div>
          <button className="pixel-button" onClick={handleSaveOverwrite} title={t('audioLab.presets.overwrite.title')}>
            {t('audioLab.presets.overwrite')}
          </button>
          <button
            className="pixel-button"
            onClick={() => setSaveOverwriteConfirm(null)}
            title={t('audioLab.presets.cancel')}
          >
            {t('audioLab.presets.cancel')}
          </button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div className="audio-lab__presets-save-dialog">
          <div style={{ fontSize: '11px', marginBottom: '8px', fontFamily: 'var(--font-pixel, monospace)' }}>
            {t('audioLab.presets.delete.confirm', { name: confirmDelete })}
          </div>
          <button className="pixel-button audio-lab__preset-card-delete" onClick={confirmDeleteAction} title={t('audioLab.presets.delete.title')}>
            {t('audioLab.presets.delete')}
          </button>
          <button
            className="pixel-button"
            onClick={() => setConfirmDelete(null)}
            title={t('audioLab.presets.cancel')}
          >
            {t('audioLab.presets.cancel')}
          </button>
        </div>
      )}

      {/* Built-in presets */}
      <div className="audio-lab__presets-section">
        <h3 className="audio-lab__presets-section-title">{t('audioLab.presets.builtin')}</h3>
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
          <h3 className="audio-lab__presets-section-title">{t('audioLab.presets.user')}</h3>
          <div className="audio-lab__presets-grid">
            {userPresets.map((preset) => (
              <PresetCard
                key={preset.name}
                preset={preset}
                isActive={activePreset === preset.name}
                onApply={handleApply}
                onDelete={handleDelete}
                onExport={handleExport}
                onDuplicate={handleDuplicate}
                onRename={handleRename}
                isRenaming={renamingPreset === preset.name}
                renameValue={renamingPreset === preset.name ? renameValue : undefined}
                onRenameChange={setRenameValue}
                onRenameStart={() => {
                  setRenamingPreset(preset.name)
                  setRenameValue(preset.name)
                }}
                onRenameCancel={() => setRenamingPreset(null)}
              />
            ))}
          </div>
        </div>
      )}

      {filteredPresets.length === 0 && (
        <div className="audio-lab__presets-empty">
          {t('audioLab.presets.empty')}
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
  onDuplicate?: (name: string) => void
  onRename?: (oldName: string, newName: string) => void
  isRenaming?: boolean
  renameValue?: string
  onRenameChange?: (value: string) => void
  onRenameStart?: () => void
  onRenameCancel?: () => void
}

function PresetCard({ preset, isActive, onApply, onDelete, onExport, onDuplicate, onRename, isRenaming, renameValue, onRenameChange, onRenameStart, onRenameCancel }: PresetCardProps) {
  const { t } = useT()
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
        {isRenaming ? (
          <input
            type="text"
            className="audio-lab__presets-save-input"
            value={renameValue}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onRenameChange?.(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === 'Enter') onRename?.(preset.name, renameValue ?? '')
              if (e.key === 'Escape') onRenameCancel?.()
            }}
            onBlur={() => onRename?.(preset.name, renameValue ?? '')}
          />
        ) : (
          <span className="audio-lab__preset-card-name">{preset.name}</span>
        )}
        {isActive && <span className="audio-lab__preset-card-active">{t('audioLab.presets.active')}</span>}
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
      <div className="audio-lab__preset-card-actions">          <button
            className="pixel-button"
            onClick={(e) => {
              e.stopPropagation()
              onExport(preset)
            }}
            title={t('audioLab.presets.export.title')}
          >
            {t('audioLab.presets.export')}
          </button>
        {onDuplicate && (
          <button
            className="pixel-button"
            onClick={(e) => {
              e.stopPropagation()
              onDuplicate(preset.name)
            }}
          >
            {t('audioLab.presets.duplicate')}
          </button>
        )}
        {onRenameStart && (
          <button
            className="pixel-button"
            onClick={(e) => {
              e.stopPropagation()
              onRenameStart()
            }}
          >
            {t('audioLab.presets.rename')}
          </button>
        )}
        {onDelete && (
          <button
            className="pixel-button audio-lab__preset-card-delete"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(preset.name)
            }}
          >
            {t('audioLab.presets.delete')}
          </button>
        )}
      </div>
    </div>
  )
}
