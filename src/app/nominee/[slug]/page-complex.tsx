"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Vote, Share2 } from "lucide-react";
import { Nomination, Vote as VoteType } from "@/lib/types";
import { VoteDialog } from "@/components/VoteDialog";
import { ShareButtons } from "@/components/ShareButtons";
import { useRealtimeVotes } from "@/hooks/useRealtimeVotes";
import { getNomineeImage } from "@/lib/nominee-image";
import Image from "next/image";
import { SuggestedNomineesCard } from "@/components/SuggestedNomineesCard";

export default function SimpleNomineeProfilePage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [nomination, setNomination] = useState<Nomination | null>(null);
  const [votes, setVotes] = useState<VoteType[]>([]);
  const [voteCount, setVoteCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [showVoteDialog, setShowVoteDialog] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch nominee with vote count from unified API
        const nomineeResponse = await fetch(`/api/nominee/${slug}`, {
          cache: 'no-store'
        });
        
        if (!nomineeResponse.ok) {
          if (nomineeResponse.status === 404) {
            setError("Nominee not found");
          } else {
            setError("Failed to fetch nominee");
          }
          return;
        }
        
        const nomineeData = await nomineeResponse.json();
        setNomination(nomineeData);
        setVoteCount(nomineeData.votes);
        
        // No need to fetch votes separately - count is included
        setVotes([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug]);

  // Real-time vote updates
  const handleVoteUpdate = useCallback((payload: any) => {
    if (nomination && payload.new.nominee_id === nomination.id) {
      // Optimistically increment vote count
      setVoteCount(prev => prev + 1);
      
      // Fetch fresh count to ensure accuracy
      fetch(`/api/votes/count?nomineeId=${nomination.id}`)
        .then(res => res.json())
        .then(data => setVoteCount(data.total))
        .catch(console.error);
    }
  }, [nomination]);

  useRealtimeVotes({
    nomineeId: nomination?.id,
    onVoteUpdate: handleVoteUpdate,
  });

  const handleVoteSuccess = (newTotal: number) => {
    // Optimistically update vote count
    setVoteCount(newTotal);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Vote for ${nomination?.nominee.name} - World Staffing Awards 2026`,
          text: `Check out this nominee for ${nomination?.category}`,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You could show a toast here
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-64 w-full mb-6" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div>
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !nomination) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          <Alert variant="destructive">
            <AlertDescription>{error || "Nominee not found"}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const isPersonNomination = nomination.type === "person";
  const nominee = nomination.nominee;
  const imageData = getNomineeImage(nomination);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <Button variant="outline" className="mb-6" onClick={() => window.history.back()}>
          ← Back to Directory
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Hero Card */}
            <Card className="mb-8">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Image */}
                  <div className="flex-shrink-0">
                    <div className="w-32 h-32 rounded-xl overflow-hidden border">
                      {imageData.isInitials ? (
                        <img 
                          src={imageData.src}
                          alt={imageData.alt}
                          loading="lazy"
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image 
                          src={imageData.src}
                          alt={imageData.alt}
                          width={128}
                          height={128}
                          className={`w-full h-full ${isPersonNomination ? "object-cover" : "object-contain bg-white p-2"}`}
                          unoptimized={imageData.src.startsWith('data:')}
                        />
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h1 className="text-3xl font-bold mb-2">{nominee.name}</h1>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">
                            {nomination.category}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-muted-foreground mb-4">
                      {isPersonNomination && "title" in nominee && nominee.title && (
                        <p className="text-lg">{nominee.title}</p>
                      )}
                      {!isPersonNomination && "website" in nominee && (
                        <p>
                          <a 
                            href={nominee.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {nominee.website}
                          </a>
                        </p>
                      )}
                      {nominee.country && (
                        <p>{nominee.country}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                      <Button asChild variant="outline">
                        <a 
                          href={nominee.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          LinkedIn Profile
                        </a>
                      </Button>
                      <Button variant="outline" onClick={handleShare} className="flex items-center gap-2">
                        <Share2 className="h-4 w-4" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Why Vote for Me Section */}
            {nomination.whyVoteForMe && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Why you should vote for {nominee.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {nomination.whyVoteForMe}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Nomination Details */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Nomination Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-1">Category</h4>
                    <p className="text-muted-foreground">{nomination.category}</p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-1">Nomination Date</h4>
                    <p className="text-muted-foreground">
                      {new Date(nomination.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share Section */}
            <Card>
              <CardHeader>
                <CardTitle>Share This Nomination</CardTitle>
              </CardHeader>
              <CardContent>
                <ShareButtons 
                  nomineeName={nominee.name}
                  liveUrl={nomination.liveUrl}
                />
              </CardContent>
            </Card>

            {/* Mobile Vote Section */}
            <div className="lg:hidden mt-8 space-y-6">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Vote className="h-5 w-5" />
                    Vote for {nominee.name}
                  </CardTitle>
                  <CardDescription>
                    Support this nominee in the World Staffing Awards 2026
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-4">
                    <div className="text-3xl font-bold text-primary">{voteCount}</div>
                    <div className="text-sm text-muted-foreground">votes received</div>
                  </div>
                  <Button 
                    onClick={() => setShowVoteDialog(true)}
                    className="w-full"
                    size="lg"
                  >
                    Cast Your Vote
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    One vote per nominee per category
                  </p>
                </CardContent>
              </Card>

              <SuggestedNomineesCard 
                currentNomineeId={nomination.id}
                currentCategory={nomination.category}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block lg:col-span-1 sticky top-24 space-y-6">
            {/* Vote Card */}
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Vote className="h-5 w-5" />
                  Vote for {nominee.name}
                </CardTitle>
                <CardDescription>
                  Support this nominee in the World Staffing Awards 2026
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-4">
                  <div className="text-3xl font-bold text-primary">{voteCount}</div>
                  <div className="text-sm text-muted-foreground">votes received</div>
                </div>
                <Button 
                  onClick={() => setShowVoteDialog(true)}
                  className="w-full"
                  size="lg"
                >
                  Cast Your Vote
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  One vote per nominee per category
                </p>
              </CardContent>
            </Card>

            {/* Category Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About This Category</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="mb-3">
                  {nomination.category}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  This category recognizes outstanding {isPersonNomination ? "individuals" : "companies"} 
                  who have made significant contributions to the staffing industry.
                </p>
              </CardContent>
            </Card>

            {/* Suggested Nominees */}
            <SuggestedNomineesCard 
              currentNomineeId={nomination.id}
              currentCategory={nomination.category}
            />
          </div>
        </div>

        {/* Vote Dialog */}
        <VoteDialog
          open={showVoteDialog}
          onOpenChange={setShowVoteDialog}
          nomination={nomination}
          onVoteSuccess={handleVoteSuccess}
        />
      </div>
    </div>
  );
}