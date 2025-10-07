'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Swords,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, color: 'neon-blue' },
  { name: 'Market', href: '/dashboard/market', icon: TrendingUp, color: 'neon-green' },
  { name: 'Guilds', href: '/dashboard/guilds', icon: Users, color: 'neon-purple' },
  { name: 'PvP Stats', href: '/dashboard/pvp', icon: Swords, color: 'neon-red' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  return (
    <>
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarOpen ? 256 : 80,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="relative z-20 flex flex-col border-r border-albion-gray-700/50 bg-gradient-to-b from-albion-gray-900 via-albion-gray-900 to-albion-gray-950 backdrop-blur-xl"
      >
        {/* Gradient Accent */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-neon-blue/50 to-transparent" />
        
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-albion-gray-700/50 px-4">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-neon-blue via-neon-purple to-neon-pink shadow-lg shadow-neon-blue/30 transition-transform group-hover:scale-110">
              <Sparkles className="h-6 w-6 text-white" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 blur-xl" />
            </div>
            {sidebarOpen ? (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <p className="text-xl font-bold bg-gradient-to-r from-white to-neon-blue bg-clip-text text-transparent">
                  Albion
                </p>
                <p className="text-xs text-albion-gray-500 -mt-1">Omni-Dashboard</p>
              </motion.div>
            ) : null}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 px-3 py-6">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href  }/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? `bg-gradient-to-r from-${item.color}/20 to-transparent text-${item.color} shadow-lg`
                    : 'text-albion-gray-500 hover:bg-albion-gray-800/50 hover:text-white'
                )}
              >
                {/* Active Indicator */}
                {isActive ? (
                  <motion.div
                    layoutId="activeTab"
                    className={`absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-${item.color}`}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                ) : null}
                
                <item.icon
                  className={cn(
                    'h-5 w-5 flex-shrink-0 transition-all',
                    isActive ? `text-${item.color}` : 'text-albion-gray-500 group-hover:text-white'
                  )}
                />
                {sidebarOpen ? (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    {item.name}
                  </motion.span>
                ) : null}
                
                {/* Hover Glow */}
                {isActive ? (
                  <div className={`absolute inset-0 rounded-xl bg-${item.color}/10 blur-xl -z-10`} />
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-24 flex h-7 w-7 items-center justify-center rounded-full border border-albion-gray-700/50 bg-albion-gray-900 text-albion-gray-400 shadow-lg transition-all hover:bg-albion-gray-800 hover:text-white hover:border-neon-blue/50 hover:shadow-neon-blue/20"
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </motion.aside>
    </>
  );
}
