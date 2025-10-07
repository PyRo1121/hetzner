'use client';

import { useEffect, useState } from 'react';

import { Brain, TrendingUp, TrendingDown, Minus, Target, AlertTriangle } from 'lucide-react';

import type { MarketFeatures, MarketPrediction } from '@/lib/services/ml-analytics.service';

interface MarketMLAnalyticsProps {
  features: MarketFeatures;
}

export function MarketMLAnalytics({ features }: MarketMLAnalyticsProps) {
  const [prediction, setPrediction] = useState<MarketPrediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runAnalysis = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/market/ml-analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ features }),
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const payload: { success: boolean; data?: MarketPrediction } = await response.json();
        if (payload.success && payload.data) {
          setPrediction(payload.data);
        } else {
          setPrediction(null);
        }
      } catch (error) {
        console.error('Market ML analysis failed:', error);
      } finally {
        setLoading(false);
      }
    };

    void runAnalysis();
  }, [features]);

  if (loading) {
    return (
      <div className="panel-float">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-purple" />
          <span className="ml-3 text-albion-gray-400">Analyzing market trends...</span>
        </div>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="panel-float">
        <div className="text-center py-12 text-albion-gray-500">
          <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>ML Analysis unavailable</p>
        </div>
      </div>
    );
  }

  const priceChange = ((prediction.predictedPrice - features.currentPrice) / features.currentPrice) * 100;
  const isPriceUp = priceChange > 1;
  const isPriceDown = priceChange < -1;

  const formatPrice = (price: number) => {
    if (price >= 1000000) {return `${(price / 1000000).toFixed(1)}M`;}
    if (price >= 1000) {return `${(price / 1000).toFixed(1)}K`;}
    return price.toLocaleString();
  };

  return (
    <div className="panel-float">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Brain className="h-6 w-6 text-neon-purple" />
        <div>
          <h3 className="text-xl font-bold">ML Price Prediction</h3>
          <p className="text-sm text-albion-gray-500">
            AI-powered market analysis for {features.itemId}
          </p>
        </div>
      </div>

      {/* Price Prediction */}
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-4 bg-albion-gray-800/50 rounded-lg">
            <div className="text-sm text-albion-gray-400 mb-1">Current Price</div>
            <div className="text-2xl font-bold text-white">
              {formatPrice(features.currentPrice)}
            </div>
          </div>
          <div className="text-center p-4 bg-albion-gray-800/50 rounded-lg">
            <div className="text-sm text-albion-gray-400 mb-1">Predicted Price</div>
            <div className={`text-2xl font-bold ${
              isPriceUp ? 'text-neon-green' :
              isPriceDown ? 'text-neon-red' : 'text-neon-blue'
            }`}>
              {formatPrice(prediction.predictedPrice)}
            </div>
          </div>
        </div>

        {/* Trend Indicator */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            prediction.trend === 'up' ? 'bg-neon-green/20 text-neon-green' :
            prediction.trend === 'down' ? 'bg-neon-red/20 text-neon-red' :
            'bg-albion-gray-700 text-albion-gray-400'
          }`}>
            {prediction.trend === 'up' ? <TrendingUp className="h-5 w-5" /> :
             prediction.trend === 'down' ? <TrendingDown className="h-5 w-5" /> :
             <Minus className="h-5 w-5" />}
            <span className="font-medium capitalize">{prediction.trend}</span>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-albion-gray-800 rounded-lg">
            <Target className="h-5 w-5 text-neon-blue" />
            <span className="text-sm text-albion-gray-400">
              Confidence: {(prediction.confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Price Change */}
        <div className="text-center">
          <div className={`text-lg font-bold ${
            isPriceUp ? 'text-neon-green' :
            isPriceDown ? 'text-neon-red' : 'text-albion-gray-400'
          }`}>
            {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%
          </div>
          <div className="text-sm text-albion-gray-500">Expected change in next 24h</div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-white mb-4">Risk Assessment</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 bg-albion-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={`h-5 w-5 ${
                prediction.volatility > 0.3 ? 'text-neon-red' :
                prediction.volatility > 0.2 ? 'text-neon-yellow' : 'text-neon-green'
              }`} />
              <span className="font-medium text-white">Volatility</span>
            </div>
            <div className={`text-2xl font-bold ${
              prediction.volatility > 0.3 ? 'text-neon-red' :
              prediction.volatility > 0.2 ? 'text-neon-yellow' : 'text-neon-green'
            }`}>
              {(prediction.volatility * 100).toFixed(1)}%
            </div>
            <p className="text-sm text-albion-gray-400 mt-1">
              {prediction.volatility > 0.3 ? 'High risk' :
               prediction.volatility > 0.2 ? 'Medium risk' : 'Low risk'}
            </p>
          </div>

          <div className="p-4 bg-albion-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-neon-blue" />
              <span className="font-medium text-white">Recommendation</span>
            </div>
            <div className="text-lg font-bold text-white">
              {prediction.trend === 'up' ? 'Buy/Hold' :
               prediction.trend === 'down' ? 'Sell/Avoid' : 'Monitor'}
            </div>
            <p className="text-sm text-albion-gray-400 mt-1">
              Based on ML analysis
            </p>
          </div>
        </div>
      </div>

      {/* Key Factors */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-white mb-4">Key Factors</h4>
        <div className="space-y-3">
          {prediction.factors.map((factor, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-albion-gray-800/50 rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-white">{factor.name}</div>
                <div className="text-sm text-albion-gray-400">{factor.description}</div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <div className={`w-16 h-2 rounded-full ${
                  factor.impact > 0.1 ? 'bg-neon-green' :
                  factor.impact < -0.1 ? 'bg-neon-red' : 'bg-albion-gray-600'
                }`}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      factor.impact > 0 ? 'bg-neon-green' : 'bg-neon-red'
                    }`}
                    style={{
                      width: `${Math.abs(factor.impact) * 100}%`,
                      marginLeft: factor.impact < 0 ? `${100 - Math.abs(factor.impact) * 100}%` : '0%'
                    }}
                  />
                </div>
                <span className={`text-sm font-medium ${
                  factor.impact > 0.1 ? 'text-neon-green' :
                  factor.impact < -0.1 ? 'text-neon-red' : 'text-albion-gray-400'
                }`}>
                  {factor.impact > 0 ? '+' : ''}{(factor.impact * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trading Insights */}
      <div className="border-t border-albion-gray-700 pt-6">
        <h4 className="text-lg font-semibold text-white mb-4">Trading Insights</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 bg-albion-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-neon-green" />
              <span className="font-medium text-white">Entry Point</span>
            </div>
            <p className="text-sm text-albion-gray-400">
              {prediction.trend === 'up'
                ? 'Consider buying now for potential upside'
                : 'Wait for price stabilization or dip'
              }
            </p>
          </div>

          <div className="p-4 bg-albion-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-neon-yellow" />
              <span className="font-medium text-white">Risk Warning</span>
            </div>
            <p className="text-sm text-albion-gray-400">
              {prediction.volatility > 0.2
                ? 'High volatility - use stop losses'
                : 'Stable market conditions expected'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-6 p-3 bg-albion-gray-800/30 rounded-lg border border-albion-gray-700">
        <p className="text-xs text-albion-gray-500 text-center">
          🔮 ML predictions are based on historical patterns and market data. Past performance doesn&apos;t guarantee future results. Always do your own research.
        </p>
      </div>
    </div>
  );
}
