/**
 * Outlier Detection for Data Validation
 * Uses z-score filtering to reject invalid entries
 * Phase 1, Week 2: Data validation
 */

interface DataPoint {
  value: number;
  metadata?: Record<string, any>;
}

/**
 * Calculate z-score for a value
 */
function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) {
    return 0;
  }
  return (value - mean) / stdDev;
}

/**
 * Calculate mean of array
 */
function calculateMean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate standard deviation
 */
function calculateStdDev(values: number[], mean: number): number {
  if (values.length === 0) {
    return 0;
  }
  const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Detect outliers using z-score method
 * @param data Array of data points
 * @param threshold Z-score threshold (default: 3 = 99.7% confidence)
 * @returns Object with valid data and outliers
 */
export function detectOutliers<T extends DataPoint>(
  data: T[],
  threshold: number = 3
): {
  valid: T[];
  outliers: T[];
  stats: {
    mean: number;
    stdDev: number;
    totalCount: number;
    validCount: number;
    outlierCount: number;
  };
} {
  if (data.length === 0) {
    return {
      valid: [],
      outliers: [],
      stats: {
        mean: 0,
        stdDev: 0,
        totalCount: 0,
        validCount: 0,
        outlierCount: 0,
      },
    };
  }

  // Extract values
  const values = data.map((d) => d.value);

  // Calculate statistics
  const mean = calculateMean(values);
  const stdDev = calculateStdDev(values, mean);

  // Classify data points
  const valid: T[] = [];
  const outliers: T[] = [];

  data.forEach((point) => {
    const zScore = calculateZScore(point.value, mean, stdDev);

    if (Math.abs(zScore) <= threshold) {
      valid.push(point);
    } else {
      outliers.push(point);
      console.warn(`[OutlierDetection] Outlier detected:`, {
        value: point.value,
        zScore: zScore.toFixed(2),
        threshold,
        metadata: point.metadata,
      });
    }
  });

  return {
    valid,
    outliers,
    stats: {
      mean,
      stdDev,
      totalCount: data.length,
      validCount: valid.length,
      outlierCount: outliers.length,
    },
  };
}

/**
 * Validate market prices for outliers
 * @public - Available for future use in price validation middleware
 * @deprecated - Reserved for Phase 2.1 input validation systems
 */
export function _validateMarketPrices(
  prices: Array<{
    sellPriceMin: number;
    buyPriceMax: number;
    itemId: string;
    city: string;
  }>
): {
  valid: typeof prices;
  rejected: typeof prices;
} {
  // Convert to DataPoint format
  const dataPoints = prices.map((p) => ({
    value: p.sellPriceMin,
    metadata: { itemId: p.itemId, city: p.city, price: p.sellPriceMin },
  }));

  // Detect outliers (threshold: 3 standard deviations)
  const result = detectOutliers(dataPoints, 3);

  // Map back to original format
  const valid = result.valid.map((_, index) => prices[index]);
  const rejected = result.outliers.map((_, index) => {
    const outlierIndex = prices.findIndex(
      (p) =>
        p.itemId === result.outliers[index].metadata?.itemId &&
        p.city === result.outliers[index].metadata?.city
    );
    return prices[outlierIndex];
  });

  if (rejected.length > 0) {
    console.log(`[Validation] Rejected ${rejected.length} outlier prices out of ${prices.length}`);
  }

  return { valid, rejected };
}

/**
 * Validate gold prices for outliers
 */
export function validateGoldPrices(
  prices: Array<{
    price: number;
    timestamp: string;
  }>
): {
  valid: typeof prices;
  rejected: typeof prices;
} {
  const dataPoints = prices.map((p) => ({
    value: p.price,
    metadata: { timestamp: p.timestamp },
  }));

  const result = detectOutliers(dataPoints, 3);

  const valid = result.valid.map((_, index) => prices[index]);
  const rejected = result.outliers.map((_, index) => {
    const outlierIndex = prices.findIndex(
      (p) => p.timestamp === result.outliers[index].metadata?.timestamp
    );
    return prices[outlierIndex];
  });

  if (rejected.length > 0) {
    console.log(
      `[Validation] Rejected ${rejected.length} outlier gold prices out of ${prices.length}`
    );
  }

  return { valid, rejected };
}
