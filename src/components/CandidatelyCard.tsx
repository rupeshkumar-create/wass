"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export function CandidatelyCard() {
  return (
    <Card className="bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 text-white border-0 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button 
              size="sm" 
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-4 py-2 text-sm font-medium"
            >
              TRY IT OUT FOR FREE
            </Button>
          </div>
          
          {/* Main Content */}
          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold leading-tight">
              <span className="text-white">AI-POWERED</span>
              <br />
              <span className="bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
                RESUME BUILDER
              </span>
              <span className="text-lg md:text-xl font-normal italic ml-2">
                for Recruiters
              </span>
            </h2>
            
            <div className="space-y-2 text-sm md:text-base">
              <p>Turn resumes into AI-enhanced profiles.</p>
              <p>Easily edit, anonymize, brand, and share with your clients.</p>
            </div>
          </div>
          
          {/* CTA Button */}
          <div className="pt-2">
            <Button 
              asChild
              className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
            >
              <a 
                href="https://www.candidately.com/ai-resume-builder" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                Get Started
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}