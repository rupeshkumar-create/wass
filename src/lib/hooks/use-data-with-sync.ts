"use client";

import { useCallback } from 'react';
import { 
  useNominations as useBaseNominations,
  useVotes as useBaseVotes,
  useNomination as useBaseNomination
} from './use-data';
import { 
  syncVoteToHubSpot,
  syncNominationSubmitToHubSpot,
  syncNominationApproveToHubSpot
} from '../integrations/hubspot-sync';
import { 
  PersonNominationInput, 
  CompanyNominationInput, 
  VoteInput,
  Nomination,
  Vote
} from '../data-types';

/**
 * Enhanced data hooks that include automatic HubSpot sync
 */

/**
 * Enhanced nominations hook with HubSpot sync
 */
export function useNominationsWithSync(filters?: {
  category?: string;
  status?: 'pending' | 'approved' | 'rejected';
  type?: 'person' | 'company';
}) {
  const baseHook = useBaseNominations(filters);

  const createNominationWithSync = useCallback(async (input: PersonNominationInput | CompanyNominationInput) => {
    try {
      // First, create nomination locally
      const nomination = await baseHook.createNomination(input);
      
      // Then sync to HubSpot in the background (don't await to avoid blocking)
      syncNominationSubmitToHubSpot(nomination).catch(error => {
        console.error('Background HubSpot sync failed for nomination submit:', error);
      });

      return nomination;
    } catch (error) {
      console.error('Failed to create nomination:', error);
      throw error;
    }
  }, [baseHook]);

  const updateNominationWithSync = useCallback(async (id: string, updates: Partial<Nomination>) => {
    try {
      // First, update nomination locally
      const nomination = await baseHook.updateNomination(id, updates);
      
      // If status changed to approved, sync to HubSpot
      if (updates.status === 'approved') {
        syncNominationApproveToHubSpot(nomination).catch(error => {
          console.error('Background HubSpot sync failed for nomination approve:', error);
        });
      }

      return nomination;
    } catch (error) {
      console.error('Failed to update nomination:', error);
      throw error;
    }
  }, [baseHook]);

  return {
    ...baseHook,
    createNomination: createNominationWithSync,
    updateNomination: updateNominationWithSync,
  };
}

/**
 * Enhanced votes hook with HubSpot sync
 */
export function useVotesWithSync(filters?: {
  nomineeId?: string;
  category?: string;
  voterEmail?: string;
}) {
  const baseHook = useBaseVotes(filters);

  const createVoteWithSync = useCallback(async (input: VoteInput, nomination: Nomination) => {
    try {
      // First, create vote locally
      const vote = await baseHook.createVote(input);
      
      // Then sync to HubSpot in the background (don't await to avoid blocking)
      syncVoteToHubSpot(vote, nomination).catch(error => {
        console.error('Background HubSpot sync failed for vote:', error);
      });

      return vote;
    } catch (error) {
      console.error('Failed to create vote:', error);
      throw error;
    }
  }, [baseHook]);

  return {
    ...baseHook,
    createVote: createVoteWithSync,
  };
}

/**
 * Enhanced single nomination hook with sync capabilities
 */
export function useNominationWithSync(id: string | null) {
  const baseHook = useBaseNomination(id);

  const approveWithSync = useCallback(async () => {
    if (!baseHook.nomination) return null;

    try {
      // Update status to approved locally first
      const updatedNomination = { ...baseHook.nomination, status: 'approved' as const };
      
      // Sync to HubSpot in the background
      syncNominationApproveToHubSpot(updatedNomination).catch(error => {
        console.error('Background HubSpot sync failed for nomination approve:', error);
      });

      // Refresh local data
      await baseHook.refresh();

      return updatedNomination;
    } catch (error) {
      console.error('Failed to approve nomination:', error);
      throw error;
    }
  }, [baseHook]);

  return {
    ...baseHook,
    approveWithSync,
  };
}

/**
 * Utility hook for HubSpot sync status
 */
export function useHubSpotSync() {
  const testConnection = useCallback(async () => {
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
  }, []);

  const syncVote = useCallback(async (vote: Vote, nomination: Nomination) => {
    return await syncVoteToHubSpot(vote, nomination);
  }, []);

  const syncNominationSubmit = useCallback(async (nomination: Nomination) => {
    return await syncNominationSubmitToHubSpot(nomination);
  }, []);

  const syncNominationApprove = useCallback(async (nomination: Nomination) => {
    return await syncNominationApproveToHubSpot(nomination);
  }, []);

  return {
    testConnection,
    syncVote,
    syncNominationSubmit,
    syncNominationApprove,
  };
}

/**
 * Hook for batch sync operations
 */
export function useBatchSync() {
  const syncAllPendingNominations = useCallback(async (nominations: Nomination[]) => {
    const pendingNominations = nominations.filter(n => n.status === 'pending');
    
    console.log(`Starting batch sync for ${pendingNominations.length} pending nominations`);
    
    const results = await Promise.allSettled(
      pendingNominations.map(nomination => 
        syncNominationSubmitToHubSpot(nomination)
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Batch sync completed: ${successful} successful, ${failed} failed`);

    return { successful, failed, total: pendingNominations.length };
  }, []);

  const syncAllApprovedNominations = useCallback(async (nominations: Nomination[]) => {
    const approvedNominations = nominations.filter(n => n.status === 'approved');
    
    console.log(`Starting batch sync for ${approvedNominations.length} approved nominations`);
    
    const results = await Promise.allSettled(
      approvedNominations.map(nomination => 
        syncNominationApproveToHubSpot(nomination)
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Batch sync completed: ${successful} successful, ${failed} failed`);

    return { successful, failed, total: approvedNominations.length };
  }, []);

  return {
    syncAllPendingNominations,
    syncAllApprovedNominations,
  };
}