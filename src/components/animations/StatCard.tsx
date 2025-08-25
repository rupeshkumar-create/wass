"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import CountUp from "react-countup";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  description: string;
  delay?: number;
}

export function StatCard({ icon: Icon, label, value, description, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="h-full"
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="p-6 text-center hover:shadow-lg transition-all duration-300 cursor-pointer border-2 border-slate-200 bg-white">
              <motion.div
                className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-xl mb-4"
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Icon className="h-6 w-6 text-slate-600" />
              </motion.div>
              
              <div className="text-3xl font-bold text-slate-900 mb-2">
                <CountUp 
                  end={value} 
                  duration={2} 
                  enableScrollSpy 
                  scrollSpyOnce 
                />
              </div>
              
              <div className="text-sm font-medium text-slate-600 uppercase tracking-wide">
                {label}
              </div>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </motion.div>
  );
}