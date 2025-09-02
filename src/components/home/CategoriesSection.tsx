"use client";

import { Users, Zap, Heart, TrendingUp, Globe, Star } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { CategoryCard } from "@/components/animations/CategoryCard";

const categories = [
  {
    title: "Role-Specific Excellence",
    description: "Recognizing outstanding individual contributors",
    icon: Users,
    gradient: "bg-slate-700",
    badges: ["Top Recruiter", "Top Executive Leader", "Rising Star (Under 30)", "Top Staffing Influencer"]
  },
  {
    title: "Innovation & Technology", 
    description: "Leading the future of staffing technology",
    icon: Zap,
    gradient: "bg-slate-700",
    badges: ["Top AI-Driven Staffing Platform", "Top Digital Experience for Clients"]
  },
  {
    title: "Culture & Impact",
    description: "Making a positive difference in the industry", 
    icon: Heart,
    gradient: "bg-slate-700",
    badges: ["Top Women-Led Staffing Firm", "Fastest Growing Staffing Firm"]
  },
  {
    title: "Growth & Performance",
    description: "Excellence in operations and thought leadership",
    icon: TrendingUp, 
    gradient: "bg-slate-700",
    badges: ["Best Staffing Process at Scale", "Thought Leadership & Influence"]
  },
  {
    title: "Geographic Excellence",
    description: "Regional and global recognition",
    icon: Globe,
    gradient: "bg-orange-500", 
    badges: ["Top Staffing Company - USA", "Top Staffing Company - Europe", "Top Global Recruiter"]
  },
  {
    title: "Special Recognition",
    description: "Unique contributions to the industry",
    icon: Star,
    gradient: "bg-slate-700",
    badges: ["Special Recognition"]
  }
];

export function CategoriesSection() {
  return (
    <ScrollReveal>
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-slate-900">Award Categories</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Recognizing excellence across multiple dimensions of the staffing industry
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <CategoryCard
                key={category.title}
                title={category.title}
                description={category.description}
                icon={category.icon}
                gradient={category.gradient}
                badges={category.badges}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
}