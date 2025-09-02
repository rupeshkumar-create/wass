"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Vote, ArrowLeft, Building2, User } from "lucide-react";
import { VoteDialog } from "@/components/VoteDialog";
import { ShareButtons } from "@/components/ShareButtons";
import { useRealtimeVotes } from "@/hooks/useRealtimeVotes";
import { Nomination } from "@/lib/types";
import Image from "next/image";
import { SuggestedNomineesCard } from "@/components/SuggestedNomineesCard";

interface NomineeData extends Nomination {
  nomineeId: string;
  categoryGroup: string;
  votes: number;
  approvedAt?: string;
  nominee: {
    id: string;
    name: string;
    displayName: string;
    imageUrl?: string;
    type: 'person' | 'company';
    firstName?: string;
    lastName?: string;
    title?: string;
    jobtitle?: string;
    linkedin?: string;
    personLinkedin?: string;
    whyVoteForMe?: string;
    whyMe?: string;
    companyName?: string;
    website?: string;
    companyWebsite?: string;
    industry?: string;
    companyLinkedin?: string;
    whyUs?: string;
    liveUrl?: string;
    whyVote?: string;
  };
  nominator: {
    name: string;
    email: string;
    displayName: string;
  };
}

interface NomineeProfileClientProps {
  nominee: NomineeData;
}

export function NomineeProfileClient({ nominee: nomineeData }: NomineeProfileClientProps) {
  const [isClient, setIsClient] = useState(false);
  const [voteCount, setVoteCount] = useState<number>(nomineeData?.votes || 0);
  const [showVoteDialog, setShowVoteDialog] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Add safety checks for nomineeData
  if (!nomineeData || !nomineeData.nominee) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Nominee Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The nominee you're looking for could not be found or may have been removed.
            </p>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Real-time vote updates
  const handleVoteUpdate = useCallback((data: any) => {
    // Update vote count from polling data
    if (data && typeof data.total === 'number') {
      setVoteCount(data.total);
    }
  }, []);

  // Only enable real-time updates after client hydration
  useRealtimeVotes(isClient ? {
    nomineeId: nomineeData.id,
    onVoteUpdate: handleVoteUpdate,
  } : {});

  const handleVoteSuccess = (newTotal: number) => {
    // Optimistically update vote count
    setVoteCount(newTotal);
  };

  const isPersonNomination = nomineeData.type === "person";
  const nominee = nomineeData.nominee || {};
  
  // Get the appropriate image URL with safety checks
  const imageUrl = nominee.imageUrl || nomineeData.imageUrl || null;
  
  // Get LinkedIn URL with safety checks
  const linkedinUrl = nominee.linkedin || nominee.personLinkedin || nominee.companyLinkedin || null;
  
  // Get why vote text with safety checks
  const whyVoteText = nominee.whyVoteForMe || nominee.whyMe || nominee.whyUs || nominee.whyVote || null;
  
  // Get website URL with safety checks
  const websiteUrl = nominee.website || nominee.companyWebsite || nominee.liveUrl || nomineeData.liveUrl || null;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <Button variant="outline" className="mb-6" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Directory
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
                    <div className="w-32 h-32 rounded-xl overflow-hidden border bg-gray-100 flex items-center justify-center">
                      {imageUrl ? (
                        <Image 
                          src={imageUrl}
                          alt={nominee.displayName || nominee.name || 'Nominee'}
                          width={128}
                          height={128}
                          className={`w-full h-full ${isPersonNomination ? "object-cover" : "object-contain bg-white p-2"}`}
                          unoptimized={imageUrl.startsWith('data:') || imageUrl.includes('unsplash')}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          {isPersonNomination ? (
                            <User className="h-12 w-12 text-white" />
                          ) : (
                            <Building2 className="h-12 w-12 text-white" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="mb-4">
                      <h1 className="text-5xl font-black text-gray-900 mb-4">
                        {nominee.displayName || nominee.name || 'Unknown Nominee'}
                      </h1>
                      <div className="mb-3 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-normal px-2 py-1">
                          {nomineeData.category || 'Unknown Category'}
                        </Badge>
                        <Badge variant={isPersonNomination ? "default" : "secondary"} className="text-xs">
                          {isPersonNomination ? "Individual" : "Company"}
                        </Badge>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 mb-6">
                      {isPersonNomination && (nominee.title || nominee.jobtitle) && (
                        <p className="text-sm font-medium text-gray-600">
                          {nominee.title || nominee.jobtitle}
                        </p>
                      )}
                      {!isPersonNomination && nominee.industry && (
                        <p className="text-sm font-medium text-gray-600">{nominee.industry}</p>
                      )}
                      {!isPersonNomination && websiteUrl && (
                        <p className="text-sm">
                          <a 
                            href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            {websiteUrl}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                      {linkedinUrl && (
                        <Button asChild variant="outline">
                          <a 
                            href={linkedinUrl.startsWith('http') ? linkedinUrl : `https://${linkedinUrl}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            LinkedIn Profile
                          </a>
                        </Button>
                      )}

                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Why Vote Section */}
            {whyVoteText && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>
                    Why you should vote for {nominee.displayName || nominee.name || 'this nominee'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {whyVoteText}
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
                    <p className="text-muted-foreground">{nomineeData.category || 'Unknown Category'}</p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-1">Type</h4>
                    <p className="text-muted-foreground">
                      {isPersonNomination ? "Individual Nomination" : "Company Nomination"}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-1">Nomination Date</h4>
                    <p className="text-muted-foreground">
                      {nomineeData.createdAt ? new Date(nomineeData.createdAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                  {nomineeData.approvedAt && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-1">Approved Date</h4>
                        <p className="text-muted-foreground">
                          {new Date(nomineeData.approvedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </>
                  )}
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
                  nomineeName={nominee.displayName || nominee.name || 'Nominee'}
                  liveUrl={nomineeData.liveUrl || ''}
                />
              </CardContent>
            </Card>

            {/* Mobile Vote Section */}
            <div className="lg:hidden mt-8 space-y-6">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Vote className="h-5 w-5" />
                    Vote for {nominee.displayName || nominee.name || 'this nominee'}
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
                currentNomineeId={nomineeData.id}
                currentCategory={nomineeData.category}
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
                  Vote for {nominee.displayName || nominee.name || 'this nominee'}
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
                  {nomineeData.category || 'Unknown Category'}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  This category recognizes outstanding {isPersonNomination ? "individuals" : "companies"} 
                  who have made significant contributions to the staffing industry.
                </p>
              </CardContent>
            </Card>

            {/* Suggested Nominees */}
            <SuggestedNomineesCard 
              currentNomineeId={nomineeData.id}
              currentCategory={nomineeData.category}
            />
          </div>
        </div>

        {/* Vote Dialog */}
        <VoteDialog
          open={showVoteDialog}
          onOpenChange={setShowVoteDialog}
          nomination={{
            ...nomineeData,
            nominee: {
              name: nominee.displayName || nominee.name || 'Unknown Nominee',
              ...nominee
            }
          }}
          onVoteSuccess={handleVoteSuccess}
        />
      </div>
    </div>
  );
}