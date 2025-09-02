"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Database, Trash2, Sprout, Vote, AlertTriangle } from "lucide-react";

export default function DevUtilitiesPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string>("");

  // Check if we're in development
  const isDev = process.env.NODE_ENV !== "production";

  const callApi = async (endpoint: string, body?: any) => {
    setLoading(endpoint);
    setError("");
    setResults(null);

    try {
      const response = await fetch(`/api/dev/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      setResults(result);
      console.log(`✅ ${endpoint}:`, result);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      console.error(`❌ ${endpoint}:`, errorMsg);
    } finally {
      setLoading(null);
    }
  };

  if (!isDev) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Development utilities are only available in development mode.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Development Utilities</h1>
          <p className="text-muted-foreground">
            Tools for seeding and testing the World Staffing Awards 2026 application
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Reset Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Reset Data
              </CardTitle>
              <CardDescription>
                Clear all nominations and votes from local storage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => callApi("reset")}
                disabled={loading === "reset"}
                variant="destructive"
                className="w-full"
              >
                {loading === "reset" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset All Data"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Seed Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sprout className="h-5 w-5" />
                Seed Data
              </CardTitle>
              <CardDescription>
                Generate sample nominations for all categories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => callApi("seed", {})}
                disabled={loading === "seed"}
                variant="outline"
                className="w-full"
              >
                {loading === "seed" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Seeding...
                  </>
                ) : (
                  "Seed (Pending Only)"
                )}
              </Button>
              
              <Button
                onClick={() => callApi("seed", { approveSome: true })}
                disabled={loading === "seed"}
                className="w-full"
              >
                {loading === "seed" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Seeding...
                  </>
                ) : (
                  "Seed + Auto-Approve 50%"
                )}
              </Button>
              
              <Button
                onClick={() => callApi("seed", { approveSome: true, votes: true })}
                disabled={loading === "seed"}
                className="w-full"
              >
                {loading === "seed" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Seeding...
                  </>
                ) : (
                  "Seed + Approve + Votes"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Loops Testing */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5" />
              Loops.so Integration Testing
            </CardTitle>
            <CardDescription>
              Test Loops.so voter sync and event tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                onClick={() => callApi("loops-test", { 
                  action: "sync-voter", 
                  email: "test@example.com", 
                  firstName: "John", 
                  lastName: "Doe" 
                })}
                disabled={loading === "loops-test"}
                variant="outline"
                className="w-full"
              >
                {loading === "loops-test" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test Voter Sync"
                )}
              </Button>
              
              <Button
                onClick={() => callApi("loops-test", { 
                  action: "send-event", 
                  email: "test@example.com" 
                })}
                disabled={loading === "loops-test"}
                variant="outline"
                className="w-full"
              >
                {loading === "loops-test" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test Vote Event"
                )}
              </Button>
              
              <Button
                onClick={() => callApi("loops-test", { 
                  action: "find-contact", 
                  email: "test@example.com" 
                })}
                disabled={loading === "loops-test"}
                variant="outline"
                className="w-full"
              >
                {loading === "loops-test" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Find Contact"
                )}
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p><strong>Note:</strong> These tests use test@example.com. Check your Loops dashboard to verify contacts are being created/updated with the "Voter 2026" tag.</p>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {results.success !== undefined && (
                  <Badge variant={results.success ? "default" : "destructive"}>
                    {results.success ? "Success" : "Failed"}
                  </Badge>
                )}
                {results.ok && <Badge variant="default">Success</Badge>}
                
                {/* Loops-specific results */}
                {results.action && (
                  <p><span className="font-medium">Action:</span> {results.action}</p>
                )}
                {results.loopsEnabled !== undefined && (
                  <p><span className="font-medium">Loops Enabled:</span> {results.loopsEnabled ? "Yes" : "No"}</p>
                )}
                
                {/* Seed results */}
                {results.inserted && (
                  <p><span className="font-medium">Inserted:</span> {results.inserted} nominations</p>
                )}
                {results.approved && (
                  <p><span className="font-medium">Approved:</span> {results.approved} nominations</p>
                )}
                {results.votes && (
                  <p><span className="font-medium">Votes:</span> {results.votes} simulated votes</p>
                )}
                {results.added && (
                  <p><span className="font-medium">Added:</span> {results.added} votes</p>
                )}
                {results.total && (
                  <p><span className="font-medium">Total:</span> {results.total} votes</p>
                )}
                
                {/* Raw result for debugging */}
                {results.result && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium">Raw Response</summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                      {JSON.stringify(results.result, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>
              Navigate to key pages to test the seeded data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button asChild variant="outline" size="sm">
                <a href="/admin" target="_blank">Admin Dashboard</a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href="/directory" target="_blank">Directory</a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href="/nominate" target="_blank">Nominate</a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href="/" target="_blank">Home</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. Reset & Seed</h4>
              <p className="text-sm text-muted-foreground">
                Click "Reset All Data" then "Seed + Approve + Votes" to populate the system with test data.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">2. Test Admin Flow</h4>
              <p className="text-sm text-muted-foreground">
                Go to Admin Dashboard (use proper admin login), review pending nominations, and approve some.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">3. Test Public Flow</h4>
              <p className="text-sm text-muted-foreground">
                Visit Directory to see approved nominees, click on profiles, and test the voting flow.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">4. Test Duplicate Prevention</h4>
              <p className="text-sm text-muted-foreground">
                Try submitting a nomination with the same LinkedIn URL and category as an existing one.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}