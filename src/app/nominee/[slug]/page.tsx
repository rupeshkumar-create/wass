"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { NomineeProfileClient } from "./NomineeProfileClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NomineeProfilePage() {
  const params = useParams();
  const slug = params?.slug as string;
  
  const [nominee, setNominee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError("No nominee ID provided");
      setLoading(false);
      return;
    }

    const fetchNominee = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all approved nominees
        const response = await fetch(`/api/nominees?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch nominees');
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to get nominees');
        }
        
        // Find nominee by slug - prioritize ID matching for new schema
        const foundNominee = result.data.find((n: any) => {
          // Primary matching: nomination ID or nominee ID
          if (n.id === slug || n.nomineeId === slug) {
            return true;
          }
          
          // Secondary matching: liveUrl (for backward compatibility)
          const liveUrl = n.liveUrl || n.nominee?.liveUrl || '';
          if (liveUrl) {
            return (
              liveUrl === slug || 
              liveUrl === `/nominee/${slug}` ||
              liveUrl.replace('/nominee/', '') === slug
            );
          }
          
          return false;
        });
        
        if (!foundNominee) {
          throw new Error('Nominee not found');
        }
        
        setNominee(foundNominee);
      } catch (err) {
        console.error('Error fetching nominee:', err);
        setError(err instanceof Error ? err.message : 'Failed to load nominee');
      } finally {
        setLoading(false);
      }
    };

    fetchNominee();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Skeleton className="h-10 w-32 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="p-8 border rounded-lg">
                <div className="flex flex-col md:flex-row gap-6">
                  <Skeleton className="w-32 h-32 rounded-xl" />
                  <div className="flex-1 space-y-4">
                    <Skeleton className="h-12 w-3/4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-10 w-40" />
                  </div>
                </div>
              </div>
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="hidden lg:block space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !nominee) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Nominee Not Found</h1>
            <p className="text-muted-foreground mb-6">
              {error || "The nominee you're looking for could not be found or may have been removed."}
            </p>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <NomineeProfileClient nominee={nominee} />;
}