"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Step5WhyVoteForMeProps {
  whyVoteForMe: string;
  onNext: (whyVoteForMe: string) => void;
  onBack: () => void;
}

export function Step5WhyVoteForMe({ whyVoteForMe, onNext, onBack }: Step5WhyVoteForMeProps) {
  const [text, setText] = useState(whyVoteForMe);
  const [error, setError] = useState("");

  const handleNext = () => {
    setError("");
    
    if (text.trim().length === 0) {
      setError("Please provide a reason why someone should vote for this nominee");
      return;
    }
    
    if (text.length > 1000) {
      setError("Please keep your response under 1000 characters");
      return;
    }
    
    onNext(text.trim());
  };

  const remainingChars = 1000 - text.length;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Why Vote for This Nominee?</CardTitle>
        <CardDescription>
          Help voters understand what makes this nominee exceptional
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label htmlFor="whyVoteForMe">
            Why should someone vote for this nominee? *
          </Label>
          
          <Textarea
            id="whyVoteForMe"
            placeholder="Describe their achievements, impact, leadership qualities, or what sets them apart in the staffing industry..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[120px] resize-none"
            maxLength={1000}
          />
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">
              This will be displayed on their profile page
            </span>
            <span className={`${remainingChars < 50 ? 'text-orange-600' : remainingChars < 10 ? 'text-red-600' : 'text-muted-foreground'}`}>
              {remainingChars} characters remaining
            </span>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Tips for a compelling nomination</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Highlight specific achievements or innovations</li>
            <li>• Mention their impact on the industry or company</li>
            <li>• Include leadership qualities or mentorship</li>
            <li>• Describe what makes them unique in their field</li>
            <li>• Keep it professional and factual</li>
          </ul>
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={handleNext}>
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}