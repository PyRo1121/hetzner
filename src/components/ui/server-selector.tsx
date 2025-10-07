'use client';

import { useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Globe } from 'lucide-react';

import { useAppStore } from '@/lib/store/app-store';
import type { Server } from '@/types';

const servers: { value: Server; label: string; icon: string; region: string }[] = [
  { value: 'Americas', label: 'Americas', icon: '🌎', region: 'US West' },
  { value: 'Europe', label: 'Europe', icon: '🌍', region: 'Amsterdam' },
  { value: 'Asia', label: 'Asia', icon: '🌏', region: 'Singapore' },
];

export function ServerSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { selectedServer, setSelectedServer } = useAppStore();

  const currentServer = servers.find((s) => s.value === selectedServer) || servers[0];

  const handleSelect = (server: Server) => {
    setSelectedServer(server);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-albion-gray-700 bg-albion-gray-900 px-4 py-2 text-sm font-medium text-white transition-all hover:border-neon-blue hover:bg-albion-gray-800 focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
        aria-label="Select server"
        aria-expanded={isOpen}
      >
        <Globe className="h-4 w-4 text-neon-blue" />
        <span className="text-lg" aria-hidden="true">
          {currentServer.icon}
        </span>
        <span className="hidden sm:inline">{currentServer.label}</span>
        <ChevronDown
          className={`h-4 w-4 text-albion-gray-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen ? <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-lg border border-albion-gray-700 bg-albion-gray-900 shadow-2xl"
            >
              <div className="p-2">
                {servers.map((server, index) => (
                  <motion.button
                    key={server.value}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15, delay: index * 0.05 }}
                    onClick={() => handleSelect(server.value)}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
                      selectedServer === server.value
                        ? 'bg-neon-blue/10 text-neon-blue'
                        : 'text-white hover:bg-albion-gray-800'
                    }`}
                  >
                    {/* Icon */}
                    <span className="text-2xl" aria-hidden="true">
                      {server.icon}
                    </span>

                    {/* Server Info */}
                    <div className="flex-1">
                      <div className="font-medium">{server.label}</div>
                      <div className="text-xs text-albion-gray-500">{server.region}</div>
                    </div>

                    {/* Check Mark */}
                    {selectedServer === server.value ? <Check className="h-5 w-5 text-neon-blue" /> : null}
                  </motion.button>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-albion-gray-700 bg-albion-gray-800/50 px-3 py-2">
                <p className="text-xs text-albion-gray-500">
                  Server selection affects market data and player searches
                </p>
              </div>
            </motion.div>
          </> : null}
      </AnimatePresence>
    </div>
  );
}
