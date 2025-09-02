'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, Download, Filter } from 'lucide-react';

interface Vote {
  id: string;
  nominee_id: string;
  voter_email: string;
  voter_name: string;
  voter_company?: string;
  voter_country?: string;
  created_at: string;
  nominee: {
    id: string;
    type: 'person' | 'company';
    firstname?: string;
    lastname?: string;
    company_name?: string;
  };
  subcategory: {
    id: string;
    name: string;
    category: {
      name: string;
    };
  };
}

interface VotesStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  byCategory: Record<string, number>;
}

export default function AdminVotesPage() {
  const router = useRouter();
  const [votes, setVotes] = useState<Vote[]>([]);
  const [stats, setStats] = useState<VotesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const passcode = sessionStorage.getItem('adminPasscode');
    if (!passcode) {
      router.push('/admin');
      return;
    }

    fetchVotes(passcode);
  }, [router, filter]);

  const fetchVotes = async (passcode: string) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        admin: 'true',
        passcode,
      });

      if (filter !== 'all') {
        params.append('category', filter);
      }

      const response = await fetch(`/api/votes?${params}`, {
        headers: {
          'x-admin-passcode': passcode,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          sessionStorage.removeItem('adminPasscode');
          router.push('/admin');
          return;
        }
        throw new Error('Failed to fetch votes');
      }

      const data = await response.json();
      setVotes(data.votes || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch votes');
    } finally {
      setLoading(false);
    }
  };

  const exportVotes = async () => {
    const passcode = sessionStorage.getItem('adminPasscode');
    if (!passcode) return;

    try {
      const params = new URLSearchParams({
        admin: 'true',
        passcode,
        export: 'csv',
      });

      const response = await fetch(`/api/votes?${params}`, {
        headers: {
          'x-admin-passcode': passcode,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `votes-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const filteredVotes = votes.filter(vote => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const nomineeName = vote.nominee.type === 'person'
        ? `${vote.nominee.firstname || ''} ${vote.nominee.lastname || ''}`.trim()
        : vote.nominee.company_name || '';
      
      return (
        nomineeName.toLowerCase().includes(searchLower) ||
        vote.voter_name.toLowerCase().includes(searchLower) ||
        vote.voter_email.toLowerCase().includes(searchLower) ||
        vote.subcategory.name.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading votes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/admin/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Votes Management</h1>
                <p className="text-gray-600 mt-1">View and analyze all votes</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={exportVotes}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Votes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.today}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.thisWeek}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.thisMonth}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search votes by nominee, voter, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {stats?.byCategory && Object.keys(stats.byCategory).map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Votes List */}
        <Card>
          <CardHeader>
            <CardTitle>All Votes ({filteredVotes.length})</CardTitle>
            <CardDescription>
              Complete list of all votes cast in the awards
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredVotes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No votes found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredVotes.map((vote) => {
                  const nomineeName = vote.nominee.type === 'person'
                    ? `${vote.nominee.firstname || ''} ${vote.nominee.lastname || ''}`.trim()
                    : vote.nominee.company_name || '';

                  return (
                    <div
                      key={vote.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{nomineeName}</h3>
                            <Badge variant="outline">
                              {vote.nominee.type === 'person' ? 'Person' : 'Company'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Category:</strong> {vote.subcategory.category.name} - {vote.subcategory.name}</p>
                            <p><strong>Voter:</strong> {vote.voter_name} ({vote.voter_email})</p>
                            {vote.voter_company && (
                              <p><strong>Company:</strong> {vote.voter_company}</p>
                            )}
                            {vote.voter_country && (
                              <p><strong>Country:</strong> {vote.voter_country}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <p>{new Date(vote.created_at).toLocaleDateString()}</p>
                          <p>{new Date(vote.created_at).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}