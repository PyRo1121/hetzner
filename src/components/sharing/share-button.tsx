'use client';

import { useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Copy, Download, Check } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  data: any;
  filename?: string;
}

export function ShareButton({ title, data, filename = 'albion-data' }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownloadJSON = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    // Convert data to CSV
    const items = Array.isArray(data) ? data : [data];
    if (items.length === 0) {return;}

    const headers = Object.keys(items[0]);
    const csv = [
      headers.join(','),
      ...items.map(item => headers.map(h => item[h]).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-secondary flex items-center gap-2"
      >
        <Share2 className="h-4 w-4" />
        Share
      </button>

      <AnimatePresence>
        {isOpen ? <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-albion-gray-700 bg-albion-gray-900 p-2 shadow-2xl"
            >
              <div className="mb-2 border-b border-albion-gray-700 px-2 pb-2">
                <div className="text-sm font-semibold text-white">{title}</div>
              </div>

              <div className="space-y-1">
                <button
                  onClick={handleCopyLink}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-albion-gray-800"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-neon-green" />
                  ) : (
                    <Copy className="h-4 w-4 text-albion-gray-400" />
                  )}
                  <span className="text-white">
                    {copied ? 'Link Copied!' : 'Copy Link'}
                  </span>
                </button>

                <button
                  onClick={handleDownloadJSON}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-albion-gray-800"
                >
                  <Download className="h-4 w-4 text-albion-gray-400" />
                  <span className="text-white">Download JSON</span>
                </button>

                <button
                  onClick={handleDownloadCSV}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-albion-gray-800"
                >
                  <Download className="h-4 w-4 text-albion-gray-400" />
                  <span className="text-white">Download CSV</span>
                </button>
              </div>
            </motion.div>
          </> : null}
      </AnimatePresence>
    </div>
  );
}
