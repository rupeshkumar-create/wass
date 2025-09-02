'use client';

<<<<<<< HEAD
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, LogOut, RefreshCw, Users, CheckCircle, XCircle, Edit, Search, Building2, User, Clock, Trash2 } from "lucide-react";
import { EnhancedEditDialog } from "@/components/admin/EnhancedEditDialog";
import { ApprovalDialog } from "@/components/admin/ApprovalDialog";
import { NominationToggle } from "@/components/admin/NominationToggle";
import { ManualVoteUpdate } from "@/components/admin/ManualVoteUpdate";
import { TopNomineesPanel } from "@/components/admin/TopNomineesPanel";
import { BulkUploadPanel } from "@/components/admin/BulkUploadPanel";
import { triggerAdminDataRefresh } from "@/lib/utils/data-sync";

interface AdminNomination {
  id: string;
  type: 'person' | 'company';
  state: 'submitted' | 'approved' | 'rejected';
  subcategory_id: string;
  categoryGroupId: string;
  
  // Person fields
  firstname?: string;
  lastname?: string;
  jobtitle?: string;
  personEmail?: string;
  personLinkedin?: string;
  personPhone?: string;
  personCompany?: string;
  personCountry?: string;
  headshotUrl?: string;
  headshot_url?: string;
  whyMe?: string;
  
  // Company fields
  companyName?: string;
  company_name?: string;
  companyWebsite?: string;
  companyLinkedin?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyCountry?: string;
  logoUrl?: string;
  logo_url?: string;
  whyUs?: string;
  
  // Shared fields
  liveUrl?: string;
  imageUrl?: string;
  displayName?: string;
  votes?: number;
  additionalVotes?: number;
  nominatorName?: string;
  nominatorEmail?: string;
  nominatorCompany?: string;
  nominatorLinkedin?: string;
  nominatorPhone?: string;
  nominatorCountry?: string;
  created_at?: string;
  updated_at?: string;
}

interface EnhancedStats {
  totalNominations: number;
  pendingNominations: number;
  approvedNominations: number;
  rejectedNominations: number;
  totalVotes: number;
  totalVoters: number;
  averageVotesPerNominee: number;
  topCategories: Array<{ category: string; count: number }>;
  recentActivity: Array<{ type: string; count: number; timestamp: string }>;
  conversionRate: number;
  hubspotSyncStatus: 'synced' | 'pending' | 'error';
  loopsSyncStatus: 'synced' | 'pending' | 'error';
}

interface ConnectionStatus {
  hubspot: 'connected' | 'error' | 'checking';
  loops: 'connected' | 'error' | 'checking';
  supabase: 'connected' | 'error' | 'checking';
}



export default function AdminPage() {
  // Authentication is now handled by middleware
  const [loading, setLoading] = useState(false);
  const [nominations, setNominations] = useState<AdminNomination[]>([]);
  const [filteredNominations, setFilteredNominations] = useState<AdminNomination[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedNomination, setSelectedNomination] = useState<AdminNomination | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'approved' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'person' | 'company'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [enhancedStats, setEnhancedStats] = useState<EnhancedStats | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    hubspot: 'checking',
    loops: 'checking',
    supabase: 'checking'
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [lastStatsUpdate, setLastStatsUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Authentication is now handled by middleware
    fetchData();
    fetchEnhancedStats();
    checkConnectionStatus();
  }, []);

  // Real-time stats polling
  useEffect(() => {
    const interval = setInterval(() => {
      fetchEnhancedStats();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Filter nominations when filters or search term changes
  useEffect(() => {
    let filtered = nominations;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(nom => nom.state === statusFilter);
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(nom => nom.type === typeFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(nom => 
        nom.firstname?.toLowerCase().includes(term) ||
        nom.lastname?.toLowerCase().includes(term) ||
        nom.companyName?.toLowerCase().includes(term) ||
        nom.company_name?.toLowerCase().includes(term) ||
        nom.nominatorName?.toLowerCase().includes(term) ||
        nom.nominatorEmail?.toLowerCase().includes(term) ||
        nom.nominatorName?.toLowerCase().includes(term)
      );
    }

    setFilteredNominations(filtered);
  }, [nominations, statusFilter, typeFilter, searchTerm]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      window.location.href = '/admin/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      // Check HubSpot connection
      const hubspotResponse = await fetch('/api/sync/hubspot/run', { method: 'GET' });
      setConnectionStatus(prev => ({ 
        ...prev, 
        hubspot: hubspotResponse.ok ? 'connected' : 'error' 
      }));
    } catch {
      setConnectionStatus(prev => ({ ...prev, hubspot: 'error' }));
    }

    try {
      // Check Loops connection
      const loopsResponse = await fetch('/api/sync/loops/run', { method: 'GET' });
      setConnectionStatus(prev => ({ 
        ...prev, 
        loops: loopsResponse.ok ? 'connected' : 'error' 
      }));
    } catch {
      setConnectionStatus(prev => ({ ...prev, loops: 'error' }));
    }

    try {
      // Check Supabase connection
      const supabaseResponse = await fetch('/api/nominees', { method: 'GET' });
      setConnectionStatus(prev => ({ 
        ...prev, 
        supabase: supabaseResponse.ok ? 'connected' : 'error' 
      }));
    } catch {
      setConnectionStatus(prev => ({ ...prev, supabase: 'error' }));
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/nominations-improved', {
        cache: 'no-store',
        headers: { 
          'Cache-Control': 'no-cache'
=======
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Test the passcode by making a request to the stats API
      const response = await fetch('/api/stats', {
        headers: {
          'x-admin-passcode': passcode,
>>>>>>> 12cdef4183d5e285187ff86b0db4bd8aabb1cc6a
        },
      });

      if (response.ok) {
<<<<<<< HEAD
        const result = await response.json();
        if (result.success) {
          setNominations(result.data);
          // Fetch enhanced stats after nominations are loaded
          await fetchEnhancedStats();
        } else {
          setError(result.error || 'Failed to fetch nominations');
        }
      } else {
        setError(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnhancedStats = async () => {
    setStatsLoading(true);
    try {
      const response = await fetch('/api/admin/top-nominees', {
        cache: 'no-store',
        headers: { 
          'Cache-Control': 'no-cache'
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setEnhancedStats(result.stats);
          setLastStatsUpdate(new Date());
        }
      }
    } catch (err) {
      console.error('Stats fetch error:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleApprove = async (liveUrl: string, adminNotes?: string) => {
    if (!selectedNomination) return;
    
    try {
      const response = await fetch('/api/nomination/approve', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          nominationId: selectedNomination.id, 
          action: 'approve',
          liveUrl: liveUrl,
          adminNotes: adminNotes
        })
      });

      if (response.ok) {
        await fetchData();
        await fetchEnhancedStats();
        // Trigger real-time data sync across all components
        triggerAdminDataRefresh();
        setIsApprovalDialogOpen(false);
        setSelectedNomination(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to approve nomination');
      }
    } catch (err) {
      console.error('Approval error:', err);
      setError('Network error occurred');
    }
  };

  const handleReject = async (rejectionReason: string, adminNotes?: string) => {
    if (!selectedNomination) return;
    
    try {
      const response = await fetch('/api/nomination/approve', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          nominationId: selectedNomination.id, 
          action: 'reject',
          rejectionReason: rejectionReason,
          adminNotes: adminNotes
        })
      });

      if (response.ok) {
        await fetchData();
        await fetchEnhancedStats();
        // Trigger real-time data sync across all components
        triggerAdminDataRefresh();
        setIsApprovalDialogOpen(false);
        setSelectedNomination(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to reject nomination');
      }
    } catch (err) {
      console.error('Rejection error:', err);
      setError('Network error occurred');
    }
  };

  const handleEdit = async (nominationId: string, updates: Partial<AdminNomination>) => {
    try {
      const response = await fetch('/api/admin/nominations', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          nominationId, 
          ...updates // Flatten updates to match API expectations
        })
      });

      if (response.ok) {
        await fetchData();
        await fetchEnhancedStats();
        // Trigger real-time data sync across all components
        triggerAdminDataRefresh();
        setIsEditDialogOpen(false);
        setSelectedNomination(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update nomination');
      }
    } catch (err) {
      console.error('Edit error:', err);
      setError('Network error occurred');
    }
  };

  const handleDelete = async (nominationId: string) => {
    if (!confirm('Are you sure you want to delete this nomination? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/nominations-improved?id=${nominationId}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchData();
        await fetchEnhancedStats();
        // Trigger real-time data sync across all components
        triggerAdminDataRefresh();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete nomination');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Network error occurred');
    }
  };

  const getStatusStats = () => {
    const submitted = nominations.filter(n => n.state === 'submitted').length;
    const approved = nominations.filter(n => n.state === 'approved').length;
    const rejected = nominations.filter(n => n.state === 'rejected').length;
    const total = nominations.length;

    return { submitted, approved, rejected, total };
  };

  const stats = getStatusStats();

  // Status icon component
  const getStatusIcon = (state: string) => {
    switch (state) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" title="Approved" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" title="Rejected" />;
      case 'submitted':
        return <Clock className="h-4 w-4 text-orange-600" title="Pending Review" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" title="Unknown Status" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                  <p className="text-sm text-muted-foreground">World Staffing Awards 2026</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <Badge variant={connectionStatus.supabase === 'connected' ? 'default' : 'destructive'}>
                  DB: {connectionStatus.supabase}
                </Badge>
                <Badge variant={connectionStatus.hubspot === 'connected' ? 'default' : 'destructive'}>
                  HubSpot: {connectionStatus.hubspot}
                </Badge>
                <Badge variant={connectionStatus.loops === 'connected' ? 'default' : 'destructive'}>
                  Loops: {connectionStatus.loops}
                </Badge>
              </div>
              
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Nominations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.submitted}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* New Dashboard Layout: 30% Top Nominees + 70% Main Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Left Sidebar: Top Nominees (30%) */}
          <div className="lg:col-span-3">
            <TopNomineesPanel nominations={nominations} />
          </div>

          {/* Main Content Area (70%) */}
          <div className="lg:col-span-7">
            <Tabs defaultValue="nominations" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="nominations">Nominations</TabsTrigger>
                <TabsTrigger value="bulk-upload">Bulk Upload</TabsTrigger>
                <TabsTrigger value="manual-votes">Manual Votes</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="stats">Analytics</TabsTrigger>
              </TabsList>

          <TabsContent value="nominations" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filter Nominations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="status-filter">Status:</Label>
                    <select
                      id="status-filter"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="px-3 py-1 border rounded-md"
                    >
                      <option value="all">All</option>
                      <option value="submitted">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="type-filter">Type:</Label>
                    <select
                      id="type-filter"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value as any)}
                      className="px-3 py-1 border rounded-md"
                    >
                      <option value="all">All</option>
                      <option value="person">Person</option>
                      <option value="company">Company</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2 flex-1 max-w-md">
                    <Label htmlFor="search">Search:</Label>
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search nominations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Nominations List */}
            <Card>
              <CardHeader>
                <CardTitle>Nominations ({filteredNominations.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading nominations...</div>
                ) : filteredNominations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No nominations found matching your criteria.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredNominations.map((nomination) => (
                      <div key={nomination.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                              {/* Show nominee photo if available, otherwise show icon */}
                              {nomination.imageUrl || nomination.headshotUrl || nomination.headshot_url || nomination.logoUrl || nomination.logo_url ? (
                                <img 
                                  src={nomination.imageUrl || nomination.headshotUrl || nomination.headshot_url || nomination.logoUrl || nomination.logo_url} 
                                  alt={nomination.type === 'person' 
                                    ? `${nomination.firstname || ''} ${nomination.lastname || ''}`.trim()
                                    : nomination.companyName || nomination.company_name || 'Company'
                                  }
                                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                  onError={(e) => {
                                    // Hide broken images and show fallback icon
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : null}
                              
                              {/* Fallback icon - always show if no image or image fails to load */}
                              {!(nomination.imageUrl || nomination.headshotUrl || nomination.headshot_url || nomination.logoUrl || nomination.logo_url) && (
                                nomination.type === 'person' ? (
                                  <User className="h-10 w-10 text-blue-500 p-2 bg-blue-50 rounded-full" />
                                ) : (
                                  <Building2 className="h-10 w-10 text-purple-500 p-2 bg-purple-50 rounded-full" />
                                )
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="font-semibold">
                                {nomination.type === 'person' 
                                  ? `${nomination.firstname || ''} ${nomination.lastname || ''}`.trim()
                                  : nomination.companyName || nomination.company_name || 'Unknown Company'
                                }
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Nominated by: {nomination.nominatorName || nomination.nominatorEmail || 'Unknown'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            {/* Status Icon */}
                            <div className="flex items-center">
                              {getStatusIcon(nomination.state)}
                            </div>
                            
                            {/* Edit Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedNomination(nomination);
                                setIsEditDialogOpen(true);
                              }}
                              className="p-2"
                              title="Edit nomination"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            {/* Delete Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(nomination.id)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete nomination"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            
                            {/* Review Button for submitted nominations */}
                            {nomination.state === 'submitted' && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  setSelectedNomination(nomination);
                                  setIsApprovalDialogOpen(true);
                                }}
                                className="px-3"
                              >
                                Review
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk-upload">
            <BulkUploadPanel />
          </TabsContent>

          <TabsContent value="manual-votes">
            <ManualVoteUpdate nominations={nominations} onVoteUpdate={fetchData} />
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              <NominationToggle />
              
              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>
                    Monitor the health of integrated services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Database (Supabase)</span>
                      <Badge variant={connectionStatus.supabase === 'connected' ? 'default' : 'destructive'}>
                        {connectionStatus.supabase}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>CRM (HubSpot)</span>
                      <Badge variant={connectionStatus.hubspot === 'connected' ? 'default' : 'destructive'}>
                        {connectionStatus.hubspot}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Email (Loops)</span>
                      <Badge variant={connectionStatus.loops === 'connected' ? 'default' : 'destructive'}>
                        {connectionStatus.loops}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stats">
            <Card>
              <CardHeader>
                <CardTitle>Enhanced Analytics</CardTitle>
                <CardDescription>
                  Detailed statistics and insights
                  {lastStatsUpdate && (
                    <span className="block text-xs mt-1">
                      Last updated: {lastStatsUpdate.toLocaleTimeString()}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="text-center py-8">Loading analytics...</div>
                ) : enhancedStats ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <h4 className="font-semibold">Voting Statistics</h4>
                      <p>Total Votes: {enhancedStats.totalVotes}</p>
                      <p>Total Voters: {enhancedStats.totalVoters}</p>
                      <p>Avg Votes/Nominee: {enhancedStats.averageVotesPerNominee?.toFixed(1)}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold">Conversion Rate</h4>
                      <p>{(enhancedStats.conversionRate * 100).toFixed(1)}%</p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold">Sync Status</h4>
                      <p>HubSpot: {enhancedStats.hubspotSyncStatus}</p>
                      <p>Loops: {enhancedStats.loopsSyncStatus}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No analytics data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {selectedNomination && (
        <>
          <EnhancedEditDialog
            nomination={selectedNomination}
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false);
              setSelectedNomination(null);
            }}
            onSave={(updates) => handleEdit(selectedNomination.id, updates)}
          />
          
          <ApprovalDialog
            nomination={selectedNomination}
            isOpen={isApprovalDialogOpen}
            onClose={() => {
              setIsApprovalDialogOpen(false);
              setSelectedNomination(null);
            }}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </>
      )}
=======
        // Store the passcode in sessionStorage for subsequent requests
        sessionStorage.setItem('admin-passcode', passcode);
        // Redirect to admin dashboard
        router.push('/admin/dashboard');
      } else {
        setError('Invalid passcode. Please try again.');
      }
    } catch (err) {
      setError('Login failed. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Panel</CardTitle>
          <CardDescription>
            Enter your admin passcode to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="passcode" className="text-sm font-medium">
                Admin Passcode
              </label>
              <div className="relative">
                <Input
                  id="passcode"
                  type={showPasscode ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter admin passcode"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasscode ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !passcode.trim()}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
>>>>>>> 12cdef4183d5e285187ff86b0db4bd8aabb1cc6a
    </div>
  );
}