"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Vote } from "lucide-react";
import { Nomination } from "@/lib/types";
import { VoteDialog } from "@/components/VoteDialog";
import { ShareButtons } from "@/components/ShareButtons";
import { useRealtimeVotes } from "@/hooks/useRealtimeVotes";
import { getNomineeImage } from "@/lib/nominee-image";
import Image from "next/image";
import { SuggestedNomineesCard } from "@/components/SuggestedNomineesCard";

interface NomineeProfileClientProps {
  nomination: Nomination;
}

export function NomineeProfileClient({ nomination }: NomineeProfileClientProps) {
  const [voteCount, setVoteCount] = useState<number>(nomination.votes || 0);
  const [showVoteDialog, setShowVoteDialog] = useState(false);

  // Real-time vote updates
  const handleVoteUpdate = useCallback((payload: any) => {
    if (payload.new.nominee_id === nomination.id) {
      // Optimistically increment vote count
      setVoteCount(prev => prev + 1);
      
      // Fetch fresh count to ensure accuracy
      fetch(`/api/votes/count?nomineeId=${nomination.id}`)
        .then(res => res.json())
        .then(data => setVoteCount(data.total))
        .catch(console.error);
    }
  }, [nomination.id]);

  useRealtimeVotes({
    nomineeId: nomination.id,
    onVoteUpdate: handleVoteUpdate,
  });

  const handleVoteSuccess = (newTotal: number) => {
    // Optimistically update vote count
    setVoteCount(newTotal);
  };

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
                    <div className="mb-4">
                      <h1 className="text-5xl font-black text-gray-900 mb-4">{nominee.name}</h1>
                      <div className="mb-3">
                        <Badge variant="outline" className="text-xs font-normal px-2 py-1">
                          {nomination.category}
                        </Badge>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 mb-6">
                      {isPersonNomination && (nominee as any).title && (
                        <p className="text-sm font-medium text-gray-600">{(nominee as any).title}</p>
                      )}
                      {!isPersonNomination && (nominee as any).website && (
                        <p className="text-sm">
                          <a 
                            href={(nominee as any).website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {(nominee as any).website}
                          </a>
                        </p>
                      )}
                      {nominee.country && (
                        <p className="text-sm text-gray-500">{nominee.country}</p>
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