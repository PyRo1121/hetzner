/**
 * WASM Trade Scanner Wrapper
 * High-performance bulk trade opportunity scanning
 */

let wasmModule: any = null;
let isInitialized = false;

export interface MarketDataInput {
  item_id: string;
  item_name: string;
  city: string;
  buy_price: number;
  sell_price: number;
  quantity: number;
}

export interface TradeOpportunity {
  item_id: string;
  item_name: string;
  buy_city: string;
  sell_city: string;
  buy_price: number;
  sell_price: number;
  quantity: number;
  profit: number;
  roi: number;
  taxes: number;
  transport_cost: number;
}

/**
 * Initialize WASM module
 */
export async function initWasm(): Promise<boolean> {
  if (isInitialized) {return true;}

  try {
    // Dynamic import of WASM module (will be built separately)
    // @ts-expect-error - WASM module built separately with wasm-pack
    const wasm = await import('../../../rust-wasm/pkg/albion_wasm');
    await wasm.default();
    wasm.init_panic_hook();
    wasmModule = wasm;
    isInitialized = true;
    console.log('✅ WASM module initialized successfully');
    return true;
  } catch (error) {
    console.warn('⚠️ WASM not available, falling back to JavaScript:', error);
    return false;
  }
}

/**
 * Scan for trade opportunities using WASM
 */
export async function scanOpportunities(
  marketData: MarketDataInput[],
  minROI: number = 10,
  maxResults: number = 100
): Promise<TradeOpportunity[]> {
  // Initialize WASM if not already done
  if (!isInitialized) {
    const success = await initWasm();
    if (!success) {
      return fallbackScan(marketData, minROI, maxResults);
    }
  }

  try {
    const scanner = new wasmModule.TradeScanner();
    const opportunities = scanner.scan_opportunities(marketData, minROI, maxResults);
    return opportunities as TradeOpportunity[];
  } catch (error) {
    console.error('WASM scan failed, using fallback:', error);
    return fallbackScan(marketData, minROI, maxResults);
  }
}

/**
 * JavaScript fallback for browsers without WASM support
 */
function fallbackScan(
  marketData: MarketDataInput[],
  minROI: number,
  maxResults: number
): TradeOpportunity[] {
  const opportunities: TradeOpportunity[] = [];
  const MARKET_TAX = 0.045;
  const SETUP_FEE = 0.015;

  // Group by item_id
  const itemsById = new Map<string, MarketDataInput[]>();
  for (const data of marketData) {
    if (!itemsById.has(data.item_id)) {
      itemsById.set(data.item_id, []);
    }
    itemsById.get(data.item_id)!.push(data);
  }

  // Find arbitrage opportunities
  for (const [itemId, cities] of itemsById) {
    for (const buyCity of cities) {
      for (const sellCity of cities) {
        if (buyCity.city === sellCity.city) {continue;}
        if (buyCity.buy_price <= 0 || sellCity.sell_price <= 0) {continue;}

        const quantity = Math.min(buyCity.quantity, sellCity.quantity);
        if (quantity === 0) {continue;}

        const buyTotal = buyCity.buy_price * quantity;
        const buyTaxes = buyTotal * (MARKET_TAX + SETUP_FEE);
        const transportCost = estimateTransportCost(buyCity.city, sellCity.city, quantity);
        const totalCost = buyTotal + buyTaxes + transportCost;

        const sellTotal = sellCity.sell_price * quantity;
        const sellTaxes = sellTotal * (MARKET_TAX + SETUP_FEE);
        const netRevenue = sellTotal - sellTaxes;

        const profit = netRevenue - totalCost;
        const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;

        if (roi >= minROI) {
          opportunities.push({
            item_id: itemId,
            item_name: buyCity.item_name,
            buy_city: buyCity.city,
            sell_city: sellCity.city,
            buy_price: buyCity.buy_price,
            sell_price: sellCity.sell_price,
            quantity,
            profit,
            roi,
            taxes: buyTaxes + sellTaxes,
            transport_cost: transportCost,
          });
        }
      }
    }
  }

  // Sort by ROI descending
  opportunities.sort((a, b) => b.roi - a.roi);
  return opportunities.slice(0, maxResults);
}

function estimateTransportCost(fromCity: string, toCity: string, quantity: number): number {
  const distances: Record<string, Record<string, number>> = {
    Caerleon: { Bridgewatch: 8, Lymhurst: 8, Martlock: 8, 'Fort Sterling': 8, Thetford: 8 },
  };

  const distance = distances[fromCity]?.[toCity] || 12;
  const weightFactor = Math.max(quantity / 100, 1);
  return distance * 100 * weightFactor;
}

/**
 * Test WASM availability
 */
export async function testWasm(): Promise<string> {
  const success = await initWasm();
  if (!success) {return 'WASM not available';}
  
  try {
    return wasmModule.greet('Trader');
  } catch (error) {
    return 'WASM test failed';
  }
}
