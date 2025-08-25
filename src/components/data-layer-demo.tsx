"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  useNominations, 
  useVotes, 
  useStats, 
  useMetadata 
} from '@/lib/hooks/use-data';
import { devUtils } from '@/lib/db/dev-utils';
import { dataMigration } from '@/lib/db/migration';

export function DataLayerDemo() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  // Use data hooks
  const { nominations, loading: nominationsLoading, refresh: refreshNominations } = useNominations();
  const { votes, loading: votesLoading, refresh: refreshVotes } = useVotes();
  const { stats, loading: statsLoading, refresh: refreshStats } = useStats();
  const { value: storageType, update: updateStorageType } = useMetadata('storage-type');

  const handleGenerateSampleData = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      await devUtils.generateSampleData(5);
      await devUtils.generateSampleVotes(20);
      
      // Refresh all data
      await Promise.all([
        refreshNominations(),
        refreshVotes(),
        refreshStats(),
      ]);
      
      setMessage('Sample data generated successfully!');
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm('Are you sure you want to clear all data?')) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      await dataMigration.clearAllData();
      
      // Refresh all data
      await Promise.all([
        refreshNominations(),
        refreshVotes(),
        refreshStats(),
      ]);
      
      setMessage('All data cleared successfully!');
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectDatabase = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      await devUtils.inspectDatabase();
      setMessage('Database inspection complete! Check console for details.');
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePerformanceTest = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      await devUtils.performanceTest();
      setMessage('Performance test complete! Check console for results.');
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Layer Demo</CardTitle>
          <CardDescription>
            Test and explore the local-only data layer for World Staffing Awards 2026
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button 
              onClick={handleGenerateSampleData} 
              disabled={loading}
              variant="outline"
            >
              Generate Sample Data
            </Button>
            <Button 
              onClick={handleInspectDatabase} 
              disabled={loading}
              variant="outline"
            >
              Inspect Database
            </Button>
            <Button 
              onClick={handlePerformanceTest} 
              disabled={loading}
              variant="outline"
            >
              Performance Test
            </Button>
            <Button 
              onClick={handleClearData} 
              disabled={loading}
              variant="destructive"
            >
              Clear All Data
            </Button>
          </div>
          
          {message && (
            <Alert className="mb-4">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {statsLoading ? '...' : stats?.totalNominations || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Nominations</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {statsLoading ? '...' : stats?.totalVotes || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Votes</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {storageType || 'Unknown'}
                </div>
                <div className="text-sm text-muted-foreground">Storage Type</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="nominations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="nominations">Nominations</TabsTrigger>
          <TabsTrigger value="votes">Votes</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="nominations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nominations ({nominations.length})</CardTitle>
              <CardDescription>
                {nominationsLoading ? 'Loading...' : `${nominations.length} nominations in local storage`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {nominations.map((nomination) => (
                  <div key={nomination.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{nomination.nominee.name}</div>
                      <div className="text-sm text-muted-foreground">{nomination.category}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={nomination.type === 'person' ? 'default' : 'secondary'}>
                        {nomination.type}
                      </Badge>
                      <Badge 
                        variant={
                          nomination.status === 'approved' ? 'default' :
                          nomination.status === 'rejected' ? 'destructive' : 'secondary'
                        }
                      >
                        {nomination.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {nominations.length === 0 && !nominationsLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    No nominations found. Generate some sample data to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="votes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Votes ({votes.length})</CardTitle>
              <CardDescription>
                {votesLoading ? 'Loading...' : `${votes.length} votes in local storage`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {votes.map((vote) => (
                  <div key={vote.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{vote.voter.firstName} {vote.voter.lastName}</div>
                      <div className="text-sm text-muted-foreground">{vote.voter.email}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">{vote.category}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(vote.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
                {votes.length === 0 && !votesLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    No votes found. Generate some sample data to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
              <CardDescription>
                {statsLoading ? 'Loading...' : 'Current data layer statistics'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">By Status</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 bg-muted rounded">
                        <div className="font-bold">{stats.nominationsByStatus.pending || 0}</div>
                        <div className="text-xs">Pending</div>
                      </div>
                      <div className="text-center p-2 bg-muted rounded">
                        <div className="font-bold">{stats.nominationsByStatus.approved || 0}</div>
                        <div className="text-xs">Approved</div>
                      </div>
                      <div className="text-center p-2 bg-muted rounded">
                        <div className="font-bold">{stats.nominationsByStatus.rejected || 0}</div>
                        <div className="text-xs">Rejected</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">By Type</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center p-2 bg-muted rounded">
                        <div className="font-bold">{stats.nominationsByType.person || 0}</div>
                        <div className="text-xs">Person</div>
                      </div>
                      <div className="text-center p-2 bg-muted rounded">
                        <div className="font-bold">{stats.nominationsByType.company || 0}</div>
                        <div className="text-xs">Company</div>
                      </div>
                    </div>
                  </div>
                  
                  {stats.topCategories.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Top Categories by Votes</h4>
                      <div className="space-y-1">
                        {stats.topCategories.slice(0, 5).map((cat) => (
                          <div key={cat.category} className="flex justify-between text-sm">
                            <span>{cat.category}</span>
                            <span className="font-medium">{cat.count} votes</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}