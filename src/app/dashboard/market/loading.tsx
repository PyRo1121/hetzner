import { TableSkeleton } from '@/components/ui/skeleton';

export default function MarketLoading() {
  return (
    <div className="space-y-6">
      {/* Hero Skeleton */}
      <div className="panel-float h-32 animate-pulse" />
      
      {/* Tabs Skeleton */}
      <div className="panel-float p-2">
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 h-12 rounded-lg bg-albion-gray-800/50 animate-pulse" />
          ))}
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="panel-float h-24 animate-pulse" />

      {/* Table Skeleton */}
      <TableSkeleton rows={15} />
    </div>
  );
}
