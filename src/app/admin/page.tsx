"use client";

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
import { CATEGORIES } from "@/lib/constants";

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
        },
      });
      
      if (response.ok) {
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

      <div className="container mx-auto px-4 py-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Compact Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                  <p className="text-xs text-gray-600">Total Nominations</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-orange-600">{stats.submitted}</div>
                  <p className="text-xs text-gray-600">Pending Review</p>
                </div>
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <RefreshCw className="h-4 w-4 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                  <p className="text-xs text-gray-600">Approved</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                  <p className="text-xs text-gray-600">Rejected</p>
                </div>
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Layout: 35% Sidebar + 65% Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
          {/* Left Sidebar: Top Nominees (35%) */}
          <div className="lg:col-span-3">
            <TopNomineesPanel nominations={nominations} />
          </div>

          {/* Main Content Area (65%) */}
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
            {/* Enhanced Filters */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-blue-600" />
                  Filter & Search Nominations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="status-filter" className="text-sm font-semibold text-gray-700">Status</Label>
                    <select
                      id="status-filter"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    >
                      <option value="all">All Statuses</option>
                      <option value="submitted">Pending Review</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type-filter" className="text-sm font-semibold text-gray-700">Type</Label>
                    <select
                      id="type-filter"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value as any)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    >
                      <option value="all">All Types</option>
                      <option value="person">Person</option>
                      <option value="company">Company</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="search" className="text-sm font-semibold text-gray-700">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Search by name, nominator..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Results Summary */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Showing <span className="font-semibold">{filteredNominations.length}</span> of <span className="font-semibold">{nominations.length}</span> nominations
                  </p>
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
                      <div key={nomination.id} className="border-2 rounded-xl p-6 hover:shadow-lg transition-all duration-300 bg-white">
                        <div className="flex items-start justify-between gap-4">
                          {/* Left Section: Nominee Info */}
                          <div className="flex items-start gap-4 flex-1">
                            {/* Photo/Icon */}
                            <div className="flex-shrink-0">
                              {nomination.imageUrl || nomination.headshotUrl || nomination.headshot_url || nomination.logoUrl || nomination.logo_url ? (
                                <img 
                                  src={nomination.imageUrl || nomination.headshotUrl || nomination.headshot_url || nomination.logoUrl || nomination.logo_url} 
                                  alt={nomination.type === 'person' 
                                    ? `${nomination.firstname || ''} ${nomination.lastname || ''}`.trim()
                                    : nomination.companyName || nomination.company_name || 'Company'
                                  }
                                  className="w-16 h-16 rounded-full object-cover border-3 border-gray-200 shadow-sm"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                nomination.type === 'person' ? (
                                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center border-3 border-blue-200">
                                    <User className="h-8 w-8 text-blue-600" />
                                  </div>
                                ) : (
                                  <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center border-3 border-purple-200">
                                    <Building2 className="h-8 w-8 text-purple-600" />
                                  </div>
                                )
                              )}
                            </div>
                            
                            {/* Nominee Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-bold text-lg text-gray-900 leading-tight">
                                  {nomination.type === 'person' 
                                    ? `${nomination.firstname || ''} ${nomination.lastname || ''}`.trim()
                                    : nomination.companyName || nomination.company_name || 'Unknown Company'
                                  }
                                </h3>
                                <div className="flex items-center gap-2 ml-4">
                                  {getStatusIcon(nomination.state)}
                                  <span className="text-sm font-medium capitalize text-gray-600">
                                    {nomination.state}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <div>
                                  <p className="text-sm text-gray-600 mb-1">
                                    <span className="font-medium">Category:</span> {CATEGORIES.find(c => c.id === nomination.subcategory_id)?.name || nomination.subcategory_id}
                                  </p>
                                  <div className="text-sm text-gray-600 flex items-center">
                                    <span className="font-medium">Type:</span> 
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      {nomination.type === 'person' ? (
                                        <User className="h-3 w-3 mr-1" />
                                      ) : (
                                        <Building2 className="h-3 w-3 mr-1" />
                                      )}
                                      {nomination.type === 'person' ? 'Person' : 'Company'}
                                    </Badge>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 mb-1">
                                    <span className="font-medium">Votes:</span> {(nomination.votes || 0) + (nomination.additionalVotes || 0)} total
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {nomination.votes || 0} real + {nomination.additionalVotes || 0} additional
                                  </p>
                                </div>
                              </div>
                              
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Nominated by:</span> {nomination.nominatorName || nomination.nominatorEmail || 'Unknown'}
                              </p>
                            </div>
                          </div>
                          
                          {/* Right Section: Action Buttons */}
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            {/* Review Button for submitted nominations */}
                            {nomination.state === 'submitted' && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  setSelectedNomination(nomination);
                                  setIsApprovalDialogOpen(true);
                                }}
                                className="px-4 py-2"
                              >
                                Review
                              </Button>
                            )}
                            
                            {/* Edit Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedNomination(nomination);
                                setIsEditDialogOpen(true);
                              }}
                              className="px-4 py-2"
                              title="Edit nomination"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            
                            {/* Delete Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(nomination.id)}
                              className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              title="Delete nomination"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
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
                  <CardTitle>Integration Management</CardTitle>
                  <CardDescription>
                    Monitor and manage external service connections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Database Status */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Shield className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Database (Supabase)</h4>
                          <p className="text-sm text-muted-foreground">Core data storage and management</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={connectionStatus.supabase === 'connected' ? 'default' : 'destructive'}>
                          {connectionStatus.supabase}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={checkConnectionStatus}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* HubSpot Status */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">CRM (HubSpot)</h4>
                          <p className="text-sm text-muted-foreground">Customer relationship management sync</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={connectionStatus.hubspot === 'connected' ? 'default' : 'destructive'}>
                          {connectionStatus.hubspot}
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={async () => {
                            try {
                              await fetch('/api/sync/hubspot/run', { method: 'POST' });
                              checkConnectionStatus();
                            } catch (error) {
                              console.error('HubSpot sync error:', error);
                            }
                          }}
                        >
                          Sync
                        </Button>
                      </div>
                    </div>

                    {/* Loops Status */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Users className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Email (Loops)</h4>
                          <p className="text-sm text-muted-foreground">Email automation and notifications</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={connectionStatus.loops === 'connected' ? 'default' : 'destructive'}>
                          {connectionStatus.loops}
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={async () => {
                            try {
                              await fetch('/api/sync/loops/run', { method: 'POST' });
                              checkConnectionStatus();
                            } catch (error) {
                              console.error('Loops sync error:', error);
                            }
                          }}
                        >
                          Sync
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stats">
            <div className="space-y-6">
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
                    <div className="text-center py-8">
                      <div className="inline-flex items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span>Loading analytics...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Voting Statistics */}
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-3">Voting Statistics</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-blue-700">Total Votes:</span>
                            <span className="font-medium text-blue-900">
                              {enhancedStats?.totalVotes || nominations.reduce((sum, n) => sum + (n.votes || 0) + (n.additionalVotes || 0), 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-blue-700">Real Votes:</span>
                            <span className="font-medium text-blue-900">
                              {nominations.reduce((sum, n) => sum + (n.votes || 0), 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-blue-700">Additional:</span>
                            <span className="font-medium text-blue-900">
                              {nominations.reduce((sum, n) => sum + (n.additionalVotes || 0), 0)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Nomination Statistics */}
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-green-900 mb-3">Nominations</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-green-700">Total:</span>
                            <span className="font-medium text-green-900">{nominations.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-green-700">Approved:</span>
                            <span className="font-medium text-green-900">
                              {nominations.filter(n => n.state === 'approved').length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-green-700">Pending:</span>
                            <span className="font-medium text-green-900">
                              {nominations.filter(n => n.state === 'submitted').length}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Type Breakdown */}
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <h4 className="font-semibold text-purple-900 mb-3">Type Breakdown</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-purple-700">People:</span>
                            <span className="font-medium text-purple-900">
                              {nominations.filter(n => n.type === 'person').length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-purple-700">Companies:</span>
                            <span className="font-medium text-purple-900">
                              {nominations.filter(n => n.type === 'company').length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-purple-700">Avg Votes:</span>
                            <span className="font-medium text-purple-900">
                              {nominations.length > 0 
                                ? (nominations.reduce((sum, n) => sum + (n.votes || 0) + (n.additionalVotes || 0), 0) / nominations.length).toFixed(1)
                                : '0'
                              }
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Performance Metrics */}
                      <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <h4 className="font-semibold text-orange-900 mb-3">Performance</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-orange-700">Approval Rate:</span>
                            <span className="font-medium text-orange-900">
                              {nominations.length > 0 
                                ? ((nominations.filter(n => n.state === 'approved').length / nominations.length) * 100).toFixed(1)
                                : '0'
                              }%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-orange-700">Top Category:</span>
                            <span className="font-medium text-orange-900 text-xs">
                              {(() => {
                                const categoryCount = nominations.reduce((acc, n) => {
                                  const cat = n.subcategory_id || 'unknown';
                                  acc[cat] = (acc[cat] || 0) + 1;
                                  return acc;
                                }, {} as Record<string, number>);
                                const topCategory = Object.entries(categoryCount).sort(([,a], [,b]) => b - a)[0];
                                return topCategory ? CATEGORIES.find(c => c.id === topCategory[0])?.name?.slice(0, 15) || topCategory[0] : 'None';
                              })()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-orange-700">Active:</span>
                            <span className="font-medium text-orange-900">
                              {nominations.filter(n => (n.votes || 0) + (n.additionalVotes || 0) > 0).length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Category Breakdown Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Category Distribution</CardTitle>
                  <CardDescription>Nominations by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(() => {
                      const categoryStats = nominations.reduce((acc, n) => {
                        const catId = n.subcategory_id || 'unknown';
                        const catName = CATEGORIES.find(c => c.id === catId)?.name || catId;
                        if (!acc[catName]) {
                          acc[catName] = { total: 0, approved: 0, votes: 0 };
                        }
                        acc[catName].total += 1;
                        if (n.state === 'approved') acc[catName].approved += 1;
                        acc[catName].votes += (n.votes || 0) + (n.additionalVotes || 0);
                        return acc;
                      }, {} as Record<string, { total: number; approved: number; votes: number }>);

                      return Object.entries(categoryStats)
                        .sort(([,a], [,b]) => b.total - a.total)
                        .slice(0, 10)
                        .map(([category, stats]) => (
                          <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{category}</div>
                              <div className="text-xs text-gray-600">
                                {stats.approved}/{stats.total} approved • {stats.votes} votes
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${(stats.approved / Math.max(stats.total, 1)) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium w-8 text-right">{stats.total}</span>
                            </div>
                          </div>
                        ));
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
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
    </div>
  );
}