/**
 * Black Market Flipper Calculator
 * Calculate profits from flipping items to the Black Market in Albion Online
 * Uses real AODP API data for prices
 */

export interface BlackMarketFlip {
  itemId: string;
  buyCity: string; // City to buy from (e.g., 'Caerleon', 'Bridgewatch')
  buyPrice: number; // From AODP API
  blackMarketPrice: number; // From AODP API (location: 'Black Market')
  quantity: number;
  transportCost: number;
  marketTax: number; // 4.5% on regular market
  setupFee: number; // 1.5% on regular market
}

export interface BlackMarketResult {
  buyTotal: number;
  sellTotal: number;
  transportCost: number;
  taxes: number; // Only on buying side
  netProfit: number;
  profitPerItem: number;
  roi: number;
  profitMargin: number;
  recommendation: 'excellent' | 'good' | 'fair' | 'poor' | 'avoid';
}

/**
 * Calculate Black Market flip profit
 * Note: Black Market has NO taxes or fees when selling (key advantage!)
 */
export function calculateBlackMarketFlip(input: BlackMarketFlip): BlackMarketResult {
  const { buyPrice, blackMarketPrice, quantity, transportCost, marketTax, setupFee } = input;

  // Calculate costs (taxes only when buying from regular market)
  const buyTotal = buyPrice * quantity;
  const buyTaxes = buyTotal * ((marketTax + setupFee) / 100);
  const totalCost = buyTotal + buyTaxes + transportCost;

  // Calculate revenue (Black Market has NO taxes - this is the key advantage!)
  const sellTotal = blackMarketPrice * quantity;

  // Calculate profit
  const netProfit = sellTotal - totalCost;
  const profitPerItem = netProfit / quantity;
  const roi = (netProfit / totalCost) * 100;
  const profitMargin = (netProfit / totalCost) * 100;

  // Recommendation based on ROI
  let recommendation: BlackMarketResult['recommendation'];
  if (roi >= 25) {recommendation = 'excellent';}
  else if (roi >= 15) {recommendation = 'good';}
  else if (roi >= 8) {recommendation = 'fair';}
  else if (roi >= 0) {recommendation = 'poor';}
  else {recommendation = 'avoid';}

  return {
    buyTotal,
    sellTotal,
    transportCost,
    taxes: buyTaxes,
    netProfit,
    profitPerItem,
    roi,
    profitMargin,
    recommendation,
  };
}

/**
 * Compare regular market vs Black Market
 * Helps decide if Black Market is worth the trip
 */
export interface MarketComparison {
  regularMarket: {
    sellPrice: number;
    taxes: number;
    netProfit: number;
    roi: number;
  };
  blackMarket: {
    sellPrice: number;
    taxes: number; // Always 0
    netProfit: number;
    roi: number;
  };
  betterOption: 'regular' | 'black' | 'similar';
  profitDifference: number;
}

export function compareMarkets(
  buyPrice: number,
  quantity: number,
  regularMarketPrice: number,
  blackMarketPrice: number,
  transportCost: number = 0
): MarketComparison {
  const marketTax = 4.5;
  const setupFee = 1.5;

  // Regular market calculation (with taxes on both buy and sell)
  const regularBuyTotal = buyPrice * quantity;
  const regularBuyTaxes = regularBuyTotal * ((marketTax + setupFee) / 100);
  const regularRevenue = regularMarketPrice * quantity;
  const regularSellTaxes = regularRevenue * ((marketTax + setupFee) / 100);
  const regularNetProfit = regularRevenue - regularBuyTotal - regularBuyTaxes - regularSellTaxes - transportCost;
  const regularROI = (regularNetProfit / (regularBuyTotal + regularBuyTaxes + transportCost)) * 100;

  // Black Market calculation (no taxes on selling!)
  const blackBuyTotal = buyPrice * quantity;
  const blackBuyTaxes = blackBuyTotal * ((marketTax + setupFee) / 100);
  const blackRevenue = blackMarketPrice * quantity;
  const blackNetProfit = blackRevenue - blackBuyTotal - blackBuyTaxes - transportCost;
  const blackROI = (blackNetProfit / (blackBuyTotal + blackBuyTaxes + transportCost)) * 100;

  // Determine better option
  let betterOption: 'regular' | 'black' | 'similar';
  const profitDifference = blackNetProfit - regularNetProfit;

  if (Math.abs(profitDifference) < buyPrice * quantity * 0.05) {
    betterOption = 'similar';
  } else if (profitDifference > 0) {
    betterOption = 'black';
  } else {
    betterOption = 'regular';
  }

  return {
    regularMarket: {
      sellPrice: regularMarketPrice,
      taxes: regularBuyTaxes + regularSellTaxes,
      netProfit: regularNetProfit,
      roi: regularROI,
    },
    blackMarket: {
      sellPrice: blackMarketPrice,
      taxes: 0, // No taxes on Black Market sales!
      netProfit: blackNetProfit,
      roi: blackROI,
    },
    betterOption,
    profitDifference,
  };
}

/**
 * Find best Black Market opportunities from a list
 */
export interface BlackMarketOpportunity extends BlackMarketFlip {
  result: BlackMarketResult;
  priceSpread: number; // percentage difference
}

export function findBestBlackMarketFlips(
  opportunities: BlackMarketFlip[],
  minROI: number = 10
): BlackMarketOpportunity[] {
  return opportunities
    .map((opp) => {
      const result = calculateBlackMarketFlip(opp);
      const priceSpread = ((opp.blackMarketPrice - opp.buyPrice) / opp.buyPrice) * 100;

      return {
        ...opp,
        result,
        priceSpread,
      };
    })
    .filter((opp) => opp.result.roi >= minROI)
    .sort((a, b) => b.result.roi - a.result.roi);
}

/**
 * Calculate risk-adjusted Black Market profit
 * Black Market demand can be unpredictable
 */
export function calculateRiskAdjustedProfit(
  result: BlackMarketResult,
  sellProbability: number = 0.85 // 85% chance of selling (Black Market can be risky)
): {
  expectedProfit: number;
  worstCase: number;
  bestCase: number;
} {
  const expectedProfit = result.netProfit * sellProbability;
  const worstCase = -result.buyTotal - result.transportCost; // Total loss if doesn't sell
  const bestCase = result.netProfit;

  return {
    expectedProfit,
    worstCase,
    bestCase,
  };
}

/**
 * AODP API locations for Black Market
 * Use 'Black Market' as the location parameter
 */
export const BLACK_MARKET_LOCATION = 'Black Market';

/**
 * Cities that can transport to Black Market
 */
export const TRANSPORT_CITIES = [
  'Caerleon',
  'Bridgewatch',
  'Lymhurst',
  'Martlock',
  'Fort Sterling',
  'Thetford',
] as const;
