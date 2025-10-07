'use client';

import { motion } from 'framer-motion';
import {
  BarChart3,
  Calculator,
  Globe,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: TrendingUp,
    title: 'Real-Time Market Data',
    description:
      'Live price tracking across all cities with AODP integration. Never miss a profitable trade opportunity.',
    color: 'text-neon-blue',
  },
  {
    icon: Calculator,
    title: 'Advanced Trading Tools',
    description:
      'Arbitrage calculators, profit scanners, and Monte Carlo simulations powered by WASM for lightning-fast performance.',
    color: 'text-neon-purple',
  },
  {
    icon: BarChart3,
    title: 'Interactive Visualizations',
    description:
      '3D market flows, procedural heatmaps, and WebGPU-accelerated charts for immersive data exploration.',
    color: 'text-neon-green',
  },
  {
    icon: Users,
    title: 'Guild & PvP Analytics',
    description:
      'Track guild performance, analyze battles, and monitor player statistics with comprehensive leaderboards.',
    color: 'text-neon-gold',
  },
  {
    icon: Globe,
    title: 'Multi-Server Support',
    description:
      'Seamlessly switch between Americas, Europe, and Asia servers with unified data normalization.',
    color: 'text-neon-blue',
  },
  {
    icon: Zap,
    title: 'Instant Alerts',
    description:
      'Custom price alerts, threshold notifications, and real-time updates via Supabase Realtime.',
    color: 'text-neon-red',
  },
  {
    icon: Shield,
    title: 'Offline Support',
    description:
      'DuckDB-WASM powered offline queries and PWA capabilities for uninterrupted access anywhere.',
    color: 'text-neon-purple',
  },
  {
    icon: Sparkles,
    title: 'Mystical UX',
    description:
      'Lore-inspired design with kinetic typography, procedural shaders, and ambient audio for immersive experience.',
    color: 'text-neon-gold',
  },
];

export function FeaturesSection() {
  return (
    <section className="relative py-20 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-4 text-4xl font-bold md:text-5xl">
            <span className="bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
              World-Class Features
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-albion-gray-500">
            Built with cutting-edge technology and designed for the ultimate Albion Online
            experience
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="panel-float group relative overflow-hidden transition-all duration-300 hover:scale-105"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {/* Glow Effect on Hover */}
              <div className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className={`absolute inset-0 blur-xl ${feature.color} opacity-20`} />
              </div>

              {/* Icon */}
              <div className={`mb-4 inline-flex rounded-lg bg-albion-gray-800 p-3 ${feature.color}`}>
                <feature.icon className="h-6 w-6" />
              </div>

              {/* Content */}
              <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
              <p className="text-sm text-albion-gray-500">{feature.description}</p>

              {/* Decorative Corner */}
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br from-neon-blue/10 to-transparent blur-2xl" />
            </motion.div>
          ))}
        </div>

        {/* Tech Stack Badge */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-albion-gray-500">
            Powered By
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-albion-gray-500">
            <span>Next.js 15</span>
            <span>•</span>
            <span>React 19</span>
            <span>•</span>
            <span>Tailwind CSS 4</span>
            <span>•</span>
            <span>Supabase</span>
            <span>•</span>
            <span>WebGPU</span>
            <span>•</span>
            <span>WASM</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
