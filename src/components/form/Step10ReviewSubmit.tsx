"use client";


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, ExternalLink, Loader2 } from "lucide-react";
import { Category, CATEGORIES } from "@/lib/constants";
import { NominatorData } from "@/lib/validation";

interface NomineeData {
  name: string;
  email: string;
  title?: string;
  website?: string;
  country?: string;
  linkedin: string;
  imageUrl?: string;
}

interface SubmitResult {
  success?: boolean;
  duplicate?: boolean;
  liveUrl?: string;
  error?: string;
  reason?: string;
  nominationId?: string;
  state?: string;
}

interface Step10ReviewSubmitProps {
  category: Category;
  nominator: NominatorData;
  nominee: NomineeData;
  onSubmit: () => Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
  submitResult: SubmitResult | null;
}

export function Step10ReviewSubmit({ 
  category, 
  nominator, 
  nominee, 
  onSubmit, 
  onBack, 
  isSubmitting,
  submitResult 
}: Step10ReviewSubmitProps) {
  const categoryConfig = CATEGORIES.find(c => c.id === category);
  const isPersonNomination = categoryConfig?.type === "person";

  if (submitResult?.success || submitResult?.duplicate) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            submitResult.duplicate ? "bg-amber-100" : "bg-green-100"
          }`}>
            <CheckCircle className={`h-8 w-8 ${
              submitResult.duplicate ? "text-amber-600" : "text-green-600"
            }`} />
          </div>
          <CardTitle className="text-2xl">
            {submitResult.duplicate ? "Already Nominated" : "Nominee Submitted Successfully!"}
          </CardTitle>
          <CardDescription>
            {submitResult.duplicate 
              ? submitResult.reason || "A nomination for this category with the same LinkedIn URL already exists."
              : "Thank you for submitting your nomination! It has been received and will be reviewed by our team before appearing in the public directory. The nominee will be notified via email once approved."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {submitResult.nominationId && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Nomination ID:</span> {submitResult.nominationId}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-medium">Status:</span> {submitResult.state || 'Submitted'}
              </p>
            </div>
          )}

          {submitResult.liveUrl && (
            <div className="text-center">
              <Button asChild>
                <a href={submitResult.liveUrl} target="_blank" rel="noopener noreferrer">
                  {submitResult.duplicate ? "View Live Nomination" : "View Your Nomination"}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          )}
          
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = "/nominate"}
            >
              Submit Another Nomination
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Review & Submit</CardTitle>
        <CardDescription>
          Please review your nomination details before submitting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category */}
        <div>
          <h3 className="font-semibold mb-2">Award Category</h3>
          <div className="flex items-center gap-2">
            <Badge variant="default">{category}</Badge>
            <Badge variant="secondary">{categoryConfig?.type}</Badge>
          </div>
        </div>

        <Separator />

        {/* Nominator */}
        <div>
          <h3 className="font-semibold mb-2">Your Information</h3>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Name:</span> {nominator.name || `${nominator.firstName || ''} ${nominator.lastName || ''}`.trim()}</p>
            <p><span className="font-medium">Email:</span> {nominator.email}</p>
            <p><span className="font-medium">LinkedIn:</span> <a href={nominator.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Profile</a></p>
          </div>
        </div>

        <Separator />

        {/* Nominee */}
        <div>
          <h3 className="font-semibold mb-2">
            {isPersonNomination ? "Nominee Information" : "Company Information"}
          </h3>
          <div className="flex gap-4">
            {/* Image */}
            <div className="flex-shrink-0">
              {nominee.imageUrl && (
                <div className="w-20 h-20 rounded-lg overflow-hidden border bg-white">
                  <img 
                    src={nominee.imageUrl} 
                    alt={isPersonNomination ? "Headshot" : "Logo"} 
                    className={`w-full h-full ${isPersonNomination ? "object-cover" : "object-contain p-2"}`}
                  />
                </div>
              )}
            </div>
            
            {/* Details */}
            <div className="flex-1 space-y-1 text-sm">
              <p><span className="font-medium">Name:</span> {nominee.name}</p>
              <p><span className="font-medium">Email:</span> {nominee.email}</p>
              {nominee.title && (
                <p><span className="font-medium">Title:</span> {nominee.title}</p>
              )}
              {nominee.website && (
                <p><span className="font-medium">Website:</span> {nominee.website}</p>
              )}
              {nominee.country && (
                <p><span className="font-medium">Country:</span> {nominee.country}</p>
              )}
              <p>
                <span className="font-medium">LinkedIn:</span>{" "}
                <a 
                  href={nominee.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View Profile
                </a>
              </p>
            </div>
          </div>
        </div>

        {submitResult?.error && (
          <Alert variant="destructive">
            <AlertDescription>{submitResult.error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">What happens next?</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Your nomination will be reviewed by our team</li>
            <li>• Approved nominations appear in the public directory</li>
            <li>• The nominee will be notified via email</li>
            <li>• Public voting opens on February 15, 2025</li>
          </ul>
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
            Back
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Nomination"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}