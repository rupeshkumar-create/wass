"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Filters } from "@/components/directory/Filters";
import { Grid } from "@/components/directory/Grid";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { NominationWithVotes } from "@/lib/types";
import { useRealtimeVotes } from "@/hooks/useRealtimeVotes";
import { VoteButton } from "@/components/animations/VoteButton";
import { ScrollReveal } from "@/components/animations/ScrollReveal";

function DirectoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [nominees, setNominees] = useState<NominationWithVotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Get filter state from URL parameters
  const searchQuery = searchParams.get("q") || "";
  const selectedCategory = searchParams.get("category") || "";
  const selectedType = searchParams.get("type") || "";

  // Fetch data with server-side filtering
  useEffect(() => {
    if (!isClient) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setNominees([]); // Clear previous results
        
        // Get all nominees and apply client-side filtering
        const timestamp = Date.now();
        const response = await fetch(`/api/nominees?_t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });
        
        if (!response.ok) throw new Error("Failed to fetch nominees");
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch nominees');
        }
        
        let data = result.data || [];
        
        console.log('🔍 Directory - Raw data from API:', data.length, 'nominees');
        console.log('🔍 Directory - Active filters:', { selectedCategory, selectedType, searchQuery });
        
        // Apply client-side filtering
        if (selectedCategory) {
          console.log('🔍 Directory - Applying category filter:', selectedCategory);
          const beforeCount = data.length;
          data = data.filter((nominee: any) => {
            const matches = nominee.category === selectedCategory;
            return matches;
          });
          console.log('🔍 Directory - Category filter result:', data.length, '(was', beforeCount, ')');
        }
        
        if (selectedType) {
          console.log('🔍 Directory - Applying type filter:', selectedType);
          const beforeCount = data.length;
          data = data.filter((nominee: any) => nominee.type === selectedType);
          console.log('🔍 Directory - Type filter result:', data.length, '(was', beforeCount, ')');
        }
        
        if (searchQuery) {
          console.log('🔍 Directory - Applying search filter:', searchQuery);
          const beforeCount = data.length;
          data = data.filter((nominee: any) => {
            const name = nominee.nominee?.name || nominee.displayName || nominee.name || '';
            const category = nominee.category || '';
            return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   category.toLowerCase().includes(searchQuery.toLowerCase());
          });
          console.log('🔍 Directory - Search filter result:', data.length, '(was', beforeCount, ')');
        }
        
        console.log('🔍 Directory - Final result:', data.length, 'nominees');
        
        setNominees(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory, selectedType, searchQuery, isClient]);

  // Real-time vote updates
  const handleVoteUpdate = useCallback(() => {
    // Debounced refresh of nominees data with current filters
    setTimeout(() => {
      const params = new URLSearchParams();
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedType) params.set('type', selectedType);
      if (searchQuery) params.set('q', searchQuery);
      
      fetch(`/api/nominees?_t=${Date.now()}`, { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
        .then(res => res.json())
        .then(result => {
          if (!result.success) return;
          let data = result.data || [];
          console.log('🔍 Vote Update - Raw data:', data.length, 'nominees');
          
          // Apply client-side filtering
          if (selectedCategory) {
            console.log('🔍 Vote Update - Applying category filter:', selectedCategory);
            data = data.filter((nominee: any) => nominee.category === selectedCategory);
            console.log('🔍 Vote Update - Category filter result:', data.length);
          }
          
          if (selectedType) {
            data = data.filter((nominee: any) => nominee.type === selectedType);
          }
          
          if (searchQuery) {
            data = data.filter((nominee: any) => {
              const name = nominee.nominee?.name || nominee.displayName || nominee.name || '';
              const category = nominee.category || '';
              return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     category.toLowerCase().includes(searchQuery.toLowerCase());
            });
          }
          
          console.log('🔍 Vote Update - Final result:', data.length, 'nominees');
          setNominees(data);
        })
        .catch(console.error);
    }, 500);
  }, [selectedCategory, selectedType, searchQuery]);

  useRealtimeVotes({
    category: selectedCategory,
    onVoteUpdate: handleVoteUpdate,
  });

  // Filter change handlers that update URL
  const handleSearchChange = (query: string) => {
    const params = new URLSearchParams(searchParams);
    if (query) {
      params.set('q', query);
    } else {
      params.delete('q');
    }
    router.push(`/directory?${params.toString()}`);
  };

  const handleCategoryChange = (category: string) => {
    const params = new URLSearchParams(searchParams);
    if (category) {
      params.set('category', category);
    } else {
      params.delete('category');
    }
    router.push(`/directory?${params.toString()}`);
  };

  const handleTypeChange = (type: string) => {
    const params = new URLSearchParams(searchParams);
    if (type) {
      params.set('type', type);
    } else {
      params.delete('type');
    }
    router.push(`/directory?${params.toString()}`);
  };

  const handleClearFilters = () => {
    router.push('/directory');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4 text-gray-900">Nominee Directory</h1>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full max-w-md bg-gray-200" />
              <div className="flex gap-4">
                <Skeleton className="h-10 w-48 bg-gray-200" />
                <Skeleton className="h-10 w-32 bg-gray-200" />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-gray-900 py-8">
        <div className="container mx-auto px-4">
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <ScrollReveal>
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">
              {selectedCategory ? `Directory — ${selectedCategory}` : 'Nominee Directory'}
            </h1>
            <p className="text-gray-600 mb-6">
              {selectedCategory 
                ? `Browse and vote for nominees in the ${selectedCategory} category`
                : 'Browse and vote for outstanding nominees in the World Staffing Awards 2026'
              }
            </p>
            
            {/* Filters */}
            <Filters
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              selectedType={selectedType}
              onSearchChange={handleSearchChange}
              onCategoryChange={handleCategoryChange}
              onTypeChange={handleTypeChange}
              onClearFilters={handleClearFilters}
            />
          </div>
        </ScrollReveal>

        {/* Results Count */}
        <ScrollReveal delay={0.1}>
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              Showing {nominees.length} nominees
              {selectedCategory && ` in ${selectedCategory}`}
            </p>
          </div>
        </ScrollReveal>

        {/* Grid */}
        <ScrollReveal delay={0.2}>
          {nominees && nominees.length > 0 ? (
            <Grid nominations={nominees} />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No nominees found.</p>
            </div>
          )}
        </ScrollReveal>

        {/* Sticky Vote Button */}
        <VoteButton />
      </div>
    </div>
  );
}

export default function DirectoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white text-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4 text-gray-900">Nominee Directory</h1>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full max-w-md bg-gray-200" />
              <div className="flex gap-4">
                <Skeleton className="h-10 w-48 bg-gray-200" />
                <Skeleton className="h-10 w-32 bg-gray-200" />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    }>
      <DirectoryContent />
    </Suspense>
  );
}