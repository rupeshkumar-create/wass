"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Users, Vote, Calendar } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { subscribeToDataSync, fetchWithCacheBusting } from "@/lib/utils/data-sync";

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
      // Fetch stats using cache-busting utility
      const statsResponse = await fetchWithCacheBusting('/api/stats');
      
      if (statsResponse.ok) {
        const result = await statsResponse.json();
        if (result.success) {
          setStats({
            totalCategories: CATEGORIES.length,
            totalNominations: result.data.totalNominations || 0,
            approvedNominations: result.data.approvedNominations || 0,
            totalVotes: result.data.totalVotes || result.data.totalCombinedVotes || 0 // Use same combined votes as admin panel
          });
        }
      } else {
        // Fallback: fetch from individual endpoints with cache busting
        const [nomineesResponse, votesResponse] = await Promise.all([
          fetchWithCacheBusting('/api/nominees'),
          fetchWithCacheBusting('/api/votes')
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
        const adminResponse = await fetchWithCacheBusting('/api/admin/nominations');
        
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
    
    // Subscribe to data sync events for real-time updates
    const unsubscribeStats = subscribeToDataSync('stats-updated', fetchStats);
    const unsubscribeAdmin = subscribeToDataSync('admin-action', fetchStats);
    const unsubscribeVote = subscribeToDataSync('vote-cast', fetchStats);
    
    // Also refresh when window gains focus
    const handleFocus = () => {
      fetchStats();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      unsubscribeStats();
      unsubscribeAdmin();
      unsubscribeVote();
    };
  }, [fetchStats, isClient]);

  if (!isClient) {
    // Return static content during SSR to prevent hydration mismatch
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <Award className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold text-gray-900">{CATEGORIES.length}</div>
            <div className="text-sm text-gray-600">Award Categories</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold text-gray-900">-</div>
            <div className="text-sm text-gray-600">Approved Nominees</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <Vote className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold text-gray-900">-</div>
            <div className="text-sm text-gray-600">Votes Cast</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold text-gray-900">Jan 30</div>
            <div className="text-sm text-gray-600">Awards Ceremony</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
        <CardContent className="p-6 text-center">
          <Award className="h-8 w-8 mx-auto mb-2 text-orange-500" />
          <div className="text-2xl font-bold text-gray-900">{stats.totalCategories}</div>
          <div className="text-sm text-gray-600">Award Categories</div>
        </CardContent>
      </Card>
      <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
        <CardContent className="p-6 text-center">
          <Users className="h-8 w-8 mx-auto mb-2 text-orange-500" />
          <div className="text-2xl font-bold text-gray-900">{stats.approvedNominations}</div>
          <div className="text-sm text-gray-600">Approved Nominees</div>
        </CardContent>
      </Card>
      <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
        <CardContent className="p-6 text-center">
          <Vote className="h-8 w-8 mx-auto mb-2 text-orange-500" />
          <div className="text-2xl font-bold text-gray-900">{stats.totalVotes}</div>
          <div className="text-sm text-gray-600">Votes Cast</div>
        </CardContent>
      </Card>
      <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
        <CardContent className="p-6 text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-orange-500" />
          <div className="text-2xl font-bold text-gray-900">Jan 30</div>
          <div className="text-sm text-gray-600">Awards Ceremony</div>
        </CardContent>
      </Card>
    </div>
  );
}