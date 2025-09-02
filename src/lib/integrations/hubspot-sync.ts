"use client";

import { Nomination, Vote } from '../data-types';
import { getCategoryGroupById } from '../categories';

/**
 * Client-side utilities for triggering HubSpot sync
 */

/**
 * Sync vote to HubSpot immediately after local vote
 */
export async function syncVoteToHubSpot(vote: Vote, nominee: Nomination): Promise<void> {
  if (typeof window === 'undefined') return; // Server-side guard

  try {
    const categoryGroup = getCategoryGroupById(
      nominee.category.split('-')[0] // Extract group from category ID
    );

    const response = await fetch('/api/sync/hubspot/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        voter: {
          email: vote.voter.email,
          firstName: vote.voter.firstName,
          lastName: vote.voter.lastName,
          company: vote.voter.company,
          linkedin: vote.voter.linkedin,
        },
        nominee: {
          id: nominee.id,
          name: nominee.nominee.name,
          type: nominee.type,
          linkedin: nominee.nominee.linkedin,
          email: nominee.type === 'person' ? (nominee.nominee as any).email : undefined,
        },
        category: nominee.category,
        subcategoryId: nominee.category,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to sync vote to HubSpot:', error);
      // Don't throw - we don't want to break the voting flow
    } else {
      console.log('Vote synced to HubSpot successfully');
    }
  } catch (error) {
    console.error('Error syncing vote to HubSpot:', error);
    // Don't throw - we don't want to break the voting flow
  }
}

/**
 * Sync nomination submission to HubSpot
 */
export async function syncNominationSubmitToHubSpot(nomination: Nomination): Promise<void> {
  if (typeof window === 'undefined') return; // Server-side guard

  try {
    const categoryGroup = getCategoryGroupById(
      nomination.category.split('-')[0] // Extract group from category ID
    );

    const nomineeData = {
      name: nomination.nominee.name,
      type: nomination.type,
      linkedin: nomination.nominee.linkedin,
      whyVoteForMe: nomination.whyVoteForMe,
      ...(nomination.type === 'person' && {
        email: (nomination.nominee as any).email,
        firstName: (nomination.nominee as any).firstName,
        lastName: (nomination.nominee as any).lastName,
        title: (nomination.nominee as any).title,
      }),
      ...(nomination.type === 'company' && {
        website: (nomination.nominee as any).website,
      }),
    };

    const response = await fetch('/api/sync/hubspot/nomination-submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nominator: {
          email: nomination.nominator.email,
          name: nomination.nominator.name,
          company: nomination.nominator.company,
          linkedin: nomination.nominator.linkedin,
        },
        nominee: nomineeData,
        category: nomination.category,
        categoryGroupId: categoryGroup?.id || 'unknown',
        subcategoryId: nomination.category,
        whyNominated: (nomination as any).whyNominated || '',
        imageUrl: nomination.imageUrl,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to sync nomination submit to HubSpot:', error);
      // Don't throw - we don't want to break the nomination flow
    } else {
      console.log('Nomination submit synced to HubSpot successfully');
    }
  } catch (error) {
    console.error('Error syncing nomination submit to HubSpot:', error);
    // Don't throw - we don't want to break the nomination flow
  }
}

/**
 * Sync nomination approval to HubSpot
 */
export async function syncNominationApproveToHubSpot(nomination: Nomination): Promise<void> {
  if (typeof window === 'undefined') return; // Server-side guard

  try {
    const categoryGroup = getCategoryGroupById(
      nomination.category.split('-')[0] // Extract group from category ID
    );

    const response = await fetch('/api/sync/hubspot/nomination-approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nominee: {
          id: nomination.id,
          name: nomination.nominee.name,
          type: nomination.type,
          linkedin: nomination.nominee.linkedin,
          email: nomination.type === 'person' ? (nomination.nominee as any).email : undefined,
        },
        nominator: {
          email: nomination.nominator.email,
        },
        liveUrl: `${window.location.origin}${nomination.liveUrl.startsWith('/') ? nomination.liveUrl : `/nominee/${nomination.liveUrl}`}`,
        categoryGroupId: categoryGroup?.id || 'unknown',
        subcategoryId: nomination.category,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to sync nomination approve to HubSpot:', error);
      // Don't throw - we don't want to break the approval flow
    } else {
      console.log('Nomination approve synced to HubSpot successfully');
    }
  } catch (error) {
    console.error('Error syncing nomination approve to HubSpot:', error);
    // Don't throw - we don't want to break the approval flow
  }
}

/**
 * Test HubSpot connection
 */
export async function testHubSpotConnection(): Promise<{
  success: boolean;
  accountId?: string;
  error?: string;
}> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Not available on server side' };
  }

  try {
    const response = await fetch('/api/sync/hubspot/test');
    const result = await response.json();
    
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Enhanced data layer hooks that include HubSpot sync
 */

/**
 * Hook to create vote with HubSpot sync
 */
export function useVoteWithSync() {
  return {
    async createVote(voteData: any, nomination: Nomination) {
      // First, create the vote locally
      // This would typically use your existing vote creation logic
      
      // Then sync to HubSpot in the background
      const vote = voteData as Vote; // Type assertion for demo
      await syncVoteToHubSpot(vote, nomination);
      
      return vote;
    },
  };
}

/**
 * Hook to create nomination with HubSpot sync
 */
export function useNominationWithSync() {
  return {
    async createNomination(nominationData: any) {
      // First, create the nomination locally
      // This would typically use your existing nomination creation logic
      
      const nomination = nominationData as Nomination; // Type assertion for demo
      
      // Then sync to HubSpot in the background
      await syncNominationSubmitToHubSpot(nomination);
      
      return nomination;
    },

    async approveNomination(nomination: Nomination) {
      // First, approve the nomination locally
      // This would typically use your existing approval logic
      
      // Then sync to HubSpot in the background
      await syncNominationApproveToHubSpot(nomination);
      
      return nomination;
    },
  };
}

/**
 * Utility to check if HubSpot sync is enabled
 */
export function isHubSpotSyncEnabled(): boolean {
  // This would check environment variables or app settings
  // For now, we'll assume it's enabled if we're in the browser
  return typeof window !== 'undefined';
}