"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, LogOut, RefreshCw, Users, CheckCircle, XCircle, Edit, Eye, Filter, Search, Mail, Phone, Globe, Linkedin, Building2, User } from "lucide-react";
import { EnhancedEditDialog } from "@/components/admin/EnhancedEditDialog";

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
  votes: number;
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

  useEffect(() => {
    const stored = localStorage.getItem("admin-authenticated");
    if (stored === "true") {
      setIsAuthenticated(true);
      fetchData();
    }
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
    } else {
      setAuthError("Invalid passcode");
    }

    setLoading(false);
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
        headers: { 'Cache-Control': 'no-cache' },
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setNominations(result.data);
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

  const handleUpdateStatus = async (nominationId: string, newState: string) => {
    try {
      const response = await fetch('/api/admin/nominations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nominationId, state: newState })
      });

      const result = await response.json();
      
      if (result.success) {
        setNominations(prev => 
          prev.map(nom => 
            nom.id === nominationId 
              ? { ...nom, state: newState as any }
              : nom
          )
        );
        fetchData();
      } else {
        alert('Failed to update status: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nominationId: editingNomination.id,
          ...updates
        })
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchData(); // Refresh data
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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                  <p className="text-muted-foreground text-sm">
                    World Staffing Awards 2026 • Nomination Management
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={fetchData} 
                    disabled={dataLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${dataLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.submitted}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <div className="text-sm text-muted-foreground">Approved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-sm text-muted-foreground">Rejected</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.persons}</div>
              <div className="text-sm text-muted-foreground">Persons</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">{stats.companies}</div>
              <div className="text-sm text-muted-foreground">Companies</div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Nominations Management
            </CardTitle>
            <CardDescription>
              Comprehensive nomination management with editing capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search nominations, emails, categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="submitted">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="person">Persons</option>
                  <option value="company">Companies</option>
                </select>
              </div>
            </div>

            {dataLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading nominations...</p>
              </div>
            ) : filteredNominations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {nominations.length === 0 ? 'No nominations found' : 'No nominations match your filters'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNominations.map((nomination) => (
                  <Card key={nomination.id} className="border hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Header */}
                          <div className="flex items-center gap-3 mb-3">
                            {nomination.imageUrl && (
                              <img
                                src={nomination.imageUrl}
                                alt={nomination.displayName}
                                className="w-12 h-12 rounded-full object-cover border-2"
                              />
                            )}
                            <div>
                              <h3 className="font-semibold text-lg flex items-center gap-2">
                                {nomination.type === 'person' ? (
                                  <User className="h-4 w-4 text-blue-500" />
                                ) : (
                                  <Building2 className="h-4 w-4 text-purple-500" />
                                )}
                                {nomination.displayName}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">
                                  {nomination.type === 'person' ? 'Individual' : 'Company'}
                                </Badge>
                                <Badge 
                                  variant={
                                    nomination.state === 'approved' ? 'default' :
                                    nomination.state === 'rejected' ? 'destructive' : 'secondary'
                                  }
                                >
                                  {nomination.state}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {nomination.subcategory_id} • {nomination.votes} votes
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            {/* Contact Info */}
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm text-muted-foreground">Contact</h4>
                              {nomination.email && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="h-3 w-3" />
                                  <a href={`mailto:${nomination.email}`} className="text-blue-600 hover:underline">
                                    {nomination.email}
                                  </a>
                                </div>
                              )}
                              {nomination.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-3 w-3" />
                                  <span>{nomination.phone}</span>
                                </div>
                              )}
                              {nomination.linkedin && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Linkedin className="h-3 w-3" />
                                  <a href={nomination.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    LinkedIn
                                  </a>
                                </div>
                              )}
                              {nomination.liveUrl && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Globe className="h-3 w-3" />
                                  <a href={nomination.liveUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    Website
                                  </a>
                                </div>
                              )}
                            </div>

                            {/* Nominator Info */}
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm text-muted-foreground">Nominator</h4>
                              {nomination.nominatorName && (
                                <div className="text-sm">{nomination.nominatorName}</div>
                              )}
                              {nomination.nominatorEmail && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="h-3 w-3" />
                                  <a href={`mailto:${nomination.nominatorEmail}`} className="text-blue-600 hover:underline">
                                    {nomination.nominatorEmail}
                                  </a>
                                </div>
                              )}
                              {nomination.nominatorCompany && (
                                <div className="text-sm text-muted-foreground">{nomination.nominatorCompany}</div>
                              )}
                            </div>

                            {/* Additional Info */}
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm text-muted-foreground">Details</h4>
                              {nomination.type === 'person' && nomination.jobtitle && (
                                <div className="text-sm">{nomination.jobtitle}</div>
                              )}
                              {nomination.type === 'person' && nomination.personCompany && (
                                <div className="text-sm text-muted-foreground">{nomination.personCompany}</div>
                              )}
                              <div className="text-sm text-muted-foreground">
                                Created: {new Date(nomination.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          {/* Why Vote Text */}
                          {(nomination.whyMe || nomination.whyUs) && (
                            <div className="mb-4">
                              <h4 className="font-medium text-sm text-muted-foreground mb-2">Why Vote</h4>
                              <p className="text-sm bg-gray-50 p-3 rounded-md">
                                {nomination.whyMe || nomination.whyUs}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditNomination(nomination)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          
                          {nomination.state !== 'approved' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(nomination.id, 'approved')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          )}
                          
                          {nomination.state !== 'rejected' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUpdateStatus(nomination.id, 'rejected')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
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
      </div>
    </div>
  );
}