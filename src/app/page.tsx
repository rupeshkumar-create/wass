import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Award } from "lucide-react";
import { StatsSection } from "@/components/home/StatsSection";
import { PublicPodium } from "@/components/home/PublicPodium";
import { AnimatedHero } from "@/components/animations/AnimatedHero";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { TimelineSection } from "@/components/home/TimelineSection";



export default function HomePage() {
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
      <ScrollReveal>
        <PublicPodium />
      </ScrollReveal>

      {/* Enhanced Categories Preview */}
      <CategoriesSection />

      {/* Enhanced Timeline */}
      <TimelineSection />

      {/* Enhanced CTA Section */}
      <ScrollReveal>
        <section className="py-20 px-4 bg-slate-50 relative overflow-hidden">
          <div className="container mx-auto text-center relative z-10">
            <h2 className="text-3xl font-bold mb-4 text-slate-900">Ready to Nominate?</h2>
            <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
              Help us recognize the outstanding individuals and companies shaping the future of staffing.
              Your nomination could make all the difference.
            </p>
            <Button asChild size="lg" className="px-8 bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
              <Link href="/nominate">
                <Award className="mr-2 h-5 w-5 text-orange-400" />
                Start Your Nomination
              </Link>
            </Button>
          </div>
          

        </section>
      </ScrollReveal>
    </div>
  );
}