"use client";

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Users, Vote, Building, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(res => res.json());

export function StatsCards() {
  const { data: stats, error, isLoading, mutate } = useSWR('/api/stats', fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  // Listen for real-time vote updates
  useEffect(() => {
    const handleVoteUpdate = () => {
      mutate(); // Refresh stats data
    };

    window.addEventListener('vote-update', handleVoteUpdate);
    return () => window.removeEventListener('vote-update', handleVoteUpdate);
  }, [mutate]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Failed to load stats</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const topCategory = Object.entries(stats.byCategory || {})
    .sort(([,a], [,b]) => (b as any).nominees - (a as any).nominees)[0]?.[0] || "None";
  
  const topCategoryCount = stats.byCategory?.[topCategory]?.nominees || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Nominees</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalNominees}</div>
          <p className="text-xs text-muted-foreground">
            {stats.pendingNominations} pending approval
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
          <Vote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalVotes}</div>
          <p className="text-xs text-muted-foreground">
            Across all nominees
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Votes</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.totalNominees > 0 ? Math.round(stats.totalVotes / stats.totalNominees) : 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Per nominee
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Category</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{topCategoryCount}</div>
          <p className="text-xs text-muted-foreground">
            {topCategory}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}