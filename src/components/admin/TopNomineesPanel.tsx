"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, Award, Crown } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";

interface TopNominee {
  id: string;
  displayName: string;
  subcategoryId: string;
  votes: number;
  imageUrl?: string;
  type: 'person' | 'company';
}

interface TopNomineesPanelProps {
  nominations: any[];
  onCategoryChange?: (category: string) => void;
}

export function TopNomineesPanel({ nominations, onCategoryChange }: TopNomineesPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [topNominees, setTopNominees] = useState<TopNominee[]>([]);

  useEffect(() => {
    // Filter by category if selected
    let filtered = nominations.filter(n => n.state === 'approved');
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(n => n.subcategory_id === selectedCategory);
    }

    // Get top 3 nominees by votes
    const top3 = filtered
      .sort((a, b) => (b.totalVotes || b.votes || 0) - (a.totalVotes || a.votes || 0))
      .slice(0, 3)
      .map(n => ({
        id: n.id,
        displayName: n.displayName,
        subcategoryId: n.subcategory_id,
        votes: n.totalVotes || n.votes || 0,
        imageUrl: n.imageUrl,
        type: n.type
      }));

    setTopNominees(top3);
  }, [nominations, selectedCategory]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    onCategoryChange?.(category);
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 1: return <Trophy className="h-5 w-5 text-gray-400" />;
      case 2: return <Medal className="h-5 w-5 text-amber-600" />;
      default: return null;
    }
  };

  const getRankBg = (index: number) => {
    switch (index) {
      case 0: return "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200";
      case 1: return "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200";
      case 2: return "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200";
      default: return "bg-muted/30";
    }
  };

  return (
    <div className="space-y-4">
      {/* Category Selector */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Category Filter</CardTitle>
          <CardDescription>Select category to view top nominees</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200 shadow-lg z-[100] max-h-[300px] overflow-y-auto">
              <SelectItem value="all" className="text-gray-900 hover:bg-gray-50 focus:bg-gray-50">
                All Categories
              </SelectItem>
              {CATEGORIES.map(category => (
                <SelectItem 
                  key={category.id} 
                  value={category.id}
                  className="text-gray-900 hover:bg-gray-50 focus:bg-gray-50"
                >
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Top 3 Nominees */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top 3 Nominees
          </CardTitle>
          <CardDescription>
            {selectedCategory === 'all' 
              ? 'Highest vote counts across all categories'
              : `Top nominees in ${CATEGORIES.find(c => c.id === selectedCategory)?.name || selectedCategory}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topNominees.map((nominee, index) => (
              <div 
                key={nominee.id} 
                className={`flex items-center gap-3 p-4 rounded-lg border transition-all hover:shadow-md ${getRankBg(index)}`}
              >
                <div className="flex-shrink-0">
                  {getRankIcon(index)}
                </div>
                
                {nominee.imageUrl && (
                  <img 
                    src={nominee.imageUrl} 
                    alt={nominee.displayName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{nominee.displayName}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {CATEGORIES.find(c => c.id === nominee.subcategoryId)?.name || nominee.subcategoryId}
                  </div>
                  <Badge variant="outline" className="text-xs px-1 py-0 mt-1">
                    {nominee.type === 'person' ? 'Individual' : 'Company'}
                  </Badge>
                </div>
                
                <div className="flex flex-col items-end">
                  <div className="text-lg font-bold text-primary">{nominee.votes}</div>
                  <div className="text-xs text-muted-foreground">votes</div>
                </div>
              </div>
            ))}
            
            {topNominees.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <div className="text-sm">No nominees found</div>
                <div className="text-xs">
                  {selectedCategory === 'all' 
                    ? 'No approved nominees available'
                    : 'No nominees in this category'
                  }
                </div>
              </div>
            )}
            
            {topNominees.length > 0 && topNominees.length < 3 && (
              <div className="text-center py-4 text-muted-foreground text-xs">
                Showing top {topNominees.length} nominee{topNominees.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                {nominations.filter(n => n.state === 'approved' && (selectedCategory === 'all' || n.subcategory_id === selectedCategory)).length}
              </div>
              <div className="text-xs text-muted-foreground">Approved</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {nominations
                  .filter(n => n.state === 'approved' && (selectedCategory === 'all' || n.subcategory_id === selectedCategory))
                  .reduce((sum, n) => sum + (n.totalVotes || n.votes || 0), 0)
                }
              </div>
              <div className="text-xs text-muted-foreground">Total Votes</div>
            </div>
          </div>
          
          {/* Vote Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-lg font-bold text-blue-700">
                {nominations
                  .filter(n => n.state === 'approved' && (selectedCategory === 'all' || n.subcategory_id === selectedCategory))
                  .reduce((sum, n) => sum + (n.votes || 0), 0)
                }
              </div>
              <div className="text-xs text-blue-600">Real Votes</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-lg font-bold text-orange-700">
                {nominations
                  .filter(n => n.state === 'approved' && (selectedCategory === 'all' || n.subcategory_id === selectedCategory))
                  .reduce((sum, n) => sum + (n.additionalVotes || 0), 0)
                }
              </div>
              <div className="text-xs text-orange-600">Additional</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}