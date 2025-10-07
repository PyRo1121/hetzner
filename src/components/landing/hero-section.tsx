'use client';

import Link from 'next/link';

import { motion } from 'framer-motion';
import { Swords, TrendingUp, Users, Zap } from 'lucide-react';

// Generate stable particle positions (same on server and client)
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: (i * 5.26) % 100, // Deterministic positioning
  top: (i * 7.89) % 100,
  duration: 3 + (i % 3),
  delay: (i % 4) * 0.5,
}));

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-20">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-forge-900/20 via-albion-black to-neon-blue/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,212,255,0.1),transparent_50%)]" />
        
        {/* Floating Particles */}
        {PARTICLES.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute h-1 w-1 rounded-full bg-neon-blue/30"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Main Title */}
          <motion.h1
            className="mb-6 text-6xl font-bold leading-tight md:text-7xl lg:text-8xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-neon-blue via-neon-purple to-neon-gold bg-clip-text text-transparent">
              Albion Online
            </span>
            <br />
            <span className="text-white">Omni-Dashboard</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="mx-auto mb-8 max-w-2xl text-xl text-albion-gray-500 md:text-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            The ultimate <span className="font-semibold text-neon-gold">100% free</span> platform
            for real-time market intelligence, trading tools, and community insights.
          </motion.p>

          {/* Feature Pills */}
          <motion.div
            className="mb-12 flex flex-wrap items-center justify-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {[
              { icon: TrendingUp, text: 'Real-Time Markets' },
              { icon: Swords, text: 'PvP Analytics' },
              { icon: Users, text: 'Guild Tracking' },
              { icon: Zap, text: 'Instant Updates' },
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-full border border-neon-blue/30 bg-albion-gray-900/50 px-4 py-2 backdrop-blur-sm"
              >
                <feature.icon className="h-4 w-4 text-neon-blue" />
                <span className="text-sm font-medium">{feature.text}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Link href="/dashboard" className="btn-forge w-full sm:w-auto">
              Launch Dashboard
            </Link>
            <Link
              href="/docs"
              className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-900/50 px-6 py-3 font-semibold backdrop-blur-sm transition-all duration-300 hover:border-neon-blue/50 hover:bg-albion-gray-800 sm:w-auto"
            >
              View Documentation
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
          >
            {[
              { label: 'Active Users', value: '10K+' },
              { label: 'Items Tracked', value: '5000+' },
              { label: 'API Calls/Day', value: '1M+' },
              { label: 'Uptime', value: '99.9%' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="mb-2 text-3xl font-bold text-neon-blue">{stat.value}</div>
                <div className="text-sm text-albion-gray-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
