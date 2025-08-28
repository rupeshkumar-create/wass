"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NominationWithVotes } from "@/lib/types";
import { getNomineeImage } from "@/lib/nominee-image";

interface SuggestedNomineesCardProps {
  currentNomineeId: string;
  currentCategory?: string;
}

export function SuggestedNomineesCard({ currentNomineeId, currentCategory }: SuggestedNomineesCardProps) {
  const [suggestions, setSuggestions] = useState<NominationWithVotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    async function fetchSuggestions() {
      try {
        setLoading(true);
        
        // Fetch top nominees, excluding current one
        const response = await fetch(`/api/nominees?sort=votes_desc&limit=8&_t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });
        
        if (!response.ok) throw new Error('Failed to fetch suggestions');
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch suggestions');
        }
        
        const data: NominationWithVotes[] = result.data || [];
        
        // Filter out current nominee and mix categories
        let filtered = data.filter(nominee => nominee.id !== currentNomineeId);
        
        // If we have a current category, try to get variety by prioritizing other categories
        if (currentCategory) {
          const otherCategories = filtered.filter(n => n.category !== currentCategory);
          const sameCategory = filtered.filter(n => n.category === currentCategory);
          
          // Mix: 4 from other categories, 1 from same category for variety
          filtered = [
            ...otherCategories.slice(0, 4),
            ...sameCategory.slice(0, 1)
          ];
        }
        
        setSuggestions(filtered.slice(0, 5));
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSuggestions();
  }, [currentNomineeId, currentCategory, isClient]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">More Profiles for You</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">More Profiles for You</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((nominee) => {
          const imageData = getNomineeImage(nominee);
          const isPersonNomination = nominee.type === "person";
          
          return (
            <div key={nominee.id} className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                {imageData.isInitials ? (
                  <img 
                    src={imageData.src}
                    alt={imageData.alt}
                    loading="lazy"
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image 
                    src={imageData.src}
                    alt={imageData.alt}
                    width={48}
                    height={48}
                    className={`w-full h-full ${isPersonNomination ? "object-cover" : "object-contain bg-white p-1"}`}
                    unoptimized={imageData.src.startsWith('data:')}
                  />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {nominee.nominee.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {nominee.votes} votes
                    </p>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="h-8 px-3 text-xs flex-shrink-0">
                    <Link href={`/nominee/${nominee.id}`}>
                      View
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        
        <div className="pt-2 border-t">
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/directory">
              View All Nominees
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}