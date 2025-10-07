import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';

import './globals.css';

import { PerformanceMonitor } from '@/components/performance-monitor';
import { Providers } from '@/components/providers';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Albion Online Omni-Dashboard',
  description:
    'The ultimate 100% free Albion Online dashboard with real-time market intelligence, trading tools, and community features',
  keywords: [
    'Albion Online',
    'market data',
    'trading tools',
    'price tracker',
    'crafting calculator',
    'PvP stats',
  ],
  authors: [{ name: 'Albion Omni-Dashboard Team' }],
  manifest: '/manifest.json',
  openGraph: {
    title: 'Albion Online Omni-Dashboard',
    description: 'Real-time market intelligence and trading tools for Albion Online',
    type: 'website',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Albion Omni',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-albion-black font-sans antialiased">
        <Providers>
          {children}
          <PerformanceMonitor />
        </Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
