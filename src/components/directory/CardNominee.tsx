"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Vote } from "lucide-react";
import { NominationWithVotes } from "@/lib/types";
import { getNomineeImage } from "@/lib/nominee-image";

interface CardNomineeProps {
  nomination: NominationWithVotes;
}

export function CardNominee({ nomination }: CardNomineeProps) {
  const isPersonNomination = nomination.type === "person";
  const nomineeData = nomination.nominee;
  
  // Add safety check for nomination data
  if (!nomination || !nomineeData) {
    console.warn('CardNominee: Invalid nomination data', nomination);
    return null;
  }
  
  // Get display name without mutating the original object
  const displayName = nomineeData.name || nomination.displayName || nomination.name || 'Unknown';
  
  const imageData = getNomineeImage(nomination);
  
  // Debug logging for image issues
  if (process.env.NODE_ENV === 'development') {
    console.log('CardNominee image debug:', {
      name: displayName,
      type: nomination.type,
      imageUrl: nomination.imageUrl,
      nomineeImageUrl: nomineeData.imageUrl,
      headshotUrl: nomineeData.headshotUrl,
      logoUrl: nomineeData.logoUrl,
      finalImageData: imageData
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 border-gray-200 bg-white text-gray-900 group overflow-hidden relative">
        {/* Hover Border Effect */}
        <motion.div
          className="absolute inset-0 border-2 border-blue-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"
        />
        
        <CardContent className="p-4 relative z-10">
          <div className="text-center space-y-3">
            {/* Photo - Square Shape */}
            <div className="flex justify-center mb-3">
              <motion.div 
                className="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 group-hover:border-blue-300 transition-colors duration-300"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                {imageData.isInitials ? (
                  <img 
                    src={imageData.src}
                    alt={imageData.alt}
                    loading="lazy"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image 
                    src={imageData.src}
                    alt={imageData.alt}
                    width={64}
                    height={64}
                    className={`w-full h-full ${isPersonNomination ? "object-cover" : "object-contain bg-white p-1"}`}
                    unoptimized={imageData.src.startsWith('data:')}
                  />
                )}
              </motion.div>
            </div>

            {/* Name */}
            <div className="mb-2">
              <h3 className="font-semibold text-sm text-gray-900 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2 leading-tight">
                {displayName}
              </h3>
            </div>

            {/* Subcategory */}
            <div className="flex justify-center mb-3">
              <Badge 
                variant="outline" 
                className="text-xs border-gray-300 text-gray-600 group-hover:border-blue-300 group-hover:text-blue-700 transition-colors duration-200 px-2 py-1"
              >
                {nomination.category}
              </Badge>
            </div>

            {/* Vote Count */}
            <div className="flex items-center justify-center gap-1 mb-3">
              <Vote className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">{nomination.votes} votes</span>
            </div>

            {/* View Button */}
            <div className="mt-4">
              <Button 
                asChild 
                size="sm" 
                className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 text-xs rounded-md h-8 font-medium"
              >
                <Link href={`/nominee/${nomination.id}`}>
                  View
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}