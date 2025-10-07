'use client';

/**
 * Session Suggestions Component
 * Phase 1, Week 6, Day 36
 * - History-based filter recommendations
 * - Loads from localStorage
 * - Limit to 10 most recent items
 * - Clear history with confirmation
 * - Persists across browser sessions
 */

import { useState, useEffect } from 'react';

import { History, X, Trash2, Clock } from 'lucide-react';

interface FilterPreset {
  id: string;
  name: string;
  filters: {
    itemIds?: string[];
    cities?: string[];
    qualities?: number[];
    minPrice?: number;
    maxPrice?: number;
  };
  timestamp: number;
}

const STORAGE_KEY = 'albion_filter_history';
const MAX_HISTORY = 10;

export function SessionSuggestions({ onApplyFilters }: { onApplyFilters: (filters: any) => void }) {
  const [history, setHistory] = useState<FilterPreset[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // @ts-ignore
      const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setHistory(parsed.slice(0, MAX_HISTORY));
        }
      } catch (error) {
        console.error('Failed to load filter history:', error);
      }
    }
  }, []);

  // Save filter preset to history
  const saveToHistory = (filters: any, name?: string) => {
    const preset: FilterPreset = {
      // @ts-ignore
      id: crypto.randomUUID(),
      name: name ?? generateFilterName(filters),
      filters,
      timestamp: Date.now(),
    };

    const newHistory = [preset, ...history.filter(h => h.id !== preset.id)].slice(0, MAX_HISTORY);
    setHistory(newHistory);

    if (typeof window !== 'undefined') {
      try {
      // @ts-ignore
      // @ts-ignore
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      } catch (error) {
        console.error('Failed to save filter history:', error);
      }
    }
  };

  // Generate a readable name from filters
  const generateFilterName = (filters: any): string => {
    const parts: string[] = [];
    
    if (filters.cities?.length) {
      parts.push(`${filters.cities.length} ${filters.cities.length === 1 ? 'city' : 'cities'}`);
    }
    if (filters.qualities?.length) {
      parts.push(`Q${filters.qualities.join(',')}`);
    }
    if (filters.minPrice || filters.maxPrice) {
      parts.push('price filter');
    }
    
    return parts.length > 0 ? parts.join(' • ') : 'Custom filter';
  };

  // Apply a preset from history
  const applyPreset = (preset: FilterPreset) => {
    onApplyFilters(preset.filters);
    // Move to top of history
    saveToHistory(preset.filters, preset.name);
  };

  // Remove a single preset
  const removePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    
    try {
      // @ts-ignore
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Failed to update filter history:', error);
    }
  };

  // Clear all history
  const clearHistory = () => {
    setHistory([]);
    try {
      // @ts-ignore
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear filter history:', error);
    }
    setShowConfirm(false);
  };

  // Format timestamp
  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) {return 'Just now';}
    if (minutes < 60) {return `${minutes}m ago`;}
    if (hours < 24) {return `${hours}h ago`;}
    return `${days}d ago`;
  };

  // Expose saveToHistory for parent components
  useEffect(() => {
    (window as any).saveFilterToHistory = saveToHistory;
    return () => {
      delete (window as any).saveFilterToHistory;
    };
  }, [history]);

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="panel-float">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-neon-blue" />
          <h3 className="text-lg font-semibold">Recent Filters</h3>
        </div>
        
        <button
          onClick={() => setShowConfirm(true)}
          className="flex items-center gap-2 rounded-lg bg-albion-gray-800 px-3 py-1.5 text-sm text-albion-gray-400 transition-colors hover:bg-albion-gray-700 hover:text-neon-red"
        >
          <Trash2 className="h-4 w-4" />
          Clear All
        </button>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm ? <div className="mb-4 rounded-lg border border-neon-red/50 bg-neon-red/10 p-4">
          <p className="mb-3 text-sm font-medium text-white">
            Clear all filter history?
          </p>
          <div className="flex gap-2">
            <button
              onClick={clearHistory}
              className="flex-1 rounded-lg bg-neon-red px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neon-red/80"
            >
              Yes, Clear All
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 rounded-lg bg-albion-gray-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-albion-gray-700"
            >
              Cancel
            </button>
          </div>
        </div> : null}

      {/* History List */}
      <div className="space-y-2">
        {history.map((preset) => (
          <button
            key={preset.id}
            onClick={() => applyPreset(preset)}
            className="group flex w-full items-center justify-between rounded-lg border border-albion-gray-700 bg-albion-gray-800 p-3 text-left transition-all hover:border-neon-blue hover:bg-albion-gray-700"
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{preset.name}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-albion-gray-500">
                <Clock className="h-3 w-3" />
                <span>{formatTime(preset.timestamp)}</span>
              </div>
            </div>

            <button
              onClick={(e) => removePreset(preset.id, e)}
              className="ml-2 rounded p-1 text-albion-gray-500 opacity-0 transition-all hover:bg-albion-gray-900 hover:text-neon-red group-hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </button>
        ))}
      </div>

      {/* Info */}
      <p className="mt-4 text-xs text-albion-gray-500">
        Your {history.length} most recent filter{history.length !== 1 ? 's' : ''} • Saved locally
      </p>
    </div>
  );
}
