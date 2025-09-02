"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface CategoryCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  badges: string[];
  delay?: number;
}

export function CategoryCard({ 
  title, 
  description, 
  icon: Icon, 
  gradient, 
  badges, 
  delay = 0 
}: CategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 border-slate-200 bg-white group overflow-hidden relative">
        {/* Hover Border Effect */}
        <motion.div
          className="absolute inset-0 border-2 border-orange-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"
        />
        
        <div className="relative z-10">
          <CardHeader>
            <motion.div
              className={`inline-flex items-center justify-center w-14 h-14 rounded-xl shadow-lg ${gradient} mb-4 relative overflow-hidden`}
              whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
              transition={{ duration: 0.5 }}
            >
              {/* Icon with better visibility */}
              <div className="absolute inset-0 bg-white/20 rounded-xl" />
              <Icon className="h-7 w-7 text-white relative z-10 stroke-[2.5] drop-shadow-lg filter contrast-125" />
            </motion.div>
            
            <CardTitle className="text-lg text-slate-900 group-hover:text-orange-600 transition-colors duration-200">
              {title}
            </CardTitle>
            <CardDescription className="text-slate-600">
              {description}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {badges.map((badge, index) => (
                <motion.div
                  key={badge}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: delay + (index * 0.05) }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Link href={`/directory?category=${encodeURIComponent(badge)}`}>
                    <Badge 
                      variant="outline" 
                      className="cursor-pointer hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-all duration-200"
                    >
                      {badge}
                    </Badge>
                  </Link>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
}