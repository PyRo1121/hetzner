'use client';

/**
 * Cross-Server Comparator
 * Phase 1, Week 6, Day 37
 * - Asymmetric panel layout for side-by-side server data
 * - Syncs data sources between panels
 * - Resizable panels with drag handles
 * - Synchronized scrolling between comparisons
 * - Data alignment across servers
 */

import { useState, useRef, useEffect } from 'react';

import { GripVertical, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

import { useMarketPrices } from '@/hooks/use-market-prices';

type Server = 'Americas' | 'Europe' | 'Asia';

interface ComparisonData {
  itemId: string;
  itemName: string;
  americasPrice: number;
  europePrice: number;
  asiaPrice: number;
  bestServer: Server;
  priceDiff: number;
}

export function CrossServerComparator() {
  const [leftServer, setLeftServer] = useState<Server>('Americas');
  const [rightServer, setRightServer] = useState<Server>('Europe');
  const [panelWidth, setPanelWidth] = useState(50); // Percentage
  const [isDragging, setIsDragging] = useState(false);
  const [syncScroll, setSyncScroll] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);

  // Fetch data for both servers
  const { data: leftData } = useMarketPrices({
    itemIds: ['T4_BAG', 'T5_BAG', 'T6_BAG', 'T7_BAG', 'T8_BAG'],
    locations: ['Caerleon'],
  });

  const { data: rightData } = useMarketPrices({
    itemIds: ['T4_BAG', 'T5_BAG', 'T6_BAG', 'T7_BAG', 'T8_BAG'],
    locations: ['Caerleon'],
  });

  // Handle panel resize
  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) {return;}

    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Constrain between 20% and 80%
    setPanelWidth(Math.max(20, Math.min(80, newWidth)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  // Synchronized scrolling
  const handleScroll = (source: 'left' | 'right') => (e: React.UIEvent<HTMLDivElement>) => {
    if (!syncScroll) {return;}

    const scrollTop = e.currentTarget.scrollTop;
    
    if (source === 'left' && rightScrollRef.current) {
      rightScrollRef.current.scrollTop = scrollTop;
    } else if (source === 'right' && leftScrollRef.current) {
      leftScrollRef.current.scrollTop = scrollTop;
    }
  };

  // Compare prices
  const comparisonData: ComparisonData[] = (leftData || []).map(leftItem => {
    const rightItem = rightData?.find(r => r.itemId === leftItem.itemId);
    
    const leftPrice = leftItem.sellPriceMin;
    const rightPrice = rightItem?.sellPriceMin || 0;
    const priceDiff = rightPrice > 0 ? ((rightPrice - leftPrice) / leftPrice) * 100 : 0;

    return {
      itemId: leftItem.itemId,
      itemName: leftItem.itemId,
      americasPrice: leftServer === 'Americas' ? leftPrice : rightPrice,
      europePrice: leftServer === 'Europe' ? leftPrice : rightPrice,
      asiaPrice: 0,
      bestServer: leftPrice < rightPrice ? leftServer : rightServer,
      priceDiff,
    };
  });

  return (
    <div className="panel-float">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Cross-Server Price Comparison</h3>
          <p className="text-sm text-albion-gray-500">
            Compare market prices across different servers
          </p>
        </div>

        {/* Sync Toggle */}
        <button
          onClick={() => setSyncScroll(!syncScroll)}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            syncScroll
              ? 'bg-neon-blue text-white'
              : 'bg-albion-gray-800 text-albion-gray-400 hover:bg-albion-gray-700'
          }`}
        >
          <RefreshCw className={`h-4 w-4 ${syncScroll ? 'animate-spin' : ''}`} />
          Sync Scroll
        </button>
      </div>

      {/* Server Selectors */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-albion-gray-400">
            Left Panel
          </label>
          <select
            value={leftServer}
            onChange={(e) => setLeftServer(e.target.value as Server)}
            className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-800 px-4 py-2 text-white transition-colors focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue"
          >
            <option value="Americas">Americas</option>
            <option value="Europe">Europe</option>
            <option value="Asia">Asia</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-albion-gray-400">
            Right Panel
          </label>
          <select
            value={rightServer}
            onChange={(e) => setRightServer(e.target.value as Server)}
            className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-800 px-4 py-2 text-white transition-colors focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue"
          >
            <option value="Americas">Americas</option>
            <option value="Europe">Europe</option>
            <option value="Asia">Asia</option>
          </select>
        </div>
      </div>

      {/* Comparison Panels */}
      <div ref={containerRef} className="relative flex h-[600px] overflow-hidden rounded-lg border border-albion-gray-700">
        {/* Left Panel */}
        <div
          style={{ width: `${panelWidth}%` }}
          className="flex flex-col border-r border-albion-gray-700 bg-albion-gray-900"
        >
          <div className="border-b border-albion-gray-700 bg-albion-gray-800 px-4 py-3">
            <h4 className="font-semibold text-white">{leftServer}</h4>
          </div>
          
          <div
            ref={leftScrollRef}
            onScroll={handleScroll('left')}
            className="flex-1 overflow-y-auto"
          >
            {comparisonData.map((item) => (
              <div
                key={item.itemId}
                className="border-b border-albion-gray-800 p-4 hover:bg-albion-gray-800/50"
              >
                <p className="mb-2 text-sm font-medium text-white">{item.itemName}</p>
                <p className="text-2xl font-bold text-neon-blue">
                  {leftServer === 'Americas' ? item.americasPrice.toLocaleString() : null}
                  {leftServer === 'Europe' ? item.europePrice.toLocaleString() : null}
                  {leftServer === 'Asia' ? item.asiaPrice.toLocaleString() : null}
                  <span className="ml-2 text-sm text-albion-gray-500">silver</span>
                </p>
                {item.bestServer === leftServer ? <div className="mt-2 flex items-center gap-1 text-xs text-neon-green">
                    <TrendingDown className="h-3 w-3" />
                    <span>Best price</span>
                  </div> : null}
              </div>
            ))}
          </div>
        </div>

        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          className="absolute left-1/2 top-0 z-10 flex h-full w-4 -translate-x-1/2 cursor-col-resize items-center justify-center bg-albion-gray-700/50 hover:bg-neon-blue/50"
        >
          <GripVertical className="h-6 w-6 text-white" />
        </div>

        {/* Right Panel */}
        <div
          style={{ width: `${100 - panelWidth}%` }}
          className="flex flex-col bg-albion-gray-900"
        >
          <div className="border-b border-albion-gray-700 bg-albion-gray-800 px-4 py-3">
            <h4 className="font-semibold text-white">{rightServer}</h4>
          </div>
          
          <div
            ref={rightScrollRef}
            onScroll={handleScroll('right')}
            className="flex-1 overflow-y-auto"
          >
            {comparisonData.map((item) => (
              <div
                key={item.itemId}
                className="border-b border-albion-gray-800 p-4 hover:bg-albion-gray-800/50"
              >
                <p className="mb-2 text-sm font-medium text-white">{item.itemName}</p>
                <p className="text-2xl font-bold text-neon-blue">
                  {rightServer === 'Americas' ? item.americasPrice.toLocaleString() : null}
                  {rightServer === 'Europe' ? item.europePrice.toLocaleString() : null}
                  {rightServer === 'Asia' ? item.asiaPrice.toLocaleString() : null}
                  <span className="ml-2 text-sm text-albion-gray-500">silver</span>
                </p>
                <div className={`mt-2 flex items-center gap-1 text-xs ${
                  item.priceDiff > 0 ? 'text-neon-red' : 'text-neon-green'
                }`}>
                  {item.priceDiff > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{Math.abs(item.priceDiff).toFixed(1)}% diff</span>
                </div>
                {item.bestServer === rightServer ? <div className="mt-1 flex items-center gap-1 text-xs text-neon-green">
                    <TrendingDown className="h-3 w-3" />
                    <span>Best price</span>
                  </div> : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 rounded-lg border border-albion-gray-700 bg-albion-gray-800 p-4">
        <div>
          <p className="text-xs text-albion-gray-500">Items Compared</p>
          <p className="text-xl font-bold text-white">{comparisonData.length}</p>
        </div>
        <div>
          <p className="text-xs text-albion-gray-500">Avg Price Diff</p>
          <p className="text-xl font-bold text-white">
            {(comparisonData.reduce((sum, item) => sum + Math.abs(item.priceDiff), 0) / comparisonData.length || 0).toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-albion-gray-500">Best Server</p>
          <p className="text-xl font-bold text-neon-green">
            {leftServer}
          </p>
        </div>
      </div>
    </div>
  );
}
