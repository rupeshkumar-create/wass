"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, Award, Crown, User, Building2 } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { subscribeToDataSync } from "@/lib/utils/data-sync";

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

export function TopNomineesPanel({ nominations = [], onCategoryChange }: TopNomineesPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [topNominees, setTopNominees] = useState<TopNominee[]>([]);

  // Subscribe to data sync events to refresh when data changes
  useEffect(() => {
    const unsubscribeNomination = subscribeToDataSync('nomination-updated', () => {
      // Trigger parent component to refresh nominations data
      onCategoryChange?.(selectedCategory);
    });
    
    const unsubscribeVote = subscribeToDataSync('vote-cast', () => {
      // Trigger parent component to refresh nominations data
      onCategoryChange?.(selectedCategory);
    });

    return () => {
      unsubscribeNomination();
      unsubscribeVote();
    };
  }, [selectedCategory, onCategoryChange]);

  useEffect(() => {
    // Ensure nominations is an array before filtering
    if (!Array.isArray(nominations)) {
      setTopNominees([]);
      return;
    }

    // Filter by category if selected
    let filtered = nominations.filter(n => n.state === 'approved');
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(n => n.subcategory_id === selectedCategory);
    }

    // Get top 3 nominees by combined votes (real + additional)
    const top3 = filtered
      .sort((a, b) => {
        const aTotal = (a.votes || 0) + (a.additionalVotes || 0);
        const bTotal = (b.votes || 0) + (b.additionalVotes || 0);
        return bTotal - aTotal;
      })
      .slice(0, 3)
      .map(n => {
        // Generate proper display name
        let displayName = '';
        if (n.displayName) {
          displayName = n.displayName;
        } else if (n.type === 'person') {
          displayName = `${n.firstname || ''} ${n.lastname || ''}`.trim();
          if (!displayName) {
            displayName = 'Unknown Person';
          }
        } else {
          displayName = n.companyName || n.company_name || 'Unknown Company';
        }
        
        return {
          id: n.id,
          displayName,
          subcategoryId: n.subcategory_id || n.subcategoryId,
          votes: (n.votes || 0) + (n.additionalVotes || 0), // Combined total
          imageUrl: n.imageUrl || n.headshotUrl || n.logoUrl || n.headshot_url || n.logo_url,
          type: n.type
        };
      });

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
                
                {/* Always show image or fallback */}
                <div className="flex-shrink-0">
                  {nominee.imageUrl ? (
                    <img 
                      src={nominee.imageUrl} 
                      alt={nominee.displayName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 border-2 border-white shadow-sm flex items-center justify-center">
                      {nominee.type === 'person' ? (
                        <User className="h-6 w-6 text-blue-600" />
                      ) : (
                        <Building2 className="h-6 w-6 text-purple-600" />
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{nominee.displayName}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {CATEGORIES.find(c => c.id === nominee.subcategoryId)?.name || nominee.subcategoryId}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                      {nominee.type === 'person' ? (
                        <User className="h-2.5 w-2.5 mr-1" />
                      ) : (
                        <Building2 className="h-2.5 w-2.5 mr-1" />
                      )}
                      {nominee.type === 'person' ? 'Person' : 'Company'}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex flex-col items-end justify-center">
                  <div className="text-lg font-bold text-primary">{nominee.votes}</div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">total votes</div>
                  {/* Show breakdown for admin */}
                  <div className="text-xs text-gray-400 mt-0.5 text-right">
                    {nominations.find(n => n.id === nominee.id)?.votes || 0}r + {nominations.find(n => n.id === nominee.id)?.additionalVotes || 0}a
                  </div>
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
                {Array.isArray(nominations) ? nominations.filter(n => n.state === 'approved' && (selectedCategory === 'all' || n.subcategory_id === selectedCategory)).length : 0}
              </div>
              <div className="text-xs text-muted-foreground">Approved</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {Array.isArray(nominations) ? nominations
                  .filter(n => n.state === 'approved' && (selectedCategory === 'all' || n.subcategory_id === selectedCategory))
                  .reduce((sum, n) => sum + (n.votes || 0) + (n.additionalVotes || 0), 0) : 0
                }
              </div>
              <div className="text-xs text-muted-foreground">Total Votes</div>
            </div>
          </div>
          
          {/* Vote Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-lg font-bold text-blue-700">
                {Array.isArray(nominations) ? nominations
                  .filter(n => n.state === 'approved' && (selectedCategory === 'all' || n.subcategory_id === selectedCategory))
                  .reduce((sum, n) => sum + (n.votes || 0), 0) : 0
                }
              </div>
              <div className="text-xs text-blue-600">Real Votes</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-lg font-bold text-orange-700">
                {Array.isArray(nominations) ? nominations
                  .filter(n => n.state === 'approved' && (selectedCategory === 'all' || n.subcategory_id === selectedCategory))
                  .reduce((sum, n) => sum + (n.additionalVotes || 0), 0) : 0
                }
              </div>
              <div className="text-xs text-orange-600">Additional</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Vote Breakdown Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Vote Breakdown</CardTitle>
          <CardDescription>Detailed vote analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">
                {Array.isArray(nominations) ? nominations
                  .filter(n => n.state === 'approved' && (selectedCategory === 'all' || n.subcategory_id === selectedCategory))
                  .reduce((sum, n) => sum + (n.votes || 0), 0) : 0
                }
              </div>
              <div className="text-sm text-blue-600 font-medium">Real Votes</div>
              <div className="text-xs text-blue-500 mt-1">From public voting</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-700">
                {Array.isArray(nominations) ? nominations
                  .filter(n => n.state === 'approved' && (selectedCategory === 'all' || n.subcategory_id === selectedCategory))
                  .reduce((sum, n) => sum + (n.additionalVotes || 0), 0) : 0
                }
              </div>
              <div className="text-sm text-orange-600 font-medium">Additional Votes</div>
              <div className="text-xs text-orange-500 mt-1">Manual adjustments</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-700">
                {Array.isArray(nominations) ? nominations
                  .filter(n => n.state === 'approved' && (selectedCategory === 'all' || n.subcategory_id === selectedCategory))
                  .reduce((sum, n) => sum + (n.votes || 0) + (n.additionalVotes || 0), 0) : 0
                }
              </div>
              <div className="text-sm text-purple-600 font-medium">Combined Total</div>
              <div className="text-xs text-purple-500 mt-1">Real + Additional</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}