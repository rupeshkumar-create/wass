"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, LogOut, RefreshCw, Users, CheckCircle, XCircle, Edit, Search, Building2, User } from "lucide-react";
import { EnhancedEditDialog } from "@/components/admin/EnhancedEditDialog";
import { ApprovalDialog } from "@/components/admin/ApprovalDialog";
import { NominationToggle } from "@/components/admin/NominationToggle";
import { ManualVoteUpdate } from "@/components/admin/ManualVoteUpdate";
import { TopNomineesPanel } from "@/components/admin/TopNomineesPanel";

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
  whyUs?: string;
  
  // Shared fields
  liveUrl?: string;
  votes: number; // Real votes from actual voting
  additionalVotes?: number; // Manual votes added by admin
  totalVotes?: number; // Total votes (real + additional)
  created_at: string;
  createdAt: string;
  updatedAt?: string;
  
  // Contact info (computed)
  email?: string;
  phone?: string;
  linkedin?: string;
  
  // Nominator info
  nominatorEmail?: string;
  nominatorName?: string;
  nominatorCompany?: string;
  nominatorJobTitle?: string;
  nominatorPhone?: string;
  nominatorCountry?: string;
  
  // Computed fields
  displayName: string;
  imageUrl?: string;
  
  // Admin fields
  adminNotes?: string;
  rejectionReason?: string;
  approvedAt?: string;
  approvedBy?: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);
  const [nominations, setNominations] = useState<AdminNomination[]>([]);
  const [filteredNominations, setFilteredNominations] = useState<AdminNomination[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter and search state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit dialog state
  const [editingNomination, setEditingNomination] = useState<AdminNomination | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Approval dialog state
  const [approvingNomination, setApprovingNomination] = useState<AdminNomination | null>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  
  // Connection status state
  const [connectionStatus, setConnectionStatus] = useState({
    hubspot: 'checking',
    loops: 'checking',
    supabase: 'checking'
  });
  
  // Dashboard view state
  const [activeTab, setActiveTab] = useState('nominations');
  
  // Enhanced stats state
  const [enhancedStats, setEnhancedStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [lastStatsUpdate, setLastStatsUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("admin-authenticated");
    if (stored === "true") {
      setIsAuthenticated(true);
      fetchData();
      fetchEnhancedStats();
      checkConnectionStatus();
    }
  }, []);

  // Real-time stats polling
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchEnhancedStats();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated]);

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
        nom.displayName.toLowerCase().includes(term) ||
        nom.subcategory_id.toLowerCase().includes(term) ||
        nom.email?.toLowerCase().includes(term) ||
        nom.nominatorEmail?.toLowerCase().includes(term) ||
        nom.nominatorName?.toLowerCase().includes(term)
      );
    }

    setFilteredNominations(filtered);
  }, [nominations, statusFilter, typeFilter, searchTerm]);

  const handleLogin = async () => {
    setLoading(true);
    setAuthError("");

    if (passcode === "admin123" || passcode === "wsa2026") {
      setIsAuthenticated(true);
      localStorage.setItem("admin-authenticated", "true");
      await fetchData();
      await fetchEnhancedStats();
      await checkConnectionStatus();
    } else {
      setAuthError("Invalid passcode");
    }

    setLoading(false);
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

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("admin-authenticated");
    setPasscode("");
    setNominations([]);
    setError(null);
  }; 
  const fetchData = async () => {
    setDataLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/admin/nominations", {
        cache: 'no-store',
        headers: { 
          'Cache-Control': 'no-cache',
          'X-Admin-Passcode': 'wsa2026'
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setNominations(result.data);
          // Fetch enhanced stats after nominations are loaded
          fetchEnhancedStats();
        } else {
          throw new Error(result.error || 'Failed to fetch nominations');
        }
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to fetch nominations'}`);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      setDataLoading(false);
    }
  };

  const fetchEnhancedStats = async () => {
    setStatsLoading(true);
    
    try {
      const response = await fetch("/api/stats", {
        cache: 'no-store',
        headers: { 
          'Cache-Control': 'no-cache',
          'X-Admin-Passcode': 'wsa2026'
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setEnhancedStats(result.data);
          setLastStatsUpdate(new Date());
        } else {
          console.error('Failed to fetch enhanced stats:', result.error);
        }
      } else {
        console.error('Failed to fetch enhanced stats:', response.status);
      }
    } catch (error) {
      console.error("Failed to fetch enhanced stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleApproveNomination = (nomination: AdminNomination) => {
    setApprovingNomination(nomination);
    setIsApprovalDialogOpen(true);
  };

  const handleRejectNomination = (nomination: AdminNomination) => {
    setApprovingNomination(nomination);
    setIsApprovalDialogOpen(true);
  };

  const handleApprovalSubmit = async (liveUrl: string, adminNotes?: string) => {
    if (!approvingNomination) return;

    try {
      const response = await fetch('/api/nomination/approve', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Admin-Passcode': 'wsa2026'
        },
        body: JSON.stringify({ 
          nominationId: approvingNomination.id,
          action: 'approve',
          liveUrl,
          adminNotes
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        await fetchData(); // Refresh data
        await fetchEnhancedStats(); // Refresh stats
        alert(`Nomination approved successfully! Live URL: ${liveUrl}`);
      } else {
        throw new Error(result.error || 'Failed to approve nomination');
      }
    } catch (error) {
      console.error('Error approving nomination:', error);
      throw error; // Re-throw to be handled by the dialog
    }
  };

  const handleRejectionSubmit = async (rejectionReason: string, adminNotes?: string) => {
    if (!approvingNomination) return;

    try {
      const response = await fetch('/api/nomination/approve', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Admin-Passcode': 'wsa2026'
        },
        body: JSON.stringify({ 
          nominationId: approvingNomination.id,
          action: 'reject',
          rejectionReason,
          adminNotes
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        await fetchData(); // Refresh data
        await fetchEnhancedStats(); // Refresh stats
        alert('Nomination rejected successfully');
      } else {
        throw new Error(result.error || 'Failed to reject nomination');
      }
    } catch (error) {
      console.error('Error rejecting nomination:', error);
      throw error; // Re-throw to be handled by the dialog
    }
  };

  const handleEditNomination = (nomination: AdminNomination) => {
    setEditingNomination(nomination);
    setIsEditDialogOpen(true);
  };

  const handleSaveNomination = async (updates: any) => {
    if (!editingNomination) return;

    try {
      const response = await fetch('/api/admin/nominations', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'X-Admin-Passcode': 'wsa2026'
        },
        body: JSON.stringify({ 
          nominationId: editingNomination.id,
          ...updates
        })
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchData(); // Refresh data
        await fetchEnhancedStats(); // Refresh stats
        setIsEditDialogOpen(false);
        setEditingNomination(null);
      } else {
        throw new Error(result.error || 'Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving nomination:', error);
      throw error; // Re-throw to be handled by the dialog
    }
  };

  const getStatusStats = () => {
    const stats = {
      total: nominations.length,
      submitted: nominations.filter(n => n.state === 'submitted').length,
      approved: nominations.filter(n => n.state === 'approved').length,
      rejected: nominations.filter(n => n.state === 'rejected').length,
      persons: nominations.filter(n => n.type === 'person').length,
      companies: nominations.filter(n => n.type === 'company').length,
    };
    return stats;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center py-8 px-4">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <Shield className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">Admin Access</CardTitle>
              <CardDescription className="text-base mt-2">
                Enter your admin passcode to access the dashboard
              </CardDescription>
            </CardHeader>    
        <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="passcode" className="text-sm font-medium">
                  Admin Passcode
                </Label>
                <Input
                  id="passcode"
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="••••••••"
                  className="h-12 text-center tracking-wider"
                />
              </div>

              {authError && (
                <Alert variant="destructive">
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleLogin}
                disabled={loading || !passcode}
                className="w-full h-12 text-base font-semibold"
              >
                {loading ? "Authenticating..." : "Access Dashboard"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const stats = getStatusStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold">Admin Dashboard</h1>
                  <p className="text-muted-foreground text-xs">
                    World Staffing Awards 2026 • Management Console
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      fetchData();
                      fetchEnhancedStats();
                      checkConnectionStatus();
                    }} 
                    disabled={dataLoading || statsLoading}
                  >
                    <RefreshCw className={`h-3 w-3 ${(dataLoading || statsLoading) ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-3 w-3" />
                    Logout
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Layout: 30% Sidebar + 70% Dashboard */}
        <div className="flex gap-6">
          {/* Left Sidebar - 30% */}
          <div className="w-[30%] space-y-4">
            <TopNomineesPanel 
              nominations={nominations.filter(n => n.state === 'approved')}
              onCategoryChange={(category) => {
                // Filter main dashboard by category if needed
                console.log('Category changed:', category);
              }}
            />
          </div>

          {/* Main Dashboard - 70% */}
          <div className="w-[70%]">

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-blue-600">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-yellow-600">{stats.submitted}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-green-600">{stats.approved}</div>
              <div className="text-xs text-muted-foreground">Approved</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-red-600">{stats.rejected}</div>
              <div className="text-xs text-muted-foreground">Rejected</div>
            </CardContent>
          </Card>
        </div>

        {/* Vote Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className={`border-0 shadow-sm ${statsLoading ? 'animate-pulse' : ''}`}>
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-emerald-600">
                {statsLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600 mx-auto"></div>
                ) : (
                  enhancedStats?.totalRealVotes || 0
                )}
              </div>
              <div className="text-xs text-muted-foreground">Real Votes</div>
            </CardContent>
          </Card>
          <Card className={`border-0 shadow-sm ${statsLoading ? 'animate-pulse' : ''}`}>
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-orange-600">
                {statsLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mx-auto"></div>
                ) : (
                  enhancedStats?.totalAdditionalVotes || 0
                )}
              </div>
              <div className="text-xs text-muted-foreground">Additional</div>
            </CardContent>
          </Card>
          <Card className={`border-0 shadow-sm ${statsLoading ? 'animate-pulse' : ''}`}>
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-cyan-600">
                {statsLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-600 mx-auto"></div>
                ) : (
                  enhancedStats?.totalCombinedVotes || 0
                )}
              </div>
              <div className="text-xs text-muted-foreground">Total Votes</div>
            </CardContent>
          </Card>
          <Card className={`border-0 shadow-sm ${statsLoading ? 'animate-pulse' : ''}`}>
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-violet-600">
                {statsLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-violet-600 mx-auto"></div>
                ) : (
                  enhancedStats?.uniqueVoters || 0
                )}
              </div>
              <div className="text-xs text-muted-foreground">Voters</div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Update Indicator */}
        {lastStatsUpdate && (
          <div className="text-center mb-4">
            <div className="text-xs text-muted-foreground">
              Last updated: {lastStatsUpdate.toLocaleTimeString()} • Auto-refresh every 30s
              {statsLoading && <span className="ml-2 text-blue-600">Updating...</span>}
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="nominations">Nominations</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Nominations Tab */}
          <TabsContent value="nominations" className="space-y-4">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-4 w-4" />
                  Nominations Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filters and Search */}
                <div className="flex flex-col md:flex-row gap-3 mb-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input
                        placeholder="Search nominations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-input rounded-md text-sm h-8 bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="submitted">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="px-3 py-2 border border-input rounded-md text-sm h-8 bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    >
                      <option value="all">All Types</option>
                      <option value="person">Persons</option>
                      <option value="company">Companies</option>
                    </select>
                  </div>
                </div>

                {dataLoading ? (
                  <div className="text-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground text-sm">Loading nominations...</p>
                  </div>
                ) : filteredNominations.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground text-sm">
                      {nominations.length === 0 ? 'No nominations found' : 'No nominations match your filters'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredNominations.map((nomination) => (
                      <Card key={nomination.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              {nomination.imageUrl && (
                                <img
                                  src={nomination.imageUrl}
                                  alt={nomination.displayName}
                                  className="w-8 h-8 rounded-full object-cover border"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {nomination.type === 'person' ? (
                                    <User className="h-3 w-3 text-blue-500 flex-shrink-0" />
                                  ) : (
                                    <Building2 className="h-3 w-3 text-purple-500 flex-shrink-0" />
                                  )}
                                  <h3 className="font-medium text-sm truncate">{nomination.displayName}</h3>
                                  <Badge 
                                    variant={
                                      nomination.state === 'approved' ? 'default' :
                                      nomination.state === 'rejected' ? 'destructive' : 'secondary'
                                    }
                                    className="text-xs px-1 py-0"
                                  >
                                    {nomination.state}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="truncate">{nomination.subcategory_id}</span>
                                  <span title={`Real: ${nomination.votes || 0}, Additional: ${nomination.additionalVotes || 0}`}>
                                    {nomination.totalVotes || nomination.votes || 0} votes
                                    {(nomination.additionalVotes || 0) > 0 && (
                                      <span className="text-orange-600 ml-1">
                                        (+{nomination.additionalVotes})
                                      </span>
                                    )}
                                  </span>
                                  {nomination.email && (
                                    <a href={`mailto:${nomination.email}`} className="text-blue-600 hover:underline truncate">
                                      {nomination.email}
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Compact Action Buttons */}
                            <div className="flex items-center gap-1 ml-3">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditNomination(nomination)}
                                className="h-7 w-7 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              
                              {nomination.state !== 'approved' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveNomination(nomination)}
                                  className="h-7 w-7 p-0 bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                              )}
                              
                              {nomination.state !== 'rejected' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRejectNomination(nomination)}
                                  className="h-7 w-7 p-0"
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top Nominees */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Top Nominees by Votes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {nominations
                      .filter(n => n.state === 'approved')
                      .sort((a, b) => b.votes - a.votes)
                      .slice(0, 5)
                      .map((nominee, index) => (
                        <div key={nominee.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          {nominee.imageUrl && (
                            <img src={nominee.imageUrl} alt={nominee.displayName} className="w-8 h-8 rounded-full object-cover" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{nominee.displayName}</div>
                            <div className="text-xs text-muted-foreground">{nominee.subcategory_id}</div>
                          </div>
                          <div className="text-sm font-bold text-primary">{nominee.votes}</div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Category Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(
                      nominations.reduce((acc, nom) => {
                        acc[nom.subcategory_id] = (acc[nom.subcategory_id] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    )
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 8)
                      .map(([category, count]) => (
                        <div key={category} className="flex items-center justify-between p-2 rounded bg-muted/20">
                          <span className="text-sm truncate flex-1">{category}</span>
                          <Badge variant="secondary" className="text-xs">{count}</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {nominations
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .slice(0, 5)
                      .map((nomination) => (
                        <div key={nomination.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                          <div className={`w-2 h-2 rounded-full ${
                            nomination.state === 'approved' ? 'bg-green-500' :
                            nomination.state === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm truncate">{nomination.displayName}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(nomination.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {nomination.state}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Manual Vote Update */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Manual Vote Update</CardTitle>
                </CardHeader>
                <CardContent>
                  <ManualVoteUpdate 
                    nominations={nominations.filter(n => n.state === 'approved')}
                    onVoteUpdate={() => {
                      fetchData();
                      fetchEnhancedStats();
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Connections Tab */}
          <TabsContent value="connections" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* HubSpot Status */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      connectionStatus.hubspot === 'connected' ? 'bg-green-500' :
                      connectionStatus.hubspot === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    HubSpot
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      Status: <span className={`font-medium ${
                        connectionStatus.hubspot === 'connected' ? 'text-green-600' :
                        connectionStatus.hubspot === 'error' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {connectionStatus.hubspot === 'connected' ? 'Connected' :
                         connectionStatus.hubspot === 'error' ? 'Error' : 'Checking...'}
                      </span>
                    </div>
                    <Button size="sm" variant="outline" className="w-full h-8 text-xs">
                      Test Connection
                    </Button>
                    <Button size="sm" variant="outline" className="w-full h-8 text-xs">
                      Sync All Data
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Loops Status */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      connectionStatus.loops === 'connected' ? 'bg-green-500' :
                      connectionStatus.loops === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    Loops
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      Status: <span className={`font-medium ${
                        connectionStatus.loops === 'connected' ? 'text-green-600' :
                        connectionStatus.loops === 'error' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {connectionStatus.loops === 'connected' ? 'Connected' :
                         connectionStatus.loops === 'error' ? 'Error' : 'Checking...'}
                      </span>
                    </div>
                    <Button size="sm" variant="outline" className="w-full h-8 text-xs">
                      Test Connection
                    </Button>
                    <Button size="sm" variant="outline" className="w-full h-8 text-xs">
                      Sync Email Lists
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Supabase Status */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      connectionStatus.supabase === 'connected' ? 'bg-green-500' :
                      connectionStatus.supabase === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    Supabase
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      Status: <span className={`font-medium ${
                        connectionStatus.supabase === 'connected' ? 'text-green-600' :
                        connectionStatus.supabase === 'error' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {connectionStatus.supabase === 'connected' ? 'Connected' :
                         connectionStatus.supabase === 'error' ? 'Error' : 'Checking...'}
                      </span>
                    </div>
                    <Button size="sm" variant="outline" className="w-full h-8 text-xs">
                      Test Connection
                    </Button>
                    <Button size="sm" variant="outline" className="w-full h-8 text-xs">
                      Database Health
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nomination Toggle */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Nomination Control</CardTitle>
                </CardHeader>
                <CardContent>
                  <NominationToggle />
                </CardContent>
              </Card>

              {/* System Actions */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">System Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full h-8 text-xs">
                      Export All Data
                    </Button>
                    <Button variant="outline" className="w-full h-8 text-xs">
                      Generate Reports
                    </Button>
                    <Button variant="outline" className="w-full h-8 text-xs">
                      Clear Cache
                    </Button>
                    <Button variant="destructive" className="w-full h-8 text-xs">
                      Reset All Votes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

          </div>
        </div>

        {/* Edit Dialog */}
        {editingNomination && (
          <EnhancedEditDialog
            nomination={editingNomination}
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false);
              setEditingNomination(null);
            }}
            onSave={handleSaveNomination}
          />
        )}

        {/* Approval Dialog */}
        {approvingNomination && (
          <ApprovalDialog
            nomination={approvingNomination}
            isOpen={isApprovalDialogOpen}
            onClose={() => {
              setIsApprovalDialogOpen(false);
              setApprovingNomination(null);
            }}
            onApprove={handleApprovalSubmit}
            onReject={handleRejectionSubmit}
          />
        )}
      </div>
    </div>
  );
}