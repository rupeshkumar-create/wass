"use client";

import { useEffect, useState } from "react";

interface UseRealtimeVotesOptions {
    nomineeId?: string;
    category?: string;
    onVoteUpdate?: (data: any) => void;
    pollInterval?: number;
}

export function useRealtimeVotes({
    nomineeId,
    category,
    onVoteUpdate,
    pollInterval = 5000 // Poll every 5 seconds by default
}: UseRealtimeVotesOptions = {}) {
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!onVoteUpdate) return;

        // Poll for vote updates
        const id = setInterval(async () => {
            try {
                if (nomineeId) {
                    const url = `/api/votes/count?nominationId=${nomineeId}`;
                    const response = await fetch(url);
                    if (response.ok) {
                        const data = await response.json();
                        onVoteUpdate(data);
                    }
                }
            } catch (error) {
                console.error('Error polling for vote updates:', error);
            }
        }, pollInterval);

        setIntervalId(id);

        return () => {
            if (id) {
                clearInterval(id);
            }
        };
    }, [nomineeId, category, onVoteUpdate, pollInterval]);

    const unsubscribe = () => {
        if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(null);
        }
    };

    return { unsubscribe };
}