"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AdminNomination {
  id: string;
  displayName: string;
  votes: number;
  additionalVotes?: number;
  totalVotes?: number;
}

interface ManualVoteUpdateProps {
  nominations: AdminNomination[];
  onVoteUpdate: () => void;
}

export function ManualVoteUpdate({ nominations, onVoteUpdate }: ManualVoteUpdateProps) {
  const [selectedNomineeId, setSelectedNomineeId] = useState("");
  const [additionalVotes, setAdditionalVotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const selectedNominee = nominations.find(n => n.id === selectedNomineeId);

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
          'Content-Type': 'application/json',
          'X-Admin-Passcode': 'wsa2026'
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
        onVoteUpdate(); // Refresh the data
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
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground mb-3">
        Add additional votes to any approved nominee. This will be added to their real vote count.
      </div>
      
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
        {nominations.map(nominee => (
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
    </div>
  );
}