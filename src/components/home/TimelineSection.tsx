"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { Timeline } from "@/components/animations/Timeline";

const timelineEvents = [
  { date: "August 12, 2025", title: "Nominations Open", description: "Submit your nominations", status: "completed" as const },
  { date: "September 14, 2025", title: "Nominations Close", description: "Final day for submissions", status: "completed" as const },
  { date: "September 15, 2025", title: "Public Voting Opens", description: "Community voting begins", status: "current" as const },
  { date: "January 15, 2026", title: "Voting Closes", description: "Final votes counted", status: "upcoming" as const },
  { date: "January 30, 2026", title: "Awards Ceremony", description: "Winners announced", status: "upcoming" as const },
];

export function TimelineSection() {
  return (
    <ScrollReveal>
      <section className="py-8 px-4 bg-white">
        <div className="container mx-auto">
          <Timeline events={timelineEvents} />
        </div>
      </section>
    </ScrollReveal>
  );
}