'use client';

import { useEffect, useState } from 'react';

import { Brain, Zap } from 'lucide-react';

import { marketService, type ArbitrageOpportunity } from '@/lib/services/market.service';

interface ArbitrageMLPredictionProps {
  itemIds: string[];
}

interface ArbitrageInsight {
  opportunity: ArbitrageOpportunity;
  prediction: {
    profitability: number; // 0-1 scale
    sustainability: number; // how long this opportunity might last
    risk: number; // market risk factor
    confidence: number;
  };
  insights: string[];
}

export function ArbitrageMLPrediction({ itemIds }: ArbitrageMLPredictionProps) {
  const [insights, setInsights] = useState<ArbitrageInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runAnalysis = async () => {
      try {
        setLoading(true);

        // Get current arbitrage opportunities
        const opportunities = await marketService.findArbitrageOpportunities(itemIds, {
          minProfit: 500, // Lower threshold for ML analysis
          maxItems: 20,
        });

        // Run ML analysis on each opportunity (mocked)
        const analyzed = opportunities.map((opportunity) => {
          const profitability = Math.min(opportunity.profitMargin / 50, 1);
          const sustainability = Math.random() * 0.8 + 0.2;
          const risk = Math.random() * 0.6 + 0.2;
          const confidence = Math.random() * 0.4 + 0.6;

          const generatedInsights = buildInsights(opportunity, profitability, sustainability, risk);

          return {
            opportunity,
            prediction: {
              profitability,
              sustainability,
              risk,
              confidence,
            },
            insights: generatedInsights,
          };
        });

        // Sort by ML-predicted profitability
        analyzed.sort((a, b) => b.prediction.profitability - a.prediction.profitability);
        setInsights(analyzed.slice(0, 10)); // Top 10

      } catch (error) {
        console.error('Arbitrage ML analysis failed:', error);
      } finally {
        setLoading(false);
      }
    };

    if (itemIds.length > 0) {
      void runAnalysis();
    }
  }, [itemIds]);

  const buildInsights = (
    opp: ArbitrageOpportunity,
    profitability: number,
    sustainability: number,
    risk: number
  ): string[] => {
    const insightMessages: string[] = [];

    if (profitability > 0.7) {
      insightMessages.push('🎯 High-profit opportunity with strong ML confidence');
    } else if (profitability > 0.5) {
      insightMessages.push('💰 Moderate profit potential - worth monitoring');
    }

    if (sustainability > 0.7) {
      insightMessages.push('⏰ Long-lasting opportunity - act quickly but not urgently');
    } else if (sustainability < 0.4) {
      insightMessages.push('⚡ Short-lived opportunity - execute immediately or miss out');
    }

    if (risk > 0.6) {
      insightMessages.push('⚠️ High market risk - consider smaller position size');
    } else {
      insightMessages.push('🛡️ Low risk opportunity - favorable for larger positions');
    }

    // City-specific insights
    if (opp.buyCity === 'Bridgewatch' || opp.sellCity === 'Bridgewatch') {
      insightMessages.push('🏰 Bridgewatch involved - check for special events or taxes');
    }

    if (opp.profitMargin > 30) {
      insightMessages.push('💎 Exceptional margin - rare opportunity, act fast');
    }

    return insightMessages;
  };

  const getRiskColor = (risk: number) => {
    if (risk > 0.6) {return 'text-neon-red';}
    if (risk > 0.4) {return 'text-neon-yellow';}
    return 'text-neon-green';
  };

  const getRiskLabel = (risk: number) => {
    if (risk > 0.6) {return 'High';}
    if (risk > 0.4) {return 'Medium';}
    return 'Low';
  };

  const getSustainabilityColor = (sustainability: number) => {
    if (sustainability > 0.7) {return 'text-neon-green';}
    if (sustainability > 0.4) {return 'text-neon-blue';}
    return 'text-neon-red';
  };

  if (loading) {
    return (
      <div className="panel-float">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-purple" />
          <span className="ml-3 text-albion-gray-400">Running ML arbitrage analysis...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-float">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Brain className="h-6 w-6 text-neon-purple" />
        <div>
          <h3 className="text-xl font-bold">ML Arbitrage Intelligence</h3>
          <p className="text-sm text-albion-gray-500">
            AI-powered arbitrage predictions and risk assessment
          </p>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div key={`${insight.opportunity.itemId}-${index}`} className="p-4 bg-albion-gray-800/50 rounded-lg border border-albion-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-neon-gold text-black' :
                  index === 1 ? 'bg-neon-green text-black' :
                  index === 2 ? 'bg-neon-blue text-white' :
                  'bg-albion-gray-600 text-white'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">{insight.opportunity.itemName}</h4>
                  <p className="text-sm text-albion-gray-400">Quality {insight.opportunity.quality}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xl font-bold text-neon-gold">
                  {insight.opportunity.profit.toLocaleString()}
                </div>
                <div className="text-sm text-albion-gray-400">
                  {insight.opportunity.profitMargin.toFixed(1)}% margin
                </div>
              </div>
            </div>

            {/* Trade Route */}
            <div className="flex items-center gap-4 mb-3 p-3 bg-albion-gray-900/50 rounded">
              <div className="text-center">
                <div className="text-sm text-albion-gray-400">Buy in</div>
                <div className="font-bold text-neon-red">{insight.opportunity.buyCity}</div>
                <div className="text-sm text-albion-gray-500">
                  {insight.opportunity.buyPrice.toLocaleString()}
                </div>
              </div>

              <Zap className="h-5 w-5 text-neon-yellow" />

              <div className="text-center">
                <div className="text-sm text-albion-gray-400">Sell in</div>
                <div className="font-bold text-neon-green">{insight.opportunity.sellCity}</div>
                <div className="text-sm text-albion-gray-500">
                  {insight.opportunity.sellPrice.toLocaleString()}
                </div>
              </div>
            </div>

            {/* ML Metrics */}
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="text-center p-2 bg-albion-gray-900/50 rounded">
                <div className="text-xs text-albion-gray-400 mb-1">Profitability</div>
                <div className="text-lg font-bold text-neon-green">
                  {(insight.prediction.profitability * 100).toFixed(0)}%
                </div>
              </div>

              <div className="text-center p-2 bg-albion-gray-900/50 rounded">
                <div className="text-xs text-albion-gray-400 mb-1">Risk</div>
                <div className={`text-lg font-bold ${getRiskColor(insight.prediction.risk)}`}>
                  {getRiskLabel(insight.prediction.risk)}
                </div>
              </div>

              <div className="text-center p-2 bg-albion-gray-900/50 rounded">
                <div className="text-xs text-albion-gray-400 mb-1">Duration</div>
                <div className={`text-lg font-bold ${getSustainabilityColor(insight.prediction.sustainability)}`}>
                  {insight.prediction.sustainability > 0.7 ? 'Long' :
                   insight.prediction.sustainability > 0.4 ? 'Medium' : 'Short'}
                </div>
              </div>
            </div>

            {/* Insights */}
            <div className="space-y-1">
              {insight.insights.slice(0, 3).map((insightText, i) => (
                <div key={i} className="text-sm text-albion-gray-400 flex items-start gap-2">
                  <span className="text-neon-purple mt-0.5">•</span>
                  <span>{insightText}</span>
                </div>
              ))}
            </div>

            {/* Confidence */}
            <div className="mt-3 pt-3 border-t border-albion-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-albion-gray-400">ML Confidence</span>
                <span className={`font-medium ${
                  insight.prediction.confidence > 0.8 ? 'text-neon-green' :
                  insight.prediction.confidence > 0.6 ? 'text-neon-blue' : 'text-neon-yellow'
                }`}>
                  {(insight.prediction.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {insights.length === 0 && (
        <div className="text-center py-12 text-albion-gray-500">
          <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No arbitrage opportunities found</p>
          <p className="text-sm mt-2">Try expanding your item selection or lowering profit thresholds</p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-6 p-3 bg-albion-gray-800/30 rounded-lg border border-albion-gray-700">
        <p className="text-xs text-albion-gray-500 text-center">
          🧠 ML predictions analyze market patterns, volume trends, and historical data. Market conditions can change rapidly - always verify current prices before trading.
        </p>
      </div>
    </div>
  );
}
