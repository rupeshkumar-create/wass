"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Step1WelcomeProps {
  onNext: () => void;
}

export function Step1Welcome({ onNext }: Step1WelcomeProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold">World Staffing Awards 2026</CardTitle>
        <CardDescription className="text-lg mt-4">
          Nominate outstanding individuals and companies in the staffing industry
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Help us recognize excellence in staffing by nominating deserving candidates across various categories.
            Your nominations will be reviewed and approved before appearing in the public directory.
          </p>
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">What you'll need (all fields are mandatory):</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Your business email address</li>
              <li>• Your LinkedIn profile</li>
              <li>• Nominee's LinkedIn profile</li>
              <li>• Professional headshot or company logo</li>
              <li>• Complete nominee information (name, title, country)</li>
              <li>• Detailed explanation of why they deserve to win</li>
            </ul>
          </div>
        </div>
        <div className="flex justify-center">
          <Button onClick={onNext} size="lg" className="px-8">
            Start Nomination
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}