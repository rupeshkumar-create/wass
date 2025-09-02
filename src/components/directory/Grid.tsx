"use client";

import { NominationWithVotes } from "@/lib/types";
import { CardNominee } from "./CardNominee";
import { CATEGORIES } from "@/lib/constants";

interface GridProps {
  nominations: NominationWithVotes[];
}

export function Grid({ nominations }: GridProps) {
  // Safety check for nominations array
  if (!nominations || !Array.isArray(nominations) || nominations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No nominees found matching your criteria.</p>
      </div>
    );
  }

  // Group nominations by category group
  const groupedNominations = nominations.reduce((acc, nomination) => {
    // Add safety check for nomination and category
    if (!nomination || !nomination.category) {
      console.warn('Invalid nomination:', nomination);
      return acc;
    }
    
    const categoryConfig = CATEGORIES.find(c => c.id === nomination.category);
    const group = categoryConfig?.group || "Other";
    

    
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(nomination);
    return acc;
  }, {} as Record<string, NominationWithVotes[]>);

  return (
    <div className="space-y-16">
      {Object.entries(groupedNominations).map(([group, groupNominations]) => (
        <div key={group}>
          <h2 className="text-2xl font-bold mb-8 text-primary">{group}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {groupNominations.map((nomination) => (
              <CardNominee
                key={nomination.id}
                nomination={nomination}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}