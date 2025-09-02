"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Eye, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

interface PodiumNominee {
  id: string;
  name: string;
  category: string;
  votes: number;
  imageUrl?: string;
  liveUrl: string;
}

interface PodiumProps {
  nominees: PodiumNominee[];
}

const medalColors = {
  1: "bg-yellow-500", // Gold
  2: "bg-slate-400",  // Silver
  3: "bg-orange-500", // Bronze
};

export function Podium({ nominees }: PodiumProps) {
  const [animatedVotes, setAnimatedVotes] = useState<Record<string, number>>({});

  // Initialize animated votes
  useEffect(() => {
    const initial: Record<string, number> = {};
    nominees.forEach(nominee => {
      initial[nominee.id] = nominee.votes;
    });
    setAnimatedVotes(initial);
  }, [nominees]);

  const updateVoteCount = (nomineeId: string, newCount: number) => {
    setAnimatedVotes(prev => ({
      ...prev,
      [nomineeId]: newCount
    }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      {nominees.slice(0, 3).map((nominee, index) => {
        const rank = index + 1;
        const isFirst = rank === 1;
        
        return (
          <motion.div
            key={nominee.id}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ 
              duration: 0.8, 
              delay: index * 0.2,
              type: "spring",
              stiffness: 100
            }}
            className={`${isFirst ? 'md:order-2' : rank === 2 ? 'md:order-1' : 'md:order-3'}`}
          >
            <Card className={`relative p-6 text-center hover:shadow-soft transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm ${isFirst ? 'md:scale-105' : ''}`}>
              {/* Medal */}
              <motion.div
                className={`absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full ${medalColors[rank as keyof typeof medalColors]} flex items-center justify-center text-white font-bold text-sm shadow-lg`}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                whileHover={{ 
                  scale: 1.1,
                  boxShadow: "0 0 20px rgba(255, 106, 0, 0.3)"
                }}
              >
                {rank}
              </motion.div>

              {/* Avatar */}
              <div className="mb-4">
                <Avatar className="w-16 h-16 mx-auto border-2 border-brand-200">
                  <AvatarImage src={nominee.imageUrl} alt={nominee.name} />
                  <AvatarFallback className="bg-brand-100 text-brand-700 font-semibold">
                    {nominee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Name & Category */}
              <h3 className="font-semibold text-ink-900 mb-2">{nominee.name}</h3>
              <Badge variant="secondary" className="mb-4 text-xs">
                {nominee.category}
              </Badge>

              {/* Vote Count */}
              <motion.div 
                className="mb-4"
                key={animatedVotes[nominee.id]} // Re-animate when count changes
              >
                <motion.div
                  className="text-2xl font-bold text-brand-600 flex items-center justify-center gap-1"
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ duration: 0.3 }}
                >
                  <TrendingUp className="h-4 w-4" />
                  {animatedVotes[nominee.id] || nominee.votes}
                </motion.div>
                <div className="text-xs text-ink-500">votes</div>
              </motion.div>

              {/* View Profile Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  asChild 
                  variant="outline" 
                  size="sm"
                  className="w-full group hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-all duration-200"
                >
                  <Link href={nominee.liveUrl}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Profile
                    <motion.div
                      className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      initial={{ scale: 0 }}
                      whileHover={{ scale: 1 }}
                    >
                      <div className="w-2 h-2 bg-brand-500 rounded-full" />
                    </motion.div>
                  </Link>
                </Button>
              </motion.div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}