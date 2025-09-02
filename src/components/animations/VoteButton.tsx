"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Vote, X } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

interface VoteButtonProps {
  showAfterScroll?: number;
  nominee?: {
    id: string;
    name: string;
    liveUrl: string;
  };
}

export function VoteButton({ showAfterScroll = 600, nominee }: VoteButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > showAfterScroll;
      setIsVisible(scrolled && !isDismissed);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showAfterScroll, isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <motion.div
            className="relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Dismiss Button */}
            <button
              onClick={handleDismiss}
              className="absolute -top-2 -right-2 w-6 h-6 bg-gray-600 hover:bg-gray-700 text-white rounded-full flex items-center justify-center text-xs transition-colors duration-200 z-10"
            >
              <X className="h-3 w-3" />
            </button>

            {/* Main Button */}
            <Button
              asChild
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full px-6 py-3"
            >
              <Link href={nominee?.liveUrl || "/directory"}>
                <Vote className="mr-2 h-5 w-5" />
                {nominee ? `Vote for ${nominee.name}` : "Vote Now"}
              </Link>
            </Button>

            {/* Pulse Animation */}
            <motion.div
              className="absolute inset-0 bg-orange-500 rounded-full -z-10"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 0, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}