import { Search } from 'lucide-react';
import { type Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Item Browser | Albion Online Dashboard',
  description: 'Browse and search all Albion Online items',
};

export default function ItemsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="panel-float">
        <div className="flex items-center gap-3">
          <Search className="h-8 w-8 text-neon-blue" />
          <div>
            <h1 className="text-3xl font-bold text-white">Item Database</h1>
            <p className="text-sm text-albion-gray-500">
              Browse and search all Albion Online items
            </p>
          </div>
        </div>
      </div>

      {/* Item Browser Component will be rendered here */}
      <div className="panel-float">
        <p className="text-center text-albion-gray-500">
          Item browser component loading...
        </p>
      </div>
    </div>
  );
}
