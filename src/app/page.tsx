"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Award, Vote } from "lucide-react";
import { StatsSection } from "@/components/home/StatsSection";
import { SimplePodium } from "@/components/home/SimplePodium";
import { AnimatedHero } from "@/components/animations/AnimatedHero";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { TimelineSection } from "@/components/home/TimelineSection";
import { useNominationStatus } from "@/hooks/useNominationStatus";



export default function HomePage() {
  const nominationStatus = useNominationStatus();
  
  // Prevent hydration mismatch
  const ctaTitle = nominationStatus.loading ? "Ready to Vote?" : (nominationStatus.enabled ? "Ready to Nominate?" : "Ready to Vote?");
  const ctaText = nominationStatus.loading ? "vote" : (nominationStatus.enabled ? "nomination" : "vote");
  const ctaButtonText = nominationStatus.loading ? "Start Voting" : (nominationStatus.enabled ? "Start Your Nomination" : "Start Voting");
  const ctaButtonHref = nominationStatus.loading ? "/directory" : (nominationStatus.enabled ? "/nominate" : "/directory");
  const showNominateIcon = !nominationStatus.loading && nominationStatus.enabled;
  
  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Hero Section */}
      <AnimatedHero />

      {/* Enhanced Stats Section */}
      <ScrollReveal>
        <section className="py-16 px-4 bg-slate-50">
          <div className="container mx-auto">
            <StatsSection />
          </div>
        </section>
      </ScrollReveal>

      {/* Enhanced Podium */}
      <SimplePodium />

      {/* Enhanced Categories Preview */}
      <CategoriesSection />

      {/* Enhanced Timeline */}
      <TimelineSection />

      {/* Enhanced CTA Section */}
      <ScrollReveal>
        <section className="py-20 px-4 bg-slate-50 relative overflow-hidden">
          <div className="container mx-auto text-center relative z-10">
            <h2 className="text-3xl font-bold mb-4 text-slate-900">
              {ctaTitle}
            </h2>
            <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
              Help us recognize the outstanding individuals and companies shaping the future of staffing.
              Your {ctaText} could make all the difference.
            </p>
            <Button asChild size="lg" className="px-8 bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
              <Link href={ctaButtonHref}>
                {showNominateIcon ? (
                  <Award className="mr-2 h-5 w-5 text-orange-400" />
                ) : (
                  <Vote className="mr-2 h-5 w-5 text-orange-400" />
                )}
                {ctaButtonText}
              </Link>
            </Button>
          </div>
          

        </section>
      </ScrollReveal>
    </div>
  );
}