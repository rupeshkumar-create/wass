"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, RefreshCw, ExternalLink } from "lucide-react";

interface SyncStats {
  hubspotStatus: 'connected' | 'error';
  lastSyncTime?: string;
  totalSynced?: number;
}

interface SyncEvent {
  id: string;
  type: 'nomination' | 'vote';
  status: 'success' | 'failed' | 'retrying';
  timestamp: string;
  message: string;
}

export function HubSpotPanel() {
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [events, setEvents] = useState<SyncEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadStats();
    loadEvents();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/integrations/hubspot/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setError('Failed to load HubSpot stats');
      }
    } catch (err) {
      setError('Failed to connect to HubSpot API');
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const response = await fetch('/api/integrations/hubspot/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Failed to load sync events:', err);
    }
  };

  const handleResync = async () => {
    setSyncing(true);
    setError('');
    
    try {
      const response = await fetch('/api/integrations/hubspot/resync', {
        method: 'POST',
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Resync completed: ${result.success} successful, ${result.failed} failed`);
        await loadStats();
        await loadEvents();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Resync failed');
      }
    } catch (err) {
      setError('Failed to start resync');
    } finally {
      setSyncing(false);
    }
  };

  const handleNominatorSync = async () => {
    setSyncing(true);
    setError('');
    
    try {
      const response = await fetch('/api/integrations/hubspot/sync-nominators', {
        method: 'POST',
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Nominator sync completed! Synced ${result.stats.synced} out of ${result.stats.totalProcessed} nominators.`);
        await loadStats();
        await loadEvents();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Nominator sync failed');
      }
    } catch (err) {
      setError('Failed to start nominator sync');
    } finally {
      setSyncing(false);
    }
  };

  const handleVoterSync = async () => {
    setSyncing(true);
    setError('');
    
    try {
      const response = await fetch('/api/integrations/hubspot/sync-voters', {
        method: 'POST',
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Voter sync completed! Synced ${result.stats.synced} out of ${result.stats.totalProcessed} voters.`);
        await loadStats();
        await loadEvents();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Voter sync failed');
      }
    } catch (err) {
      setError('Failed to start voter sync');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading HubSpot Integration...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              HubSpot Integration Status
              {stats?.hubspotStatus === 'connected' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadStats}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Real-time sync status and statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                <Badge 
                  variant={stats?.hubspotStatus === 'connected' ? 'default' : 'destructive'}
                  className="text-lg px-3 py-1"
                >
                  {stats?.hubspotStatus === 'connected' ? 'Connected' : 'Error'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Connection Status</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{stats?.totalSynced || 0}</div>
              <p className="text-sm text-muted-foreground">Total Synced</p>
            </div>
            
            <div className="text-center">
              <div className="text-sm font-medium">
                {stats?.lastSyncTime 
                  ? new Date(stats.lastSyncTime).toLocaleString()
                  : 'Never'
                }
              </div>
              <p className="text-sm text-muted-foreground">Last Sync</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Manage HubSpot synchronization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={handleResync}
              disabled={syncing || stats?.hubspotStatus !== 'connected'}
              className="flex items-center gap-2"
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {syncing ? 'Syncing...' : 'Re-sync Everything'}
            </Button>
            
            <Button
              onClick={handleNominatorSync}
              disabled={syncing || stats?.hubspotStatus !== 'connected'}
              variant="outline"
              className="flex items-center gap-2"
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Sync All Nominators
            </Button>
            
            <Button
              onClick={handleVoterSync}
              disabled={syncing || stats?.hubspotStatus !== 'connected'}
              variant="outline"
              className="flex items-center gap-2"
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Sync All Voters
            </Button>
            
            <Button
              variant="outline"
              asChild
            >
              <a 
                href="https://app.hubspot.com/contacts" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open HubSpot
              </a>
            </Button>
          </div>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Re-sync Everything:</strong> Processes all approved nominations and existing votes in batches.</p>
            <p><strong>Sync All Nominators:</strong> Syncs all users who have submitted nominations with "nominators_2026" segment.</p>
            <p><strong>Sync All Voters:</strong> Syncs all users who have cast votes with "Voter 2026" segment.</p>
            <p className="text-xs">Note: Sync operations may take several minutes for large datasets.</p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Events Card */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sync Events</CardTitle>
          <CardDescription>
            Last 10 synchronization events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No sync events recorded yet
            </p>
          ) : (
            <div className="space-y-3">
              {events.slice(0, 10).map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {event.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : event.status === 'failed' ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
                    )}
                    
                    <div>
                      <p className="text-sm font-medium">
                        {event.type === 'nomination' ? 'Nomination' : 'Vote'} Sync
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.message}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge 
                      variant={event.status === 'success' ? 'default' : 
                              event.status === 'failed' ? 'destructive' : 'secondary'}
                    >
                      {event.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}