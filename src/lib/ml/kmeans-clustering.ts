/**
 * K-Means Clustering Algorithm
 * Phase 1, Week 6, Day 38
 * - Market segment identification by volatility and volume
 * - Pure JavaScript implementation (no ML libraries)
 * - Optimized for browser performance
 */

export interface DataPoint {
  id: string;
  features: number[]; // [volatility, volume, avgPrice, ...]
  label?: string;
}

export interface Cluster {
  id: number;
  centroid: number[];
  points: DataPoint[];
  color: string;
}

export interface KMeansResult {
  clusters: Cluster[];
  iterations: number;
  converged: boolean;
}

const CLUSTER_COLORS = [
  '#00d4ff', // Neon Blue
  '#00ff88', // Neon Green
  '#ff0080', // Neon Pink
  '#ffaa00', // Neon Orange
  '#aa00ff', // Neon Purple
];

/**
 * Calculate Euclidean distance between two points
 */
function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(
    a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0)
  );
}

/**
 * Normalize features to 0-1 range
 */
export function normalizeFeatures(data: DataPoint[]): DataPoint[] {
  if (data.length === 0) {return data;}

  const numFeatures = data[0].features.length;
  const mins = new Array(numFeatures).fill(Infinity);
  const maxs = new Array(numFeatures).fill(-Infinity);

  // Find min/max for each feature
  data.forEach(point => {
    point.features.forEach((val, i) => {
      mins[i] = Math.min(mins[i], val);
      maxs[i] = Math.max(maxs[i], val);
    });
  });

  // Normalize
  return data.map(point => ({
    ...point,
    features: point.features.map((val, i) => {
      const range = maxs[i] - mins[i];
      return range === 0 ? 0 : (val - mins[i]) / range;
    }),
  }));
}

/**
 * Initialize centroids using K-means++ algorithm
 */
function initializeCentroids(data: DataPoint[], k: number): number[][] {
  const centroids: number[][] = [];
  
  // Choose first centroid randomly
  const firstIndex = Math.floor(Math.random() * data.length);
  centroids.push([...data[firstIndex].features]);

  // Choose remaining centroids
  for (let i = 1; i < k; i++) {
    const distances = data.map(point => {
      const minDist = Math.min(
        ...centroids.map(centroid => euclideanDistance(point.features, centroid))
      );
      return minDist * minDist;
    });

    const totalDist = distances.reduce((sum, d) => sum + d, 0);
    let random = Math.random() * totalDist;

    for (let j = 0; j < data.length; j++) {
      random -= distances[j];
      if (random <= 0) {
        centroids.push([...data[j].features]);
        break;
      }
    }
  }

  return centroids;
}

/**
 * Assign each point to nearest centroid
 */
function assignClusters(data: DataPoint[], centroids: number[][]): number[] {
  return data.map(point => {
    let minDist = Infinity;
    let clusterIndex = 0;

    centroids.forEach((centroid, i) => {
      const dist = euclideanDistance(point.features, centroid);
      if (dist < minDist) {
        minDist = dist;
        clusterIndex = i;
      }
    });

    return clusterIndex;
  });
}

/**
 * Update centroids based on cluster assignments
 */
function updateCentroids(
  data: DataPoint[],
  assignments: number[],
  k: number
): number[][] {
  const numFeatures = data[0].features.length;
  const centroids: number[][] = Array(k)
    .fill(0)
    .map(() => Array(numFeatures).fill(0));
  const counts = Array(k).fill(0);

  // Sum features for each cluster
  data.forEach((point, i) => {
    const cluster = assignments[i];
    counts[cluster]++;
    point.features.forEach((val, j) => {
      centroids[cluster][j] += val;
    });
  });

  // Average to get new centroids
  return centroids.map((centroid, i) =>
    counts[i] > 0 ? centroid.map(val => val / counts[i]) : centroid
  );
}

/**
 * Check if centroids have converged
 */
function hasConverged(
  oldCentroids: number[][],
  newCentroids: number[][],
  tolerance: number = 0.0001
): boolean {
  return oldCentroids.every((oldCentroid, i) =>
    euclideanDistance(oldCentroid, newCentroids[i]) < tolerance
  );
}

/**
 * K-Means clustering algorithm
 */
export function kMeansClustering(
  data: DataPoint[],
  k: number = 3,
  maxIterations: number = 100
): KMeansResult {
  if (data.length === 0) {
    return { clusters: [], iterations: 0, converged: false };
  }

  // Normalize data
  const normalizedData = normalizeFeatures(data);

  // Initialize centroids
  let centroids = initializeCentroids(normalizedData, k);
  let assignments: number[] = [];
  let iterations = 0;
  let converged = false;

  // Iterate until convergence or max iterations
  while (iterations < maxIterations) {
    // Assign points to clusters
    assignments = assignClusters(normalizedData, centroids);

    // Update centroids
    const newCentroids = updateCentroids(normalizedData, assignments, k);

    // Check convergence
    if (hasConverged(centroids, newCentroids)) {
      converged = true;
      centroids = newCentroids;
      break;
    }

    centroids = newCentroids;
    iterations++;
  }

  // Build cluster objects
  const clusters: Cluster[] = Array(k)
    .fill(0)
    .map((_, i) => ({
      id: i,
      centroid: centroids[i],
      points: [],
      color: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
    }));

  // Assign points to clusters
  normalizedData.forEach((_point, i) => {
    clusters[assignments[i]].points.push(data[i]); // Use original data
  });

  return { clusters, iterations, converged };
}

/**
 * Calculate cluster statistics
 */
export function getClusterStats(cluster: Cluster) {
  if (cluster.points.length === 0) {
    return {
      size: 0,
      avgVolatility: 0,
      avgVolume: 0,
      avgPrice: 0,
    };
  }

  const volatilities = cluster.points.map(p => p.features[0]);
  const volumes = cluster.points.map(p => p.features[1]);
  const prices = cluster.points.map(p => p.features[2] || 0);

  return {
    size: cluster.points.length,
    avgVolatility: volatilities.reduce((a, b) => a + b, 0) / volatilities.length,
    avgVolume: volumes.reduce((a, b) => a + b, 0) / volumes.length,
    avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
  };
}

/**
 * Label clusters based on characteristics
 */
export function labelClusters(clusters: Cluster[]): Cluster[] {
  return clusters.map(cluster => {
    const stats = getClusterStats(cluster);
    
    let label = '';
    if (stats.avgVolatility > 0.7) {
      label = 'High Volatility';
    } else if (stats.avgVolatility > 0.4) {
      label = 'Medium Volatility';
    } else {
      label = 'Stable';
    }

    if (stats.avgVolume > 0.7) {
      label += ' • High Volume';
    } else if (stats.avgVolume > 0.4) {
      label += ' • Medium Volume';
    } else {
      label += ' • Low Volume';
    }

    return {
      ...cluster,
      points: cluster.points.map(p => ({ ...p, label })),
    };
  });
}
