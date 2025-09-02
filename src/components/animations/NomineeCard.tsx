"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Eye, Vote, TrendingUp, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface NomineeCardProps {
  nominee: {
    id: string;
    name: string;
    category: string;
    votes: number;
    imageUrl?: string;
    liveUrl: string;
    country?: string;
    title?: string;
    type: "person" | "company";
  };
  leaderVotes?: number;
  isTrending?: boolean;
  delay?: number;
}

export function NomineeCard({ nominee, leaderVotes = 0, isTrending = false, delay = 0 }: NomineeCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const progressPercentage = leaderVotes > 0 ? (nominee.votes / leaderVotes) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="h-full"
    >
      <Card className="h-full hover:shadow-soft transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm group overflow-hidden relative">
        {/* Trending Badge */}
        {isTrending && (
          <motion.div
            className="absolute top-3 right-3 z-10"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="h-3 w-3 mr-1" />
              </motion.div>
              Trending
            </Badge>
          </motion.div>
        )}

        <CardContent className="p-6">
          {/* Avatar & Basic Info */}
          <div className="flex items-start gap-4 mb-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Avatar className="w-16 h-16 border-2 border-brand-200">
                <AvatarImage src={nominee.imageUrl} alt={nominee.name} />
                <AvatarFallback className="bg-brand-100 text-brand-700 font-semibold">
                  {nominee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            </motion.div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-ink-900 mb-1 truncate group-hover:text-brand-600 transition-colors duration-200">
                {nominee.name}
              </h3>
              {nominee.title && (
                <p className="text-sm text-ink-500 mb-2 line-clamp-2">
                  {nominee.title}
                </p>
              )}
              <Badge variant="secondary" className="text-xs">
                {nominee.category}
              </Badge>
            </div>
          </div>

          {/* Vote Count & Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1 text-brand-600">
                <TrendingUp className="h-4 w-4" />
                <span className="font-semibold">{nominee.votes}</span>
                <span className="text-xs text-ink-500">votes</span>
              </div>
              {nominee.country && (
                <span className="text-xs text-ink-500">{nominee.country}</span>
              )}
            </div>
            
            {leaderVotes > 0 && (
              <div className="space-y-1">
                <Progress value={progressPercentage} className="h-2" />
                <div className="text-xs text-ink-500 text-right">
                  {Math.round(progressPercentage)}% of leader
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <motion.div
              className="flex-1"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                asChild 
                variant="outline" 
                size="sm"
                className="w-full group/btn hover:bg-brand-50 hover:border-brand-300 transition-all duration-200"
              >
                <Link href={nominee.liveUrl}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Profile
                </Link>
              </Button>
            </motion.div>

            {/* Vote Button - appears on hover */}
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ 
                opacity: isHovered ? 1 : 0, 
                width: isHovered ? "auto" : 0 
              }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <Button 
                size="sm"
                className="bg-brand-500 hover:bg-brand-600 text-white whitespace-nowrap"
                onClick={() => {
                  // This would open a vote dialog
                  console.log("Vote for", nominee.name);
                }}
              >
                <Vote className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </CardContent>

        {/* Hover Glow Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-brand-500/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          initial={false}
        />
      </Card>
    </motion.div>
  );
}