'use client';

import { useState, useEffect, useCallback } from 'react';

import { useRouter } from 'next/navigation';

import { motion, AnimatePresence } from 'framer-motion';
import { Search, TrendingUp, Swords, Package, X } from 'lucide-react';

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  const commands: Command[] = [
    {
      id: 'trading',
      label: 'Trading Hub',
      icon: <TrendingUp className="h-4 w-4" />,
      action: () => router.push('/trading'),
      category: 'Navigation',
    },
    {
      id: 'pvp',
      label: 'PvP Hub',
      icon: <Swords className="h-4 w-4" />,
      action: () => router.push('/pvp'),
      category: 'Navigation',
    },
    {
      id: 'items',
      label: 'Item Browser',
      icon: <Package className="h-4 w-4" />,
      action: () => router.push('/items'),
      category: 'Navigation',
    },
    {
      id: 'arbitrage',
      label: 'Arbitrage Calculator',
      icon: <TrendingUp className="h-4 w-4" />,
      action: () => router.push('/trading/arbitrage'),
      category: 'Tools',
    },
    {
      id: 'simulator',
      label: 'Trade Simulator',
      icon: <TrendingUp className="h-4 w-4" />,
      action: () => router.push('/trading/simulator'),
      category: 'Tools',
    },
    {
      id: 'leaderboards',
      label: 'PvP Leaderboards',
      icon: <Swords className="h-4 w-4" />,
      action: () => router.push('/pvp/leaderboards'),
      category: 'PvP',
    },
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const executeCommand = (command: Command) => {
    command.action();
    setIsOpen(false);
    setSearch('');
  };

  return (
    <AnimatePresence>
      {isOpen ? <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed left-1/2 top-1/4 z-50 w-full max-w-2xl -translate-x-1/2 rounded-lg border border-albion-gray-700 bg-albion-gray-900 shadow-2xl"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 border-b border-albion-gray-700 px-4 py-3">
              <Search className="h-5 w-5 text-albion-gray-500" />
              <input
                type="text"
                placeholder="Search commands..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder-albion-gray-500 outline-none"
                autoFocus
              />
              <button
                onClick={() => setIsOpen(false)}
                className="text-albion-gray-500 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Commands List */}
            <div className="max-h-96 overflow-y-auto p-2">
              {filteredCommands.length === 0 ? (
                <div className="py-8 text-center text-sm text-albion-gray-500">
                  No commands found
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredCommands.map((command) => (
                    <button
                      key={command.id}
                      onClick={() => executeCommand(command)}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-albion-gray-800"
                    >
                      <div className="text-neon-blue">{command.icon}</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{command.label}</div>
                        <div className="text-xs text-albion-gray-500">{command.category}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-albion-gray-700 px-4 py-2 text-xs text-albion-gray-500">
              Press <kbd className="rounded bg-albion-gray-800 px-1.5 py-0.5">Ctrl</kbd> +{' '}
              <kbd className="rounded bg-albion-gray-800 px-1.5 py-0.5">K</kbd> to toggle
            </div>
          </motion.div>
        </> : null}
    </AnimatePresence>
  );
}
