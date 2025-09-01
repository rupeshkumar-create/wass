"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight, Award, Users, Vote } from "lucide-react";
import Link from "next/link";
import { useNominationStatus } from "@/hooks/useNominationStatus";

export function AnimatedHero() {
  const nominationStatus = useNominationStatus();
  
  // Prevent hydration mismatch
  const buttonText = nominationStatus.loading ? "Vote Now" : (nominationStatus.enabled ? "Submit Nomination" : "Vote Now");
  const buttonHref = nominationStatus.loading ? "/directory" : (nominationStatus.enabled ? "/nominate" : "/directory");
  const showNominateIcon = !nominationStatus.loading && nominationStatus.enabled;
  
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-white">
      {/* Clean Background */}
      <div className="absolute inset-0 bg-white" />
      
      {/* Content */}
      <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
        {/* Animated Headline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <motion.h1 
            className="text-5xl md:text-7xl font-bold text-slate-900 mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            World Staffing Awards{" "}
            <motion.span
              className="text-orange-500 relative inline-block"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              2026
            </motion.span>
          </motion.h1>
          
          <motion.p
            className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Celebrating excellence in staffing and recruitment worldwide
          </motion.p>
        </motion.div>

        {/* Animated CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center relative z-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              asChild 
              size="lg" 
              className="bg-slate-800 hover:bg-slate-900 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group relative z-30"
            >
              <Link href={buttonHref} className="flex items-center">
                {showNominateIcon ? (
                  <Award className="mr-2 h-5 w-5 flex-shrink-0 text-orange-400" />
                ) : (
                  <Vote className="mr-2 h-5 w-5 flex-shrink-0 text-orange-400" />
                )}
                <span className="font-semibold">
                  {buttonText}
                </span>
                <motion.div
                  className="ml-2 flex-shrink-0"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ChevronRight className="h-5 w-5" />
                </motion.div>
              </Link>
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              asChild 
              variant="outline" 
              size="lg"
              className="border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-800 px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group relative z-30"
            >
              <Link href="/directory" className="flex items-center">
                <Users className="mr-2 h-5 w-5 flex-shrink-0" />
                <span className="font-semibold">View Nominees</span>
                <motion.div
                  className="ml-2 group-hover:translate-x-1 transition-transform duration-200 flex-shrink-0"
                >
                  <ChevronRight className="h-5 w-5" />
                </motion.div>
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>


    </section>
  );
}