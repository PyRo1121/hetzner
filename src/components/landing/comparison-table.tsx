'use client';

import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

const competitors = [
  {
    name: 'Omni-Dashboard',
    isUs: true,
    features: {
      realTimeData: true,
      tradingTools: true,
      pvpAnalytics: true,
      guildTracking: true,
      offlineSupport: true,
      customAlerts: true,
      multiServer: true,
      free: true,
      openSource: true,
      advancedViz: true,
    },
  },
  {
    name: 'AlbionOnlineTools',
    isUs: false,
    features: {
      realTimeData: true,
      tradingTools: true,
      pvpAnalytics: true,
      guildTracking: true,
      offlineSupport: false,
      customAlerts: false,
      multiServer: true,
      free: true,
      openSource: false,
      advancedViz: false,
    },
  },
  {
    name: 'AlbionOnlineGrind',
    isUs: false,
    features: {
      realTimeData: false,
      tradingTools: true,
      pvpAnalytics: false,
      guildTracking: false,
      offlineSupport: false,
      customAlerts: false,
      multiServer: false,
      free: false,
      openSource: false,
      advancedViz: false,
    },
  },
];

const featureLabels = {
  realTimeData: 'Real-Time Market Data',
  tradingTools: 'Advanced Trading Tools',
  pvpAnalytics: 'PvP Analytics',
  guildTracking: 'Guild Tracking',
  offlineSupport: 'Offline Support',
  customAlerts: 'Custom Alerts',
  multiServer: 'Multi-Server Support',
  free: '100% Free',
  openSource: 'Open Source',
  advancedViz: '3D Visualizations',
};

export function ComparisonTable() {
  return (
    <section className="relative py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-4 text-4xl font-bold md:text-5xl">
            <span className="bg-gradient-to-r from-neon-purple to-neon-gold bg-clip-text text-transparent">
              Why Choose Us?
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-albion-gray-500">
            Compare our features with other popular Albion Online tools
          </p>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          className="panel-float overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-albion-gray-700">
                  <th className="px-6 py-4 text-left text-sm font-semibold">Feature</th>
                  {competitors.map((competitor, index) => (
                    <th
                      key={index}
                      className={`px-6 py-4 text-center text-sm font-semibold ${
                        competitor.isUs ? 'text-neon-gold' : 'text-albion-gray-500'
                      }`}
                    >
                      {competitor.name}
                      {competitor.isUs ? <div className="mt-1 text-xs font-normal text-neon-blue">(You are here)</div> : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(featureLabels).map(([key, label], index) => (
                  <motion.tr
                    key={key}
                    className="border-b border-albion-gray-700/50 transition-colors hover:bg-albion-gray-800/50"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <td className="px-6 py-4 text-sm">{label}</td>
                    {competitors.map((competitor, compIndex) => (
                      <td key={compIndex} className="px-6 py-4 text-center">
                        {competitor.features[key as keyof typeof competitor.features] ? (
                          <Check
                            className={`mx-auto h-5 w-5 ${
                              competitor.isUs ? 'text-neon-green' : 'text-albion-gray-500'
                            }`}
                          />
                        ) : (
                          <X className="mx-auto h-5 w-5 text-albion-gray-700" />
                        )}
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CTA Footer */}
          <div className="border-t border-albion-gray-700 bg-albion-gray-800/50 px-6 py-6 text-center">
            <p className="mb-4 text-sm text-albion-gray-500">
              Experience the most comprehensive Albion Online dashboard available
            </p>
            <motion.a
              href="/dashboard"
              className="btn-forge inline-block"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started Now
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
