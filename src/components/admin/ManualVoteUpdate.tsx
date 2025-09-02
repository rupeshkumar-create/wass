"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminNomination {
  id: string;
  displayName: string;
  votes: number;
  additionalVotes?: number;
  totalVotes?: number;
}

interface ManualVoteUpdateProps {
  nominations?: AdminNomination[];
  onVoteUpdate?: () => void;
}

export function ManualVoteUpdate({ nominations: propNominations = [], onVoteUpdate }: ManualVoteUpdateProps) {
  const [selectedNomineeId, setSelectedNomineeId] = useState("");
  const [additionalVotes, setAdditionalVotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [internalNominations, setInternalNominations] = useState<AdminNomination[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);

  // Use provided nominations or fetch our own
  const nominations = propNominations.length > 0 ? propNominations : internalNominations;
  const selectedNominee = Array.isArray(nominations) ? nominations.find(n => n.id === selectedNomineeId) : undefined;

  // Fetch nominations if not provided
  useEffect(() => {
    if (propNominations.length === 0) {
      fetchNominations();
    }
  }, [propNominations.length]);

  const fetchNominations = async () => {
    setFetchLoading(true);
    try {
      const response = await fetch('/api/admin/nominations-improved', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Filter only approved nominations and format them
          const approvedNominations = result.data
            .filter((n: any) => n.state === 'approved')
            .map((n: any) => ({
              id: n.id,
              displayName: n.type === 'person' 
                ? `${n.firstname || ''} ${n.lastname || ''}`.trim()
                : n.companyName || n.company_name || 'Unknown Company',
              votes: n.votes || 0,
              additionalVotes: n.additionalVotes || 0,
              totalVotes: (n.votes || 0) + (n.additionalVotes || 0)
            }));
          setInternalNominations(approvedNominations);
        }
      }
    } catch (error) {
      console.error('Failed to fetch nominations:', error);
      setMessage({ type: 'error', text: 'Failed to load nominations' });
    } finally {
      setFetchLoading(false);
    }
  };

  const handleUpdateVotes = async () => {
    if (!selectedNomineeId || !additionalVotes) {
      setMessage({ type: 'error', text: 'Please select a nominee and enter additional votes' });
      return;
    }

    const votes = parseInt(additionalVotes);
    if (isNaN(votes) || votes < 0) {
      setMessage({ type: 'error', text: 'Additional votes must be a non-negative number' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/update-votes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nominationId: selectedNomineeId,
          additionalVotes: votes
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage({ 
          type: 'success', 
          text: `Votes updated successfully! Real: ${result.realVotes}, Additional: ${result.additionalVotes}, Total: ${result.totalVotes}` 
        });
        setSelectedNomineeId("");
        setAdditionalVotes("");
        // Refresh data
        if (onVoteUpdate) {
          onVoteUpdate();
        } else {
          fetchNominations(); // Refresh our internal data
        }
      } else {
        throw new Error(result.error || 'Failed to update votes');
      }
    } catch (error) {
      console.error('Error updating votes:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update votes' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Vote Update</CardTitle>
        <CardDescription>
          Add additional votes to any approved nominee. This will be added to their real vote count.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fetchLoading && (
          <div className="text-center py-4 text-muted-foreground">
            Loading nominations...
          </div>
        )}
      
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <select 
        value={selectedNomineeId}
        onChange={(e) => setSelectedNomineeId(e.target.value)}
        className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={loading}
      >
        <option value="">Select a nominee...</option>
        {Array.isArray(nominations) && nominations.map(nominee => (
          <option key={nominee.id} value={nominee.id}>
            {nominee.displayName} (Real: {nominee.votes || 0}, Additional: {nominee.additionalVotes || 0}, Total: {nominee.totalVotes || nominee.votes || 0})
          </option>
        ))}
      </select>

      {selectedNominee && (
        <div className="p-3 bg-muted/30 rounded-lg text-sm">
          <div className="font-medium">{selectedNominee.displayName}</div>
          <div className="text-muted-foreground mt-1">
            Real votes: {selectedNominee.votes || 0} | 
            Additional votes: {selectedNominee.additionalVotes || 0} | 
            Total: {selectedNominee.totalVotes || selectedNominee.votes || 0}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Input 
          placeholder="Additional votes to add" 
          type="number" 
          min="0"
          value={additionalVotes}
          onChange={(e) => setAdditionalVotes(e.target.value)}
          className="text-sm h-8" 
          disabled={loading}
        />
        <Button 
          size="sm" 
          className="h-8" 
          onClick={handleUpdateVotes}
          disabled={loading || !selectedNomineeId || !additionalVotes}
        >
          {loading ? 'Updating...' : 'Update'}
        </Button>
      </div>

        <div className="text-xs text-muted-foreground">
          Note: Additional votes are added to real votes for the total displayed to users. 
          Admin panel shows the breakdown for transparency.
        </div>
      </CardContent>
    </Card>
  );
}