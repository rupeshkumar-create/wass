"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, ThumbsUp, ExternalLink } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { useRealtimeVotes } from "@/hooks/useRealtimeVotes";
import useSWR from "swr";

type PodiumItem = {
  rank: 1 | 2 | 3;
  nomineeId: string;
  name: string;
  category: string;
  type: "person" | "company";
  image_url: string | null;
  votes: number;
  live_slug: string;
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

const rankEmojis = {
  1: "🥇",
  2: "🥈", 
  3: "🥉"
};

const rankColors = {
  1: "bg-yellow-50 border-yellow-200",
  2: "bg-slate-50 border-slate-200",
  3: "bg-orange-50 border-orange-200"
};

// Group categories for better organization
const categoryGroups = [
  {
    id: "role-specific-excellence",
    label: "Role-Specific Excellence",
    categories: CATEGORIES.filter(c => c.group === "role-specific-excellence")
  },
  {
    id: "innovation-technology",
    label: "Innovation & Technology",
    categories: CATEGORIES.filter(c => c.group === "innovation-technology")
  },
  {
    id: "culture-impact",
    label: "Culture & Impact",
    categories: CATEGORIES.filter(c => c.group === "culture-impact")
  },
  {
    id: "growth-performance",
    label: "Growth & Performance",
    categories: CATEGORIES.filter(c => c.group === "growth-performance")
  },
  {
    id: "geographic-excellence",
    label: "Geographic Excellence",
    categories: CATEGORIES.filter(c => c.group === "geographic-excellence")
  },
  {
    id: "special-recognition",
    label: "Special Recognition",
    categories: CATEGORIES.filter(c => c.group === "special-recognition")
  }
];

export function PublicPodium() {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].id);
  
  const { data, error, isLoading, mutate } = useSWR(
    `/api/podium?category=${encodeURIComponent(selectedCategory)}`,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds for real-time updates
      revalidateOnFocus: true,
    }
  );

  // Real-time vote updates
  const handleVoteUpdate = useCallback(() => {
    // Refresh podium data when votes are updated
    mutate();
  }, [mutate]);

  useRealtimeVotes({
    category: selectedCategory,
    onVoteUpdate: handleVoteUpdate,
  });

  const podiumItems: PodiumItem[] = data?.items || [];
  const selectedCategoryConfig = CATEGORIES.find(c => c.id === selectedCategory);

  const PodiumCard = ({ item }: { item: PodiumItem }) => {
    const isWinner = item.rank === 1;
    return (
      <Card className={`${rankColors[item.rank]} transition-all hover:shadow-lg ${isWinner ? 'transform md:scale-105 md:-mt-4' : ''}`}>
        <CardContent className={`${isWinner ? 'p-8' : 'p-6'}`}>
          <div className="text-center">
            {/* Rank Badge */}
            <div className="mb-4">
              <Badge 
                variant="outline" 
                className={`${isWinner ? 'text-xl px-4 py-2' : 'text-lg px-3 py-1'} font-bold border-2`}
              >
                {rankEmojis[item.rank]} #{item.rank}
              </Badge>
            </div>

            {/* Avatar */}
            <div className="mb-4">
              <Avatar className={`${isWinner ? 'w-24 h-24' : 'w-20 h-20'} mx-auto border-4 border-white shadow-lg`}>
                {item.image_url ? (
                  <AvatarImage 
                    src={item.image_url} 
                    alt={item.name}
                    className={item.type === "company" ? "object-contain p-2" : "object-cover"}
                  />
                ) : (
                  <AvatarFallback className={`${isWinner ? "text-2xl" : "text-xl"} bg-slate-600 text-white`}>
                    {(() => {
                      const initials = item.name
                        .split(" ")
                        .map(n => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2);
                      return initials;
                    })()}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>

            {/* Name */}
            <h3 className={`font-bold ${isWinner ? 'text-xl' : 'text-lg'} mb-2 line-clamp-2`}>{item.name}</h3>

            {/* Votes */}
            <div className="flex items-center justify-center gap-2 mb-4 text-muted-foreground">
              <ThumbsUp className="h-4 w-4" />
              <span className="font-semibold">{item.votes} votes</span>
            </div>

            {/* Action */}
            <Button asChild size={isWinner ? "default" : "sm"} className="w-full">
              <Link href={`/nominee/${item.live_slug}`}>
                View Profile
                <ExternalLink className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyPodiumSlot = ({ rank }: { rank: 1 | 2 | 3 }) => (
    <Card className="border-dashed opacity-60">
      <CardContent className="p-6">
        <div className="text-center">
          <div className="mb-4">
            <Badge variant="outline" className="text-lg px-3 py-1">
              {rankEmojis[rank]} #{rank}
            </Badge>
          </div>
          <div className="mb-4">
            <Avatar className="w-20 h-20 mx-auto border-2 border-dashed">
              <AvatarFallback>
                <Trophy className="h-8 w-8 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
          </div>
          <p className="text-sm text-muted-foreground">
            Awaiting nominations
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <section className="py-16 px-4 bg-slate-50">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3 text-slate-900">
            <Trophy className="h-8 w-8 text-orange-500" />
            Top 3 Podium
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            See who's leading in each category based on community votes. 
            Switch between categories to explore all the amazing nominees.
          </p>
        </div>

        {/* Category Selection */}
        <div className="w-full">
          {/* Category Group Tabs */}
          <div className="mb-6">
            <div className="flex flex-wrap justify-center gap-2">
              {categoryGroups.map((group) => {
                const isActiveGroup = group.categories.some(c => c.id === selectedCategory);
                return (
                  <Button
                    key={group.id}
                    variant={isActiveGroup ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(group.categories[0]?.id || "")}
                    className={`text-xs font-medium transition-all duration-200 ${
                      isActiveGroup 
                        ? 'bg-slate-800 hover:bg-slate-900 text-white border-slate-800' 
                        : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {group.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Individual Category Selector */}
          <div className="mb-16">
            <div className="flex flex-wrap justify-center gap-2">
              {categoryGroups.map((group) => 
                group.categories.some(c => c.id === selectedCategory) ? (
                  group.categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className={`text-xs font-medium transition-all duration-200 ${
                        selectedCategory === category.id 
                          ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500' 
                          : 'bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-700 border border-slate-200 hover:border-orange-200'
                      }`}
                    >
                      {category.label}
                    </Button>
                  ))
                ) : null
              )}
            </div>
          </div>



          {/* Podium Display */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[1, 2, 3].map((rank) => (
                <Card key={rank}>
                  <CardContent className="p-6">
                    <div className="text-center space-y-4">
                      <Skeleton className="w-16 h-8 mx-auto" />
                      <Skeleton className="w-20 h-20 rounded-full mx-auto" />
                      <Skeleton className="h-6 w-32 mx-auto" />
                      <Skeleton className="h-4 w-20 mx-auto" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-slate-600">Failed to load podium data</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Render in podium order: 2nd, 1st, 3rd for visual hierarchy */}
              {[2, 1, 3].map((rank) => {
                const item = podiumItems.find(p => p.rank === rank);
                return item ? (
                  <div key={item.nomineeId} className={rank === 1 ? "md:order-2" : rank === 2 ? "md:order-1" : "md:order-3"}>
                    <PodiumCard item={item} />
                  </div>
                ) : (
                  <div key={rank} className={rank === 1 ? "md:order-2" : rank === 2 ? "md:order-1" : "md:order-3"}>
                    <EmptyPodiumSlot rank={rank as 1 | 2 | 3} />
                  </div>
                );
              })}
            </div>
          )}
        </div>


      </div>
    </section>
  );
}