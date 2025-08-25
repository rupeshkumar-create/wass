"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink } from "lucide-react";
import { Nomination } from "@/lib/types";
import { getNomineeImage } from "@/lib/nominee-image";
import Image from "next/image";

export function RecentNominations() {
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentNominations = async () => {
      try {
        const response = await fetch("/api/nominees?sort=newest&limit=8", {
          cache: "no-store"
        });
        if (response.ok) {
          const data = await response.json();
          setNominations(data);
        }
      } catch (error) {
        console.error("Failed to fetch recent nominations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentNominations();
  }, []);



  if (loading) {
    return (
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Recent Nominees</h2>
            <p className="text-muted-foreground">
              Latest approved nominations across all categories
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20 mb-2" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (nominations.length === 0) {
    return (
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Recent Nominees</h2>
            <p className="text-muted-foreground mb-8">
              No approved nominations yet. Be the first to nominate!
            </p>
            <Button asChild>
              <Link href="/nominate">Submit Nomination</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Recent Nominees</h2>
          <p className="text-muted-foreground">
            Latest approved nominations across all categories
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {nominations.map((nomination) => (
            <Card key={nomination.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border">
                    {(() => {
                      const imageData = getNomineeImage(nomination);
                      return imageData.isInitials ? (
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
                          className={`w-full h-full ${nomination.type === "company" ? "object-contain p-1" : "object-cover"}`}
                          unoptimized={imageData.src.startsWith('data:')}
                        />
                      );
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{nomination.nominee.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {nomination.type === "person" && "title" in nomination.nominee && nomination.nominee.title
                        ? nomination.nominee.title
                        : nomination.type === "company" && "website" in nomination.nominee
                        ? new URL(nomination.nominee.website).hostname
                        : ""}
                    </p>
                  </div>
                </div>
                
                <Badge variant="outline" className="mb-3 text-xs">
                  {nomination.category}
                </Badge>
                
                <Button asChild size="sm" className="w-full">
                  <Link href={nomination.liveUrl}>
                    View Profile
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button asChild variant="outline">
            <Link href="/directory">View All Nominees</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}