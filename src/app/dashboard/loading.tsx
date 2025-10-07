import { CardSkeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Hero Skeleton */}
      <div className="panel-float h-40 animate-pulse" />
      
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="panel-float h-32 animate-pulse" />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8 space-y-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="xl:col-span-4 space-y-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}
