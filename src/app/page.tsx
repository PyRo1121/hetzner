import { ComparisonTable } from '@/components/landing/comparison-table';
import { FeaturesSection } from '@/components/landing/features-section';
import { HeroSection } from '@/components/landing/hero-section';

export default function HomePage() {
  return (
    <main className="relative min-h-screen">
      {/* Hero Section with 3D Background */}
      <HeroSection />

      {/* Features Overview */}
      <FeaturesSection />

      {/* Competitor Comparison */}
      <ComparisonTable />

      {/* Footer */}
      <footer className="border-t border-albion-gray-700 bg-albion-gray-900 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-albion-gray-500">
          <p>
            &copy; {new Date().getFullYear()} Albion Online Omni-Dashboard. 100% Free & Open
            Source.
          </p>
          <p className="mt-2">
            Built with Next.js 15, React 19, and powered by official Albion Online APIs.
          </p>
        </div>
      </footer>
    </main>
  );
}
