"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, LogOut, RefreshCw } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { FiltersBar } from "@/components/dashboard/FiltersBar";
import { NominationsTable } from "@/components/dashboard/NominationsTable";
import { Podium } from "@/components/dashboard/Podium";
import { HubSpotPanel } from "@/components/dashboard/HubSpotPanel";
import { Nomination, Vote } from "@/lib/types";
import { ADMIN_PASSCODE, CATEGORIES } from "@/lib/constants";
import { useRealtimeVotes } from "@/hooks/useRealtimeVotes";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);

  // Data state
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("pending"); // Default to pending

  // Check if already authenticated and set up auto-refresh
  useEffect(() => {
    const stored = localStorage.getItem("admin-authenticated");
    if (stored === "true") {
      setIsAuthenticated(true);
      fetchData();
    }
  }, []);

  // Auto-refresh data every 30 seconds when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogin = async () => {
    setLoading(true);
    setAuthError("");

    // Simple passcode check
    if (passcode === ADMIN_PASSCODE) {
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
    setVotes([]);
  };

  const fetchData = async () => {
    setDataLoading(true);
    try {
      // Fetch all nominations with no cache
      const nominationsResponse = await fetch("/api/nominations", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (nominationsResponse.ok) {
        const nominationsData = await nominationsResponse.json();
        setNominations(nominationsData);
      } else {
        console.error("Failed to fetch nominations:", nominationsResponse.status);
      }

      // Fetch all votes with no cache
      const votesResponse = await fetch("/api/votes", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (votesResponse.ok) {
        const votesData = await votesResponse.json();
        setVotes(votesData);
      } else {
        console.error("Failed to fetch votes:", votesResponse.status);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  // Real-time vote updates
  const handleVoteUpdate = useCallback(() => {
    // Refresh votes data when new votes come in
    fetch("/api/votes", {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    })
      .then(res => res.json())
      .then(setVotes)
      .catch(console.error);

    // Also refresh nominations to get updated vote counts
    fetch("/api/nominations", {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    })
      .then(res => res.json())
      .then(setNominations)
      .catch(console.error);

    // Trigger refresh for Podium and StatsCards
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vote-update'));
    }
  }, []);

  useRealtimeVotes({
    onVoteUpdate: handleVoteUpdate,
  });

  const handleUpdateStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      const response = await fetch(`/api/nominations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Update local state
        setNominations(prev =>
          prev.map(n => n.id === id ? { ...n, status, moderatedAt: new Date().toISOString() } : n)
        );
        return result;
      } else if (result.conflict) {
        // Return conflict data to be handled by the table
        return result;
      } else {
        throw new Error(result.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      throw error;
    }
  };

  const handleUpdateWhyVote = async (id: string, whyVote: string) => {
    try {
      const response = await fetch(`/api/nominations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, why_vote: whyVote }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Update local state
        setNominations(prev =>
          prev.map(n => n.id === id ? { ...n, whyVoteForMe: whyVote } : n)
        );
      } else {
        throw new Error(result.error || "Failed to update why vote");
      }
    } catch (error) {
      console.error("Failed to update why vote:", error);
      throw error;
    }
  };

  const handlePhotoUpdated = (nominationId: string, imageUrl: string | null) => {
    // Update local state to reflect the photo change
    setNominations(prev =>
      prev.map(n => n.id === nominationId ? { ...n, imageUrl } : n)
    );
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedType) params.set("type", selectedType);
    if (selectedStatus) params.set("status", selectedStatus);

    window.open(`/api/nominations/export?${params.toString()}`, "_blank");
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedType("");
    setSelectedStatus("");
  };

  // Filter nominations
  const filteredNominations = nominations.filter((nomination) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesNominee = nomination.nominee.name.toLowerCase().includes(query);
      const matchesNominator = nomination.nominator.name.toLowerCase().includes(query);
      const matchesCategory = nomination.category.toLowerCase().includes(query);
      if (!matchesNominee && !matchesNominator && !matchesCategory) return false;
    }

    // Category group filter
    if (selectedCategory) {
      const categoryConfig = CATEGORIES.find(c => c.id === nomination.category);
      if (categoryConfig?.group !== selectedCategory) return false;
    }

    // Type filter
    if (selectedType && nomination.type !== selectedType) return false;

    // Status filter
    if (selectedStatus && nomination.status !== selectedStatus) return false;

    return true;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Admin Access</CardTitle>
            <CardDescription>
              Enter the admin passcode to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="passcode">Passcode</Label>
                <Input
                  id="passcode"
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="Enter admin passcode"
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
                className="w-full"
              >
                {loading ? "Authenticating..." : "Access Dashboard"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage nominations and votes for World Staffing Awards 2026
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {new Date().toLocaleTimeString()} • Auto-refresh: 30s
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchData} 
              disabled={dataLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${dataLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {dataLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-64" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="mb-8">
              <StatsCards />
            </div>

            {/* Main Layout with Podium */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
              {/* Podium - Left Side */}
              <div className="lg:col-span-1">
                <Podium />
              </div>

              {/* Main Content - Right Side */}
              <div className="lg:col-span-3">
                <Tabs defaultValue="nominations" className="space-y-6">
                  <TabsList>
                    <TabsTrigger value="nominations">Nominations</TabsTrigger>
                    <TabsTrigger value="votes">Votes</TabsTrigger>
                    <TabsTrigger value="loops">Loops.so</TabsTrigger>
                    <TabsTrigger value="hubspot">HubSpot</TabsTrigger>
                  </TabsList>

                  <TabsContent value="nominations" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Nominations Management</CardTitle>
                        <CardDescription>
                          Review and manage all nominations
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <FiltersBar
                            searchQuery={searchQuery}
                            selectedCategory={selectedCategory}
                            selectedType={selectedType}
                            selectedStatus={selectedStatus}
                            onSearchChange={setSearchQuery}
                            onCategoryChange={setSelectedCategory}
                            onTypeChange={setSelectedType}
                            onStatusChange={setSelectedStatus}
                            onClearFilters={handleClearFilters}
                            onExport={handleExport}
                          />

                          <div>
                            <p className="text-sm text-muted-foreground mb-4">
                              Showing {filteredNominations.length} of {nominations.length} nominations
                            </p>
                            <NominationsTable
                              nominations={filteredNominations}
                              onUpdateStatus={handleUpdateStatus}
                              onUpdateWhyVote={handleUpdateWhyVote}
                              onPhotoUpdated={handlePhotoUpdated}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="votes" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Votes Overview</CardTitle>
                        <CardDescription>
                          Monitor voting activity and patterns
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-muted rounded-lg">
                              <div className="text-2xl font-bold">{votes.length}</div>
                              <div className="text-sm text-muted-foreground">Total Votes</div>
                            </div>
                            <div className="text-center p-4 bg-muted rounded-lg">
                              <div className="text-2xl font-bold">
                                {new Set(votes.map(v => v.voter.email)).size}
                              </div>
                              <div className="text-sm text-muted-foreground">Unique Voters</div>
                            </div>
                            <div className="text-center p-4 bg-muted rounded-lg">
                              <div className="text-2xl font-bold">
                                {votes.length > 0 ? new Date(Math.max(...votes.map(v => new Date(v.createdAt).getTime()))).toLocaleDateString() : 'N/A'}
                              </div>
                              <div className="text-sm text-muted-foreground">Latest Vote</div>
                            </div>
                          </div>

                          {votes.length > 0 ? (
                            <div className="space-y-4">
                              <h4 className="font-medium">Recent Votes</h4>
                              <div className="max-h-96 overflow-y-auto">
                                <div className="space-y-2">
                                  {votes
                                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                    .slice(0, 50)
                                    .map((vote, index) => (
                                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm">
                                        <div>
                                          <span className="font-medium">{vote.voter.firstName} {vote.voter.lastName}</span>
                                          <span className="text-muted-foreground ml-2">({vote.voter.email})</span>
                                        </div>
                                        <div className="text-right">
                                          <div className="font-medium">{vote.category}</div>
                                          <div className="text-xs text-muted-foreground">
                                            {new Date(vote.createdAt).toLocaleString()}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-muted-foreground">No votes yet</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="loops" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Loops.so Integration</CardTitle>
                        <CardDescription>
                          Monitor voter sync and email automation status
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h4 className="font-medium">Integration Status</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>API Key Configured:</span>
                                <span className={process.env.NEXT_PUBLIC_LOOPS_ENABLED ? "text-green-600" : "text-red-600"}>
                                  {process.env.NEXT_PUBLIC_LOOPS_ENABLED ? "Yes" : "No"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Sync Enabled:</span>
                                <span className="text-green-600">Yes</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Total Voters Synced:</span>
                                <span>{votes.length} (estimated)</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="font-medium">Recent Activity</h4>
                            <div className="text-sm text-muted-foreground">
                              <p>• Voters are automatically synced to Loops when they cast votes</p>
                              <p>• Each voter gets tagged with "Voter 2026"</p>
                              <p>• Vote events are tracked for analytics</p>
                              <p>• Failed syncs are logged but don't block voting</p>
                            </div>
                          </div>
                        </div>

                        <div className="border-t pt-6">
                          <h4 className="font-medium mb-4">Test Integration</h4>
                          <div className="flex gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open('/dev', '_blank')}
                            >
                              Open Dev Tools
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open('https://app.loops.so/contacts', '_blank')}
                            >
                              View Loops Dashboard
                            </Button>
                          </div>
                        </div>

                        <Alert>
                          <AlertDescription>
                            <strong>How it works:</strong> When a user votes, their information is automatically synced to Loops.so with the "Voter 2026" tag.
                            This enables targeted email campaigns for voter engagement and follow-ups.
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="hubspot" className="space-y-6">
                    <HubSpotPanel />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}