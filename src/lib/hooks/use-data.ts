"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  Nomination, 
  Vote, 
  PersonNominationInput, 
  CompanyNominationInput, 
  VoteInput,
  NominationStatus,
  NominationType 
} from '../data-types';
import { dataLayer } from '../db/data-layer';

// Custom hook for nominations
export function useNominations(filters?: {
  category?: string;
  status?: NominationStatus;
  type?: NominationType;
}) {
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNominations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let result: Nomination[];

      if (filters?.category) {
        result = await dataLayer.getNominationsByCategory(filters.category);
      } else if (filters?.status) {
        result = await dataLayer.getNominationsByStatus(filters.status);
      } else if (filters?.type) {
        result = await dataLayer.getNominationsByType(filters.type);
      } else {
        result = await dataLayer.getAllNominations();
      }

      // Apply additional filters
      if (filters?.status && !filters.category) {
        result = result.filter(n => n.status === filters.status);
      }
      if (filters?.type && !filters.category) {
        result = result.filter(n => n.type === filters.type);
      }

      setNominations(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch nominations');
    } finally {
      setLoading(false);
    }
  }, [filters?.category, filters?.status, filters?.type]);

  useEffect(() => {
    fetchNominations();
  }, [fetchNominations]);

  const createNomination = useCallback(async (input: PersonNominationInput | CompanyNominationInput) => {
    try {
      const nomination = await dataLayer.createNomination(input);
      await fetchNominations(); // Refresh list
      return nomination;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create nomination');
    }
  }, [fetchNominations]);

  const updateNomination = useCallback(async (id: string, updates: Partial<Nomination>) => {
    try {
      const nomination = await dataLayer.updateNomination(id, updates);
      await fetchNominations(); // Refresh list
      return nomination;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update nomination');
    }
  }, [fetchNominations]);

  const deleteNomination = useCallback(async (id: string) => {
    try {
      await dataLayer.deleteNomination(id);
      await fetchNominations(); // Refresh list
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete nomination');
    }
  }, [fetchNominations]);

  return {
    nominations,
    loading,
    error,
    refresh: fetchNominations,
    createNomination,
    updateNomination,
    deleteNomination,
  };
}

// Custom hook for a single nomination
export function useNomination(id: string | null) {
  const [nomination, setNomination] = useState<Nomination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNomination = useCallback(async () => {
    if (!id) {
      setNomination(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await dataLayer.getNominationById(id);
      setNomination(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch nomination');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchNomination();
  }, [fetchNomination]);

  return {
    nomination,
    loading,
    error,
    refresh: fetchNomination,
  };
}

// Custom hook for votes
export function useVotes(filters?: {
  nomineeId?: string;
  category?: string;
  voterEmail?: string;
}) {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let result: Vote[];

      if (filters?.nomineeId) {
        result = await dataLayer.getVotesByNominee(filters.nomineeId);
      } else if (filters?.category) {
        result = await dataLayer.getVotesByCategory(filters.category);
      } else if (filters?.voterEmail) {
        result = await dataLayer.getVotesByVoterEmail(filters.voterEmail);
      } else {
        result = await dataLayer.getAllVotes();
      }

      setVotes(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch votes');
    } finally {
      setLoading(false);
    }
  }, [filters?.nomineeId, filters?.category, filters?.voterEmail]);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  const createVote = useCallback(async (input: VoteInput) => {
    try {
      const vote = await dataLayer.createVote(input);
      await fetchVotes(); // Refresh list
      return vote;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create vote');
    }
  }, [fetchVotes]);

  const deleteVote = useCallback(async (id: string) => {
    try {
      await dataLayer.deleteVote(id);
      await fetchVotes(); // Refresh list
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete vote');
    }
  }, [fetchVotes]);

  return {
    votes,
    loading,
    error,
    refresh: fetchVotes,
    createVote,
    deleteVote,
  };
}

// Custom hook for vote counts
export function useVoteCount(nomineeId: string | null) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCount = useCallback(async () => {
    if (!nomineeId) {
      setCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const votes = await dataLayer.getVotesByNominee(nomineeId);
      setCount(votes.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vote count');
    } finally {
      setLoading(false);
    }
  }, [nomineeId]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  return {
    count,
    loading,
    error,
    refresh: fetchCount,
  };
}

// Custom hook for statistics
export function useStats() {
  const [stats, setStats] = useState<{
    totalNominations: number;
    totalVotes: number;
    nominationsByStatus: Record<NominationStatus, number>;
    nominationsByType: Record<NominationType, number>;
    topCategories: Array<{ category: string; count: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await dataLayer.getStats();
      setStats(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  };
}

// Custom hook for checking if user has voted in a category
export function useHasVoted(voterEmail: string | null, category: string | null) {
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkVoted = useCallback(async () => {
    if (!voterEmail || !category) {
      setHasVoted(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const votes = await dataLayer.getVotesByVoterEmail(voterEmail);
      const voted = votes.some(v => v.category === category);
      setHasVoted(voted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check vote status');
    } finally {
      setLoading(false);
    }
  }, [voterEmail, category]);

  useEffect(() => {
    checkVoted();
  }, [checkVoted]);

  return {
    hasVoted,
    loading,
    error,
    refresh: checkVoted,
  };
}

// Custom hook for metadata
export function useMetadata(key: string) {
  const [value, setValue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await dataLayer.getMetadata(key);
      setValue(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metadata');
    } finally {
      setLoading(false);
    }
  }, [key]);

  const updateMetadata = useCallback(async (newValue: any) => {
    try {
      await dataLayer.setMetadata(key, newValue);
      setValue(newValue);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update metadata');
    }
  }, [key]);

  const deleteMetadata = useCallback(async () => {
    try {
      await dataLayer.deleteMetadata(key);
      setValue(null);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete metadata');
    }
  }, [key]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  return {
    value,
    loading,
    error,
    refresh: fetchMetadata,
    update: updateMetadata,
    delete: deleteMetadata,
  };
}