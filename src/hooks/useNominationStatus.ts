"use client";

import { useState, useEffect } from 'react';

interface NominationStatus {
  enabled: boolean;
  closeMessage: string;
  loading: boolean;
  error: string | null;
}

export function useNominationStatus(): NominationStatus {
  const [status, setStatus] = useState<NominationStatus>({
    enabled: true, // Default to enabled
    closeMessage: 'Thank you for your interest! Nominations are now closed.',
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/settings', {
          cache: 'no-store'
        });
        
        if (response.ok) {
          const result = await response.json();
          setStatus({
            enabled: result.nominations_enabled || false,
            closeMessage: result.nominations_close_message || 'Thank you for your interest! Nominations are now closed.',
            loading: false,
            error: null
          });
        } else {
          throw new Error('Failed to fetch nomination status');
        }
      } catch (error) {
        console.error('Error fetching nomination status:', error);
        setStatus(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch status'
        }));
      }
    };

    fetchStatus();
  }, []);

  return status;
}