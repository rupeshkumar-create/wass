"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink,
  Database,
  Users,
  Building,
  Ticket
} from 'lucide-react';
import { testHubSpotConnection } from '@/lib/integrations/hubspot-sync';

interface ConnectionStatus {
  success: boolean;
  accountId?: string;
  error?: string;
  loading: boolean;
}

interface SyncStats {
  totalContacts: number;
  totalCompanies: number;
  totalTickets: number;
  lastSync?: string;
}

export function HubSpotSyncPanel() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    success: false,
    loading: true,
  });
  
  const [syncStats, setSyncStats] = useState<SyncStats>({
    totalContacts: 0,
    totalCompanies: 0,
    totalTickets: 0,
  });

  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setConnectionStatus(prev => ({ ...prev, loading: true }));
    
    try {
      const result = await testHubSpotConnection();
      setConnectionStatus({
        success: result.success,
        accountId: result.accountId,
        error: result.error,
        loading: false,
      });
    } catch (error) {
      setConnectionStatus({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false,
      });
    }
  };

  const runSyncTest = async (testType: 'vote' | 'nomination-submit' | 'nomination-approve') => {
    setTestResults(prev => [...prev, `Starting ${testType} test...`]);
    
    try {
      // Mock test data based on type
      let testData: any;
      let endpoint: string;

      switch (testType) {
        case 'vote':
          endpoint = '/api/sync/hubspot/vote';
          testData = {
            voter: {
              email: 'test.voter@example.com',
              firstName: 'Test',
              lastName: 'Voter',
              company: 'Test Company',
              linkedin: 'https://linkedin.com/in/test-voter',
            },
            nominee: {
              id: 'test-nominee-1',
              name: 'Test Nominee',
              type: 'person',
              linkedin: 'https://linkedin.com/in/test-nominee',
              email: 'test.nominee@example.com',
            },
            category: 'top-recruiter',
            subcategoryId: 'top-recruiter',
          };
          break;

        case 'nomination-submit':
          endpoint = '/api/sync/hubspot/nomination-submit';
          testData = {
            nominator: {
              email: 'test.nominator@example.com',
              name: 'Test Nominator',
              company: 'Test Company',
              linkedin: 'https://linkedin.com/in/test-nominator',
            },
            nominee: {
              name: 'Test Nominee',
              type: 'person',
              linkedin: 'https://linkedin.com/in/test-nominee',
              email: 'test.nominee@example.com',
              firstName: 'Test',
              lastName: 'Nominee',
              title: 'Senior Recruiter',
              whyVoteForMe: 'Test why vote for me content',
            },
            category: 'top-recruiter',
            categoryGroupId: 'role-specific',
            subcategoryId: 'top-recruiter',
            whyNominated: 'Test nomination reason',
            imageUrl: 'https://example.com/test-image.jpg',
          };
          break;

        case 'nomination-approve':
          endpoint = '/api/sync/hubspot/nomination-approve';
          testData = {
            nominee: {
              id: 'test-nominee-1',
              name: 'Test Nominee',
              type: 'person',
              email: 'test.nominee@example.com',
              linkedin: 'https://linkedin.com/in/test-nominee',
            },
            nominator: {
              email: 'test.nominator@example.com',
            },
            liveUrl: 'https://example.com/nominee/test-nominee',
            categoryGroupId: 'role-specific',
            subcategoryId: 'top-recruiter',
          };
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const result = await response.json();

      if (result.success) {
        setTestResults(prev => [...prev, `✅ ${testType} test successful`]);
      } else {
        setTestResults(prev => [...prev, `❌ ${testType} test failed: ${result.error}`]);
      }
    } catch (error) {
      setTestResults(prev => [...prev, `❌ ${testType} test error: ${error}`]);
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                HubSpot Connection
              </CardTitle>
              <CardDescription>
                Monitor and test HubSpot integration status
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkConnection}
              disabled={connectionStatus.loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${connectionStatus.loading ? 'animate-spin' : ''}`} />
              Test Connection
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {connectionStatus.loading ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Testing connection...</span>
              </div>
            ) : connectionStatus.success ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-600 font-medium">Connected</span>
                {connectionStatus.accountId && (
                  <Badge variant="outline">Account: {connectionStatus.accountId}</Badge>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-600 font-medium">Disconnected</span>
              </div>
            )}
          </div>

          {connectionStatus.error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{connectionStatus.error}</AlertDescription>
            </Alert>
          )}

          {connectionStatus.success && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ HubSpot API connection is working properly. 
                Sync operations will be processed in the background.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Statistics</CardTitle>
          <CardDescription>
            Overview of synced data in HubSpot
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{syncStats.totalContacts}</div>
              <div className="text-sm text-blue-800">Contacts Synced</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Building className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{syncStats.totalCompanies}</div>
              <div className="text-sm text-purple-800">Companies Synced</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Ticket className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600">{syncStats.totalTickets}</div>
              <div className="text-sm text-orange-800">Tickets Created</div>
            </div>
          </div>

          {syncStats.lastSync && (
            <div className="mt-4 text-sm text-muted-foreground">
              Last sync: {new Date(syncStats.lastSync).toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Testing Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Testing</CardTitle>
          <CardDescription>
            Test individual sync operations with sample data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tests" className="space-y-4">
            <TabsList>
              <TabsTrigger value="tests">Run Tests</TabsTrigger>
              <TabsTrigger value="results">Test Results</TabsTrigger>
            </TabsList>

            <TabsContent value="tests" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  onClick={() => runSyncTest('vote')}
                  disabled={!connectionStatus.success}
                  className="h-20 flex flex-col gap-2"
                >
                  <Users className="h-6 w-6" />
                  Test Vote Sync
                </Button>

                <Button
                  variant="outline"
                  onClick={() => runSyncTest('nomination-submit')}
                  disabled={!connectionStatus.success}
                  className="h-20 flex flex-col gap-2"
                >
                  <Ticket className="h-6 w-6" />
                  Test Nomination Submit
                </Button>

                <Button
                  variant="outline"
                  onClick={() => runSyncTest('nomination-approve')}
                  disabled={!connectionStatus.success}
                  className="h-20 flex flex-col gap-2"
                >
                  <CheckCircle className="h-6 w-6" />
                  Test Nomination Approve
                </Button>
              </div>

              {!connectionStatus.success && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Fix the HubSpot connection before running tests.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Test Results</h4>
                <Button variant="outline" size="sm" onClick={clearTestResults}>
                  Clear Results
                </Button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                {testResults.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No test results yet</p>
                ) : (
                  <div className="space-y-1">
                    {testResults.map((result, index) => (
                      <div key={index} className="text-sm font-mono">
                        {result}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Current HubSpot sync configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Sync Enabled:</span>
              <Badge variant={connectionStatus.success ? "default" : "secondary"}>
                {connectionStatus.success ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Contact LinkedIn Property:</span>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                {process.env.NEXT_PUBLIC_HUBSPOT_CONTACT_LINKEDIN_KEY || 'linkedin'}
              </code>
            </div>
            <div className="flex justify-between">
              <span>Company LinkedIn Property:</span>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                {process.env.NEXT_PUBLIC_HUBSPOT_COMPANY_LINKEDIN_KEY || 'linkedin_company_page'}
              </code>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" size="sm" asChild>
              <a 
                href="https://app.hubspot.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open HubSpot
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}