'use client';

/**
 * Item Price Viewer with AG Grid v32
 * Phase 1, Week 3, Day 15
 * - AG Grid with city/quality columns
 * - Lazy-load Render service icons
 * - Handles filtering by tier
 * - Displays 500+ rows smoothly
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import Image from 'next/image';

import { AgGridReact } from 'ag-grid-react';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import { useMarketPrices } from '@/hooks/use-market-prices';
import { getItemRenderPath } from '@/lib/render/item-icons';
import { itemsService } from '@/lib/services';

import type { ColDef, GridReadyEvent } from 'ag-grid-community';

// Custom cell renderer for item icons
function ItemIconRenderer(props: any) {
  const { itemId, quality } = props.data;

  return (
    <div className="flex h-full items-center gap-2">
      <div className="relative h-8 w-8">
        <Image
          src={
            getItemRenderPath(itemId, {
              quality: quality as 1 | 2 | 3 | 4 | 5,
              size: 32,
            }) ?? ''
          }
          alt={itemId}
          width={32}
          height={32}
          className="object-contain"
          loading="lazy"
        />
      </div>
      <span className="text-sm">{props.value}</span>
    </div>
  );
}

// Custom cell renderer for quality
function QualityRenderer(props: any) {
  const qualityColors: Record<number, string> = {
    1: 'text-gray-400',
    2: 'text-green-400',
    3: 'text-blue-400',
    4: 'text-purple-400',
    5: 'text-orange-400',
  };

  const qualityNames: Record<number, string> = {
    1: 'Normal',
    2: 'Good',
    3: 'Outstanding',
    4: 'Excellent',
    5: 'Masterpiece',
  };

  return (
    <span className={`font-medium ${qualityColors[props.value] || 'text-gray-400'}`}>
      {qualityNames[props.value] || props.value}
    </span>
  );
}

// Custom cell renderer for prices with formatting
function PriceRenderer(props: any) {
  return <span className="font-mono text-sm">{props.value?.toLocaleString() ?? '—'}</span>;
}

// Custom cell renderer for profit with color
function ProfitRenderer(props: any) {
  const profit = props.value ?? 0;
  const isPositive = profit > 0;

  return (
    <span
      className={`font-mono text-sm font-medium ${
        isPositive ? 'text-green-400' : profit < 0 ? 'text-red-400' : 'text-gray-400'
      }`}
    >
      {isPositive ? '+' : ''}
      {profit.toLocaleString()}
    </span>
  );
}

export function AGGridPriceViewer() {
  const { data: marketData, isLoading } = useMarketPrices({
    itemIds: ['T4_BAG', 'T5_BAG', 'T6_BAG', 'T7_BAG', 'T8_BAG'],
    locations: ['Caerleon', 'Bridgewatch', 'Lymhurst'],
  });

  const [itemNames, setItemNames] = useState<Map<string, string>>(new Map());

  // Load localized item names
  useEffect(() => {
    if (marketData && marketData.length > 0) {
      const itemIds = [...new Set(marketData.map((p) => p.itemId))];
      void itemsService.getByIds(itemIds).then((map) => {
        const names = new Map<string, string>();
        for (const [id, item] of map.entries()) {
          names.set(id, item.name);
        }
        setItemNames(names);
      });
    }
  }, [marketData]);

  // Transform data for AG Grid
  const rowData = useMemo(() => {
    if (!marketData) {
      return [];
    }

    return marketData.map((price) => {
      const profit = price.sellPriceMin - price.buyPriceMax;
      const roi = price.buyPriceMax > 0 ? ((profit / price.buyPriceMax) * 100).toFixed(2) : '0.00';

      return {
        itemId: price.itemId,
        itemName: itemNames.get(price.itemId) ?? price.itemId,
        city: price.city,
        quality: price.quality,
        sellPrice: price.sellPriceMin,
        buyPrice: price.buyPriceMax,
        profit,
        roi: parseFloat(roi),
        lastUpdate: new Date(price.timestamp).toLocaleTimeString(),
      };
    });
  }, [marketData, itemNames]);

  // Column definitions
  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: 'Item',
        field: 'itemName',
        cellRenderer: ItemIconRenderer,
        pinned: 'left',
        width: 200,
        filter: 'agTextColumnFilter',
        sortable: true,
      },
      {
        headerName: 'City',
        field: 'city',
        width: 130,
        filter: 'agSetColumnFilter',
        sortable: true,
      },
      {
        headerName: 'Quality',
        field: 'quality',
        cellRenderer: QualityRenderer,
        width: 140,
        filter: 'agNumberColumnFilter',
        sortable: true,
      },
      {
        headerName: 'Sell Price',
        field: 'sellPrice',
        cellRenderer: PriceRenderer,
        width: 120,
        filter: 'agNumberColumnFilter',
        sortable: true,
        sort: 'desc',
      },
      {
        headerName: 'Buy Price',
        field: 'buyPrice',
        cellRenderer: PriceRenderer,
        width: 120,
        filter: 'agNumberColumnFilter',
        sortable: true,
      },
      {
        headerName: 'Profit',
        field: 'profit',
        cellRenderer: ProfitRenderer,
        width: 120,
        filter: 'agNumberColumnFilter',
        sortable: true,
      },
      {
        headerName: 'ROI %',
        field: 'roi',
        width: 100,
        filter: 'agNumberColumnFilter',
        sortable: true,
        valueFormatter: (params) => `${params.value}%`,
      },
      {
        headerName: 'Last Update',
        field: 'lastUpdate',
        width: 180,
        filter: 'agDateColumnFilter',
        sortable: true,
      },
    ],
    []
  );

  // Default column properties
  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      floatingFilter: true,
    }),
    []
  );

  const onGridReady = useCallback((params: GridReadyEvent) => {
    // Auto-size columns to fit content
    params.api.sizeColumnsToFit();
  }, []);

  if (isLoading) {
    return (
      <div className="panel-float">
        <div className="py-12 text-center">
          <p className="text-albion-gray-400">Loading market data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-float overflow-hidden p-0">
      <div className="ag-theme-alpine-dark h-[600px] w-full">
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          animateRows
          pagination
          paginationPageSize={50}
          paginationPageSizeSelector={[25, 50, 100, 200]}
          enableCellTextSelection
          suppressMovableColumns={false}
        />
      </div>
    </div>
  );
}
