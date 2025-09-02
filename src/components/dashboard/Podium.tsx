"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Trophy, ThumbsUp, User, Building } from "lucide-react";
import { CATEGORIES, Category } from "@/lib/constants";
import { getNomineeImage } from "@/lib/nominee-image";
import useSWR from "swr";

type PodiumItem = {
  rank: 1 | 2 | 3;
  nomineeId: string;
  name: string;
  category: string;
  type: "person" | "company";
  image: string | null;
  votes: number;
  liveUrl: string;
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

const rankEmojis = {
  1: "🥇",
  2: "🥈",
  3: "🥉"
};

const rankColors = {
  1: "bg-yellow-100 text-yellow-800 border-yellow-200",
  2: "bg-gray-100 text-gray-800 border-gray-200",
  3: "bg-orange-100 text-orange-800 border-orange-200"
};

interface PodiumProps {
  className?: string;
}

export function Podium({ className = "" }: PodiumProps) {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].id);

  const { data, error, isLoading, mutate } = useSWR(
    `/api/podium?category=${encodeURIComponent(selectedCategory)}`,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  );

  const podiumItems: PodiumItem[] = data?.items || [];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category as Category);
  };

  const handleOpenProfile = (liveUrl: string) => {
    // Remove the /nominee/ prefix if it exists since liveUrl already includes it
    const url = liveUrl.startsWith('/nominee/') ? liveUrl : `/nominee/${liveUrl}`;
    window.open(url, '_blank');
  };

  // Listen for real-time vote updates
  useEffect(() => {
    const handleVoteUpdate = () => {
      mutate(); // Refresh podium data
    };

    window.addEventListener('vote-update', handleVoteUpdate);
    return () => window.removeEventListener('vote-update', handleVoteUpdate);
  }, [mutate]);

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top 3 Podium
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Failed to load podium data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Top 3 Podium
        </CardTitle>
        <CardDescription>
          Leading nominees by vote count
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Selector */}
        <div>
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select category..." />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Podium Display */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((rank) => (
              <div key={rank} className="flex items-center gap-3 p-3 border rounded-lg">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        ) : podiumItems.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No approved nominees yet for this category
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Render podium items */}
            {podiumItems.map((item) => (
              <div
                key={item.nomineeId}
                className={`flex items-center gap-3 p-4 border rounded-lg transition-all hover:shadow-sm ${item.rank === 1 ? "border-yellow-200 bg-yellow-50" :
                    item.rank === 2 ? "border-gray-200 bg-gray-50" :
                      "border-orange-200 bg-orange-50"
                  }`}
              >
                {/* Rank Badge */}
                <div className="flex-shrink-0">
                  <Badge
                    variant="outline"
                    className={`${rankColors[item.rank]} font-semibold`}
                  >
                    {rankEmojis[item.rank]} #{item.rank}
                  </Badge>
                </div>

                {/* Avatar */}
                <Avatar className="w-12 h-12">
                  {item.image ? (
                    <AvatarImage
                      src={item.image}
                      alt={item.name}
                      className={item.type === "company" ? "object-contain p-1" : "object-cover"}
                    />
                  ) : (
                    <AvatarFallback>
                      {item.type === "person" ? (
                        <User className="h-6 w-6" />
                      ) : (
                        <Building className="h-6 w-6" />
                      )}
                    </AvatarFallback>
                  )}
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">{item.name}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ThumbsUp className="h-3 w-3" />
                    <span>{item.votes} votes</span>
                  </div>
                </div>

                {/* Action */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenProfile(item.liveUrl)}
                  className="flex-shrink-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {/* Placeholder for missing ranks */}
            {podiumItems.length < 3 && (
              <>
                {Array.from({ length: 3 - podiumItems.length }, (_, i) => {
                  const rank = (podiumItems.length + i + 1) as 1 | 2 | 3;
                  return (
                    <div
                      key={`placeholder-${rank}`}
                      className="flex items-center gap-3 p-4 border border-dashed rounded-lg opacity-50"
                    >
                      <Badge variant="outline" className="text-muted-foreground">
                        {rankEmojis[rank]} #{rank}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                          Awaiting approvals
                        </p>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}