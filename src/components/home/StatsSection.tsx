"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Users, Vote, Calendar } from "lucide-react";

interface Stats {
  totalCategories: number;
  totalNominations: number;
  approvedNominations: number;
  totalVotes: number;
}

export function StatsSection() {
  const [stats, setStats] = useState<Stats>({
    totalCategories: 19,
    totalNominations: 0,
    approvedNominations: 0,
    totalVotes: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all nominations
        const nominationsResponse = await fetch("/api/nominations", {
          cache: "no-store"
        });
        if (nominationsResponse.ok) {
          const nominations = await nominationsResponse.json();
          const approved = nominations.filter((n: any) => n.status === "approved");
          
          // Fetch votes
          const votesResponse = await fetch("/api/votes");
          let totalVotes = 0;
          if (votesResponse.ok) {
            const votes = await votesResponse.json();
            totalVotes = votes.length;
          }

          setStats({
            totalCategories: 19,
            totalNominations: nominations.length,
            approvedNominations: approved.length,
            totalVotes
          });
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };

    fetchStats();
  }, []);

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