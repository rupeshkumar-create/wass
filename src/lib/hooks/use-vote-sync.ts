/**
 * Hook for handling vote submission with real-time data sync
 */

import { useState } from 'react';
import { triggerVoteDataRefresh } from '@/lib/utils/data-sync';

interface VoteData {
  subcategoryId: string;
  votedForDisplayName: string;
  email: string;
  firstname: string;
  lastname: string;
  linkedin: string;
  company?: string;
  jobTitle?: string;
  country?: string;
}

interface VoteResult {
  success: boolean;
  error?: string;
  voteId?: string;
  newVoteCount?: number;
}

export function useVoteSync() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitVote = async (voteData: VoteData): Promise<VoteResult> => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(voteData),
      });

      const result = await response.json();

      if (response.ok && result.ok) {
        // Trigger real-time data sync across all components
        triggerVoteDataRefresh();
        
        return {
          success: true,
          voteId: result.voteId,
          newVoteCount: result.newVoteCount
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to submit vote'
        };
      }
    } catch (error) {
      console.error('Vote submission error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitVote,
    isSubmitting
  };
}