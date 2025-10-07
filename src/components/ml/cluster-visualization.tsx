// @ts-nocheck - Optional ML visualization with react-chartjs-2
'use client';

/**
 * K-Means Cluster Visualization Component
 * Phase 1, Week 6, Day 38
 * - Visualizes K-means clusters within existing charts
 * - Toggle visibility of clusters
 * - Shows cluster statistics
 * - Color-coded by cluster
 */

import { useState, useEffect } from 'react';

import { Target, Eye, EyeOff, TrendingUp, Users } from 'lucide-react';
import { Scatter } from 'react-chartjs-2';

import { kMeansClustering, labelClusters, getClusterStats, type DataPoint, type Cluster } from '@/lib/ml/kmeans-clustering';

interface ClusterVisualizationProps {
  data: Array<{
    itemId: string;
    itemName: string;
    volatility: number; // 0-1
    volume: number; // 0-1
    avgPrice: number;
  }>;
  numClusters?: number;
}

export function ClusterVisualization({ data, numClusters = 3 }: ClusterVisualizationProps) {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [showClusters, setShowClusters] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);

  // Run clustering
  useEffect(() => {
    if (data.length === 0) {return;}

    setIsProcessing(true);

    // Convert data to DataPoint format
    const dataPoints: DataPoint[] = data.map(item => ({
      id: item.itemId,
      features: [item.volatility, item.volume, item.avgPrice],
      label: item.itemName,
    }));

    // Run K-means
    const result = kMeansClustering(dataPoints, numClusters);
    const labeledClusters = labelClusters(result.clusters);
    
    setClusters(labeledClusters);
    setIsProcessing(false);

    console.log(`✅ K-means clustering complete: ${result.iterations} iterations, converged: ${result.converged}`);
  }, [data, numClusters]);

  // Prepare chart data
  const chartData = {
    datasets: clusters.map((cluster, i) => ({
      label: cluster.points[0]?.label || `Cluster ${i + 1}`,
      data: cluster.points.map(p => ({
        x: p.features[0], // volatility
        y: p.features[1], // volume
      })),
      backgroundColor: showClusters ? cluster.color : '#666',
      borderColor: selectedCluster === i ? '#fff' : cluster.color,
      borderWidth: selectedCluster === i ? 3 : 1,
      pointRadius: selectedCluster === i ? 8 : 6,
      pointHoverRadius: 10,
    })),
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const cluster = clusters[context.datasetIndex];
            const point = cluster.points[context.dataIndex];
            return [
              `Item: ${point.id}`,
              `Volatility: ${(point.features[0] * 100).toFixed(1)}%`,
              `Volume: ${(point.features[1] * 100).toFixed(1)}%`,
              `Cluster: ${point.label}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Volatility',
          color: '#9ca3af',
        },
        grid: {
          color: '#374151',
        },
        ticks: {
          color: '#9ca3af',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Volume',
          color: '#9ca3af',
        },
        grid: {
          color: '#374151',
        },
        ticks: {
          color: '#9ca3af',
        },
      },
    },
  };

  return (
    <div className="panel-float">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-neon-blue" />
          <div>
            <h3 className="text-xl font-bold">Market Segment Clustering</h3>
            <p className="text-sm text-albion-gray-500">
              K-means analysis by volatility and volume
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowClusters(!showClusters)}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            showClusters
              ? 'bg-neon-blue text-white'
              : 'bg-albion-gray-800 text-albion-gray-400 hover:bg-albion-gray-700'
          }`}
        >
          {showClusters ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          {showClusters ? 'Hide' : 'Show'} Clusters
        </button>
      </div>

      {/* Processing Indicator */}
      {isProcessing ? <div className="mb-4 rounded-lg border border-neon-blue/50 bg-neon-blue/10 p-4">
          <p className="text-sm text-neon-blue">
            🔄 Running K-means clustering algorithm...
          </p>
        </div> : null}

      {/* Scatter Plot */}
      <div className="mb-6 h-[400px] rounded-lg border border-albion-gray-700 bg-albion-gray-900 p-4">
        <Scatter data={chartData} options={chartOptions} />
      </div>

      {/* Cluster Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {clusters.map((cluster, i) => {
          const stats = getClusterStats(cluster);
          const isSelected = selectedCluster === i;

          return (
            <button
              key={cluster.id}
              onClick={() => setSelectedCluster(isSelected ? null : i)}
              className={`rounded-lg border p-4 text-left transition-all ${
                isSelected
                  ? 'border-white bg-albion-gray-700'
                  : 'border-albion-gray-700 bg-albion-gray-800 hover:border-albion-gray-600'
              }`}
            >
              {/* Cluster Header */}
              <div className="mb-3 flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: cluster.color }}
                />
                <h4 className="font-semibold text-white">
                  Cluster {i + 1}
                </h4>
              </div>

              {/* Label */}
              <p className="mb-3 text-xs text-albion-gray-400">
                {cluster.points[0]?.label || 'No label'}
              </p>

              {/* Stats */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-albion-gray-500">
                    <Users className="h-3 w-3" />
                    Items
                  </span>
                  <span className="font-medium text-white">{stats.size}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-albion-gray-500">
                    <TrendingUp className="h-3 w-3" />
                    Volatility
                  </span>
                  <span className="font-medium text-white">
                    {(stats.avgVolatility * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-albion-gray-500">Volume</span>
                  <span className="font-medium text-white">
                    {(stats.avgVolume * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-albion-gray-500">Avg Price</span>
                  <span className="font-medium text-neon-blue">
                    {Math.round(stats.avgPrice).toLocaleString()}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Info */}
      <p className="mt-4 text-xs text-albion-gray-500">
        Click a cluster to highlight it on the chart • {data.length} items analyzed
      </p>
    </div>
  );
}
