import { DataLayerDemo } from '@/components/data-layer-demo';

export default function DataDemoPage() {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Data Layer Demo</h1>
          <p className="text-muted-foreground">
            Test and explore the local-only data layer for World Staffing Awards 2026.
            This demo uses IndexedDB with localStorage fallback for SSR compatibility.
          </p>
        </div>
        
        <DataLayerDemo />
      </div>
    </div>
  );
}