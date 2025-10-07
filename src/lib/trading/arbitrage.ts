/**
 * Arbitrage Calculator
 * Calculates profit opportunities between cities
 */

export interface ArbitrageInput {
  itemId: string;
  buyCity: string;
  sellCity: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  quality?: number;
}

export interface TransportCosts {
  mountType: 'ox' | 'horse' | 'direwolf' | 'swiftclaw' | 'none';
  weight: number; // kg
  distance: number; // zones
  riskFactor: number; // 0-1 (0 = safe, 1 = very dangerous)
}

export interface ArbitrageResult {
  grossProfit: number;
  netProfit: number;
  profitPerUnit: number;
  profitMargin: number; // percentage
  roi: number; // return on investment percentage
  transportCost: number;
  marketTax: number;
  setupFee: number;
  totalCost: number;
  totalRevenue: number;
  breakEvenQuantity: number;
  recommendation: 'excellent' | 'good' | 'fair' | 'poor' | 'avoid';
}

// Tax rates (Albion Online mechanics)
const MARKET_TAX_RATE = 0.045; // 4.5% sales tax
const SETUP_FEE_RATE = 0.015; // 1.5% setup fee

// Transport costs per kg per zone
const TRANSPORT_COSTS = {
  ox: 5, // Slowest, cheapest
  horse: 8,
  direwolf: 12,
  swiftclaw: 15, // Fastest, most expensive
  none: 0, // Walking/no mount
};

// City distances (simplified - in real game, use actual zone counts)
const CITY_DISTANCES: Record<string, Record<string, number>> = {
  Caerleon: { Bridgewatch: 8, Lymhurst: 7, Martlock: 6, 'Fort Sterling': 7, Thetford: 6 },
  Bridgewatch: { Caerleon: 8, Lymhurst: 10, Martlock: 12, 'Fort Sterling': 14, Thetford: 11 },
  Lymhurst: { Caerleon: 7, Bridgewatch: 10, Martlock: 9, 'Fort Sterling': 11, Thetford: 8 },
  Martlock: { Caerleon: 6, Bridgewatch: 12, Lymhurst: 9, 'Fort Sterling': 8, Thetford: 7 },
  'Fort Sterling': { Caerleon: 7, Bridgewatch: 14, Lymhurst: 11, Martlock: 8, Thetford: 9 },
  Thetford: { Caerleon: 6, Bridgewatch: 11, Lymhurst: 8, Martlock: 7, 'Fort Sterling': 9 },
};

/**
 * Calculate distance between two cities
 */
export function getCityDistance(fromCity: string, toCity: string): number {
  if (fromCity === toCity) {return 0;}
  return CITY_DISTANCES[fromCity]?.[toCity] ?? 10; // Default to 10 if not found
}

/**
 * Calculate transport cost
 */
export function calculateTransportCost(costs: TransportCosts): number {
  const { mountType, weight, distance, riskFactor } = costs;
  const baseCost = TRANSPORT_COSTS[mountType] * weight * distance;
  
  // Add risk premium (dangerous zones cost more due to potential losses)
  const riskPremium = baseCost * riskFactor * 0.5;
  
  return Math.round(baseCost + riskPremium);
}

/**
 * Calculate arbitrage opportunity
 */
export function calculateArbitrage(
  input: ArbitrageInput,
  transport?: TransportCosts
): ArbitrageResult {
  const { buyPrice, sellPrice, quantity } = input;

  // Calculate costs
  const totalCost = buyPrice * quantity;
  const marketTax = Math.round(sellPrice * quantity * MARKET_TAX_RATE);
  const setupFee = Math.round(sellPrice * quantity * SETUP_FEE_RATE);
  
  // Calculate transport cost if provided
  const transportCost = transport ? calculateTransportCost(transport) : 0;

  // Calculate revenue
  const totalRevenue = sellPrice * quantity;

  // Calculate profits
  const grossProfit = totalRevenue - totalCost;
  const netProfit = grossProfit - marketTax - setupFee - transportCost;
  const profitPerUnit = netProfit / quantity;
  const profitMargin = (netProfit / totalCost) * 100;
  const roi = (netProfit / totalCost) * 100;

  // Calculate break-even quantity
  const fixedCosts = transportCost;
  const profitPerUnitBeforeFees = sellPrice - buyPrice;
  const feesPerUnit = (sellPrice * (MARKET_TAX_RATE + SETUP_FEE_RATE));
  const netProfitPerUnit = profitPerUnitBeforeFees - feesPerUnit;
  const breakEvenQuantity = netProfitPerUnit > 0 
    ? Math.ceil(fixedCosts / netProfitPerUnit)
    : Infinity;

  // Determine recommendation
  let recommendation: ArbitrageResult['recommendation'];
  if (roi >= 20) {recommendation = 'excellent';}
  else if (roi >= 10) {recommendation = 'good';}
  else if (roi >= 5) {recommendation = 'fair';}
  else if (roi >= 0) {recommendation = 'poor';}
  else {recommendation = 'avoid';}

  return {
    grossProfit,
    netProfit,
    profitPerUnit,
    profitMargin,
    roi,
    transportCost,
    marketTax,
    setupFee,
    totalCost,
    totalRevenue,
    breakEvenQuantity,
    recommendation,
  };
}

/**
 * Find best arbitrage opportunities from a list of items
 */
export function findBestOpportunities(
  opportunities: Array<ArbitrageInput & { transport?: TransportCosts }>,
  minROI: number = 5
): Array<ArbitrageInput & { result: ArbitrageResult }> {
  return opportunities
    .map((opp) => ({
      ...opp,
      result: calculateArbitrage(opp, opp.transport),
    }))
    .filter((opp) => opp.result.roi >= minROI)
    .sort((a, b) => b.result.roi - a.result.roi);
}

/**
 * Format currency for display
 */
export function formatSilver(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(2)}M`;
  } else if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K`;
  }
  return amount.toFixed(0);
}
