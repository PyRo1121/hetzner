/**
 * Monte Carlo Simulation for Trading
 * Simulates multiple trade outcomes to assess risk and probability
 */

export interface SimulationInput {
  itemId: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  priceVolatility: number; // 0-1 (standard deviation as % of price)
  marketTax: number; // default 0.045
  setupFee: number; // default 0.015
  transportCost: number;
  iterations: number; // number of simulations to run
}

export interface SimulationResult {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  profitProbability: number; // probability of making profit
  expectedValue: number;
  confidenceInterval: {
    lower: number; // 5th percentile
    upper: number; // 95th percentile
  };
  distribution: number[]; // histogram data
  outcomes: number[]; // all simulation outcomes
}

/**
 * Generate random price based on normal distribution
 */
function generateRandomPrice(basePrice: number, volatility: number): number {
  // Box-Muller transform for normal distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  
  // Apply volatility
  const priceChange = basePrice * volatility * z;
  return Math.max(1, basePrice + priceChange);
}

/**
 * Run a single trade simulation
 */
function simulateSingleTrade(input: SimulationInput): number {
  const {
    buyPrice,
    sellPrice,
    quantity,
    priceVolatility,
    marketTax,
    setupFee,
    transportCost,
  } = input;

  // Simulate price variations
  const actualBuyPrice = generateRandomPrice(buyPrice, priceVolatility);
  const actualSellPrice = generateRandomPrice(sellPrice, priceVolatility);

  // Calculate costs
  const totalCost = actualBuyPrice * quantity;
  const revenue = actualSellPrice * quantity;
  const taxes = revenue * (marketTax + setupFee);

  // Net profit
  return revenue - totalCost - taxes - transportCost;
}

/**
 * Calculate percentile from sorted array
 */
function percentile(sortedArray: number[], p: number): number {
  const index = (p / 100) * (sortedArray.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  if (lower === upper) {return sortedArray[lower];}
  return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
}

/**
 * Calculate standard deviation
 */
function standardDeviation(values: number[], mean: number): number {
  const squaredDiffs = values.map((value) => Math.pow(value - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Create histogram distribution
 */
function createHistogram(values: number[], bins: number = 20): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const binSize = (max - min) / bins;
  
  const histogram = new Array(bins).fill(0);
  
  for (const value of values) {
    const binIndex = Math.min(Math.floor((value - min) / binSize), bins - 1);
    histogram[binIndex]++;
  }
  
  return histogram;
}

/**
 * Run Monte Carlo simulation
 */
export function runMonteCarloSimulation(input: SimulationInput): SimulationResult {
  const outcomes: number[] = [];

  // Run simulations
  for (let i = 0; i < input.iterations; i++) {
    const profit = simulateSingleTrade(input);
    outcomes.push(profit);
  }

  // Sort for percentile calculations
  const sortedOutcomes = [...outcomes].sort((a, b) => a - b);

  // Calculate statistics
  const mean = outcomes.reduce((sum, val) => sum + val, 0) / outcomes.length;
  const median = percentile(sortedOutcomes, 50);
  const stdDev = standardDeviation(outcomes, mean);
  const min = sortedOutcomes[0];
  const max = sortedOutcomes[sortedOutcomes.length - 1];
  
  // Probability of profit
  const profitableOutcomes = outcomes.filter((profit) => profit > 0).length;
  const profitProbability = profitableOutcomes / outcomes.length;

  // Confidence interval (90%)
  const confidenceInterval = {
    lower: percentile(sortedOutcomes, 5),
    upper: percentile(sortedOutcomes, 95),
  };

  // Expected value (mean profit)
  const expectedValue = mean;

  // Create histogram
  const distribution = createHistogram(outcomes);

  return {
    mean,
    median,
    stdDev,
    min,
    max,
    profitProbability,
    expectedValue,
    confidenceInterval,
    distribution,
    outcomes: sortedOutcomes,
  };
}

/**
 * Compare multiple scenarios
 */
export function compareScenarios(scenarios: SimulationInput[]): SimulationResult[] {
  return scenarios.map((scenario) => runMonteCarloSimulation(scenario));
}

/**
 * Calculate risk-adjusted return (Sharpe ratio)
 */
export function calculateSharpeRatio(result: SimulationResult, riskFreeRate: number = 0): number {
  if (result.stdDev === 0) {return 0;}
  return (result.expectedValue - riskFreeRate) / result.stdDev;
}

/**
 * Calculate Value at Risk (VaR)
 */
export function calculateVaR(result: SimulationResult, confidenceLevel: number = 0.95): number {
  // VaR is the maximum loss at given confidence level
  const percentileValue = (1 - confidenceLevel) * 100;
  const index = Math.floor((percentileValue / 100) * result.outcomes.length);
  return Math.abs(Math.min(0, result.outcomes[index]));
}

/**
 * Calculate Conditional Value at Risk (CVaR) / Expected Shortfall
 */
export function calculateCVaR(result: SimulationResult, confidenceLevel: number = 0.95): number {
  const percentileValue = (1 - confidenceLevel) * 100;
  const index = Math.floor((percentileValue / 100) * result.outcomes.length);
  
  // Average of all losses beyond VaR
  const tailLosses = result.outcomes.slice(0, index).filter((val) => val < 0);
  if (tailLosses.length === 0) {return 0;}
  
  const avgTailLoss = tailLosses.reduce((sum, val) => sum + val, 0) / tailLosses.length;
  return Math.abs(avgTailLoss);
}
