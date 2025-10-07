'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Swords, Trophy, Target, Map, TrendingUp } from 'lucide-react';

const navItems = [
  { href: '/dashboard/pvp', label: 'Overview', icon: Swords },
  { href: '/dashboard/pvp/meta-builds', label: 'Meta Builds', icon: Target },
  { href: '/dashboard/pvp/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/dashboard/pvp/kills', label: 'Kill Feed', icon: TrendingUp },
  { href: '/dashboard/pvp/map', label: 'Kill Map', icon: Map },
];

export default function PvPLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="panel-float">
        <nav className="flex gap-2 overflow-x-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-neon-red text-black shadow-neon'
                    : 'bg-albion-gray-850 text-albion-gray-300 hover:bg-albion-gray-800 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}
