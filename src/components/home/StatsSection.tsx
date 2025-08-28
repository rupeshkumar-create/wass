"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Users, Vote, Calendar } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";

interface Stats {
  totalCategories: number;
  totalNominations: number;
  approvedNominations: number;
  totalVotes: number;
}

export function StatsSection() {
  const [stats, setStats] = useState<Stats>({
    totalCategories: CATEGORIES.length,
    totalNominations: 0,
    approvedNominations: 0,
    totalVotes: 0
  });
  
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      
      // Fetch stats from the new schema with cache busting
      const statsResponse = await fetch(`/api/stats?_t=${timestamp}`, {
        cache: "no-store",
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
      
      if (statsResponse.ok) {
        const result = await statsResponse.json();
        if (result.success) {
          setStats({
            totalCategories: CATEGORIES.length,
            totalNominations: result.data.totalNominations || 0,
            approvedNominations: result.data.approvedNominations || 0,
            totalVotes: result.data.totalVotes || 0
          });
        }
      } else {
        // Fallback: fetch from individual endpoints with cache busting
        const [nomineesResponse, votesResponse] = await Promise.all([
          fetch(`/api/nominees?_t=${timestamp}`, { 
            cache: "no-store",
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            }
          }),
          fetch(`/api/votes?_t=${timestamp}`, { 
            cache: "no-store",
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            }
          })
        ]);

        let approvedNominations = 0;
        let totalNominations = 0;
        
        if (nomineesResponse.ok) {
          const nomineesResult = await nomineesResponse.json();
          if (nomineesResult.success) {
            approvedNominations = nomineesResult.count || nomineesResult.data?.length || 0;
          }
        }

        // Get total nominations from admin API
        const adminResponse = await fetch(`/api/admin/nominations?_t=${timestamp}`, {
          cache: "no-store",
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          }
        });
        
        if (adminResponse.ok) {
          const adminResult = await adminResponse.json();
          if (adminResult.success) {
            totalNominations = adminResult.count || adminResult.data?.length || 0;
          }
        }

        let totalVotes = 0;
        if (votesResponse.ok) {
          const votesResult = await votesResponse.json();
          totalVotes = Array.isArray(votesResult) ? votesResult.length : (votesResult.count || votesResult.data?.length || 0);
        }

        setStats({
          totalCategories: CATEGORIES.length,
          totalNominations: totalNominations || approvedNominations,
          approvedNominations,
          totalVotes
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    // Initial fetch
    fetchStats();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    // Also refresh when window gains focus
    const handleFocus = () => {
      fetchStats();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchStats, isClient]);

  if (!isClient) {
    // Return static content during SSR to prevent hydration mismatch
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Award className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{CATEGORIES.length}</div>
            <div className="text-sm text-muted-foreground">Award Categories</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">-</div>
            <div className="text-sm text-muted-foreground">Approved Nominees</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Vote className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">-</div>
            <div className="text-sm text-muted-foreground">Votes Cast</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">Jan 30</div>
            <div className="text-sm text-muted-foreground">Awards Ceremony</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardContent className="p-6 text-center">
          <Award className="h-8 w-8 mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold">{stats.totalCategories}</div>
          <div className="text-sm text-muted-foreground">Award Categories</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 text-center">
          <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold">{stats.approvedNominations}</div>
          <div className="text-sm text-muted-foreground">Approved Nominees</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 text-center">
          <Vote className="h-8 w-8 mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold">{stats.totalVotes}</div>
          <div className="text-sm text-muted-foreground">Votes Cast</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold">Jan 30</div>
          <div className="text-sm text-muted-foreground">Awards Ceremony</div>
        </CardContent>
      </Card>
    </div>
  );
}