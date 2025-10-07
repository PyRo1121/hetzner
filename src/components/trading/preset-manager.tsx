'use client';

import { useState, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { Save, Trash2, Download, Upload, Plus, Check } from 'lucide-react';

import {
  getPresets,
  savePreset,
  deletePreset,
  exportPresets,
  importPresets,
  initializeDefaultPresets,
  type FilterPreset,
} from '@/lib/trading/presets';

interface PresetManagerProps {
  currentFilters: FilterPreset['filters'];
  onApplyPreset: (filters: FilterPreset['filters']) => void;
}

export function PresetManager({ currentFilters, onApplyPreset }: PresetManagerProps) {
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  useEffect(() => {
    initializeDefaultPresets();
    loadPresets();
  }, []);

  const loadPresets = () => {
    setPresets(getPresets());
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) {return;}

    try {
      savePreset({
        name: newPresetName,
        description: newPresetDescription || undefined,
        filters: currentFilters,
      });
      
      setNewPresetName('');
      setNewPresetDescription('');
      setIsCreating(false);
      loadPresets();
    } catch (error) {
      console.error('Failed to save preset:', error);
    }
  };

  const handleDeletePreset = (id: string) => {
    if (confirm('Are you sure you want to delete this preset?')) {
      deletePreset(id);
      if (selectedPresetId === id) {
        setSelectedPresetId(null);
      }
      loadPresets();
    }
  };

  const handleApplyPreset = (preset: FilterPreset) => {
    setSelectedPresetId(preset.id);
    onApplyPreset(preset.filters);
  };

  const handleExport = () => {
    const json = exportPresets();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-presets-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {return;}

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const count = importPresets(json);
        alert(`Successfully imported ${count} preset(s)`);
        loadPresets();
      } catch (error) {
        alert('Failed to import presets. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Filter Presets</h3>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={presets.length === 0}
            className="flex items-center gap-2 rounded-lg border border-albion-gray-700 bg-albion-gray-900 px-3 py-2 text-sm font-medium text-white transition-all hover:border-neon-blue hover:bg-albion-gray-800 disabled:opacity-50"
            title="Export presets"
          >
            <Download className="h-4 w-4" />
          </button>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-albion-gray-700 bg-albion-gray-900 px-3 py-2 text-sm font-medium text-white transition-all hover:border-neon-blue hover:bg-albion-gray-800">
            <Upload className="h-4 w-4" />
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center gap-2 rounded-lg bg-neon-blue px-3 py-2 text-sm font-medium text-white transition-all hover:bg-neon-blue/80"
          >
            <Plus className="h-4 w-4" />
            New
          </button>
        </div>
      </div>

      {/* Create New Preset Form */}
      <AnimatePresence>
        {isCreating ? <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-lg border border-albion-gray-700 bg-albion-gray-800 p-4"
          >
            <div className="space-y-3">
              <div>
                <label htmlFor="presetName" className="mb-2 block text-sm font-medium text-white">
                  Preset Name
                </label>
                <input
                  id="presetName"
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="e.g., My Trading Strategy"
                  className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-900 px-4 py-2 text-white placeholder-albion-gray-500 focus:border-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
                />
              </div>

              <div>
                <label htmlFor="presetDescription" className="mb-2 block text-sm font-medium text-white">
                  Description (Optional)
                </label>
                <input
                  id="presetDescription"
                  type="text"
                  value={newPresetDescription}
                  onChange={(e) => setNewPresetDescription(e.target.value)}
                  placeholder="Brief description of this preset"
                  className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-900 px-4 py-2 text-white placeholder-albion-gray-500 focus:border-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSavePreset}
                  disabled={!newPresetName.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-neon-green px-4 py-2 text-sm font-medium text-white transition-all hover:bg-neon-green/80 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  Save Preset
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewPresetName('');
                    setNewPresetDescription('');
                  }}
                  className="rounded-lg border border-albion-gray-700 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-albion-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div> : null}
      </AnimatePresence>

      {/* Preset List */}
      <div className="space-y-2">
        {presets.length === 0 ? (
          <div className="rounded-lg border border-albion-gray-700 bg-albion-gray-800/50 p-6 text-center">
            <p className="text-sm text-albion-gray-500">
              No presets saved yet. Create one to save your filter settings.
            </p>
          </div>
        ) : (
          presets.map((preset) => (
            <motion.div
              key={preset.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`group relative rounded-lg border p-4 transition-all ${
                selectedPresetId === preset.id
                  ? 'border-neon-blue bg-neon-blue/10'
                  : 'border-albion-gray-700 bg-albion-gray-800 hover:border-albion-gray-600'
              }`}
            >
              <div className="flex items-start justify-between">
                <button
                  onClick={() => handleApplyPreset(preset)}
                  className="flex-1 text-left"
                >
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white">{preset.name}</h4>
                    {selectedPresetId === preset.id ? <Check className="h-4 w-4 text-neon-green" /> : null}
                  </div>
                  {preset.description ? <p className="mt-1 text-sm text-albion-gray-500">{preset.description}</p> : null}
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-albion-gray-400">
                    <span>Min ROI: {preset.filters.minROI}%</span>
                    {preset.filters.minProfit ? <span>• Min Profit: {preset.filters.minProfit.toLocaleString()}</span> : null}
                    {preset.filters.maxInvestment ? <span>• Max Investment: {preset.filters.maxInvestment.toLocaleString()}</span> : null}
                  </div>
                </button>

                <button
                  onClick={() => handleDeletePreset(preset.id)}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  title="Delete preset"
                >
                  <Trash2 className="h-4 w-4 text-red-500 hover:text-red-400" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
