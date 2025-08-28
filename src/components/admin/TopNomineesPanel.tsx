"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award, ExternalLink, User, Building2, RefreshCw } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";

interface TopNominee {
  id: string;
  nominationId: string;
  rank: number;
  type: 'person' | 'company';
  displayName: string;
  imageUrl?: string;
  votes: number;
  category: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  linkedin?: string;
  jobtitle?: string;
  headshotUrl?: string;
  whyMe?: string;
  companyName?: string;
  companyWebsite?: string;
  companyLinkedin?: string;
  logoUrl?: string;
  whyUs?: string;
  liveUrl?: string;
  state: string;
}

interface TopNomineesPanelProps {
  onEditNominee?: (nominee: TopNominee) => void;
}

export function TopNomineesPanel({ onEditNominee }: TopNomineesPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [topNominees, setTopNominees] = useState<TopNominee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTopNominees = async (category: string) => {
    if (!category) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/top-nominees?category=${encodeURIComponent(category)}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setTopNominees(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch top nominees');
        }
      } else {
        throw new Error(`HTTP ${response.status}: Failed to fetch top nominees`);
      }
    } catch (error) {
      console.error('Failed to fetch top nominees:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch top nominees');
      setTopNominees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCategory) {
      fetchTopNominees(selectedCategory);
    }
  }, [selectedCategory]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <Award className="h-5 w-5 text-gray-400" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
      case 3:
        return "bg-gradient-to-r from-amber-400 to-amber-600 text-white";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Top 3 Nominees by Category
        </CardTitle>
        <CardDescription>
          View the top 3 nominees in each category based on vote count
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Category Selection */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category to view top nominees" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        {category.type === 'person' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Building2 className="h-4 w-4" />
                        )}
                        {category.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedCategory && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchTopNominees(selectedCategory)}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-8">
              <div className="text-red-500 mb-2">Error loading top nominees</div>
              <div className="text-sm text-muted-foreground">{error}</div>
            </div>
          )}

          {/* No Category Selected */}
          {!selectedCategory && !loading && (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a Category</h3>
              <p className="text-muted-foreground">
                Choose a category from the dropdown above to view the top 3 nominees
              </p>
            </div>
          )}

          {/* No Nominees Found */}
          {selectedCategory && !loading && topNominees.length === 0 && !error && (
            <div className="text-center py-12">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Nominees Found</h3>
              <p className="text-muted-foreground">
                No approved nominees found for this category yet
              </p>
            </div>
          )}

          {/* Top Nominees List */}
          {!loading && topNominees.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  Top {topNominees.length} in {CATEGORIES.find(c => c.id === selectedCategory)?.label}
                </h3>
                <Badge variant="outline">
                  {CATEGORIES.find(c => c.id === selectedCategory)?.type === 'person' ? 'Individual' : 'Company'} Category
                </Badge>
              </div>

              {topNominees.map((nominee) => (
                <Card key={nominee.id} className={`relative overflow-hidden ${nominee.rank === 1 ? 'ring-2 ring-yellow-400' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Rank Badge */}
                      <div className={`flex items-center justify-center w-12 h-12 rounded-full ${getRankColor(nominee.rank)}`}>
                        <div className="flex items-center gap-1">
                          {getRankIcon(nominee.rank)}
                          <span className="font-bold text-sm">#{nominee.rank}</span>
                        </div>
                      </div>

                      {/* Nominee Image */}
                      {nominee.imageUrl && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden border bg-white flex-shrink-0">
                          <img 
                            src={nominee.imageUrl} 
                            alt={nominee.displayName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      {/* Nominee Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-lg">{nominee.displayName}</h4>
                          <Badge variant={nominee.type === 'person' ? 'default' : 'secondary'}>
                            {nominee.type === 'person' ? 'Individual' : 'Company'}
                          </Badge>
                        </div>

                        <div className="text-sm text-muted-foreground space-y-1 mb-3">
                          {nominee.type === 'person' && nominee.jobtitle && (
                            <p><strong>Title:</strong> {nominee.jobtitle}</p>
                          )}
                          {nominee.type === 'person' && nominee.email && (
                            <p><strong>Email:</strong> {nominee.email}</p>
                          )}
                          {nominee.type === 'company' && nominee.companyWebsite && (
                            <p><strong>Website:</strong> {nominee.companyWebsite}</p>
                          )}
                          <p><strong>Votes:</strong> {nominee.votes}</p>
                        </div>

                        {/* Why Vote Text */}
                        {(nominee.whyMe || nominee.whyUs) && (
                          <div className="text-sm mb-3">
                            <p className="font-medium mb-1">Why Vote:</p>
                            <p className="text-muted-foreground italic line-clamp-2">
                              {nominee.whyMe || nominee.whyUs}
                            </p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 flex-wrap">
                          {onEditNominee && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onEditNominee(nominee)}
                            >
                              Edit Details
                            </Button>
                          )}
                          
                          {nominee.linkedin && (
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                            >
                              <a 
                                href={nominee.linkedin} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1"
                              >
                                LinkedIn
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          )}
                          
                          {nominee.liveUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                            >
                              <a 
                                href={nominee.liveUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1"
                              >
                                Live URL
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}