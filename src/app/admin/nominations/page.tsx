'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  ExternalLink,
  User,
  Building,
  Mail,
  Phone,
  Globe,
  Linkedin
} from 'lucide-react';
import Link from 'next/link';

interface Nominee {
  id: string;
  type: 'person' | 'company';
  firstname?: string;
  lastname?: string;
  company_name?: string;
  person_email?: string;
  company_email?: string;
  person_linkedin?: string;
  company_linkedin?: string;
  jobtitle?: string;
  person_company?: string;
  company_website?: string;
  person_phone?: string;
  company_phone?: string;
  person_country?: string;
  company_country?: string;
  company_industry?: string;
  company_size?: string;
}

interface Nomination {
  id: string;
  state: 'submitted' | 'approved' | 'rejected';
  subcategory_id: string;
  created_at: string;
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
  admin_notes?: string;
  live_url?: string;
  nominee: Nominee;
  nominator: {
    firstname: string;
    lastname: string;
    email: string;
  };
}

export default function NominationsManagement() {
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedNomination, setSelectedNomination] = useState<Nomination | null>(null);
  const [liveUrl, setLiveUrl] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const router = useRouter();

  useEffect(() => {
    const passcode = sessionStorage.getItem('admin-passcode');
    if (!passcode) {
      router.push('/admin');
      return;
    }

    fetchNominations(passcode);
  }, [router]);

  const fetchNominations = async (passcode: string) => {
    try {
      const response = await fetch('/api/nominations', {
        headers: {
          'x-admin-passcode': passcode,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNominations(data.nominations || []);
      } else if (response.status === 401) {
        sessionStorage.removeItem('admin-passcode');
        router.push('/admin');
      } else {
        setError('Failed to load nominations');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveReject = async (nominationId: string, action: 'approve' | 'reject') => {
    const passcode = sessionStorage.getItem('admin-passcode');
    if (!passcode) {
      router.push('/admin');
      return;
    }

    setProcessingId(nominationId);
    setError('');

    try {
      const requestBody: any = {
        nominationId,
        action,
      };

      if (action === 'approve' && liveUrl.trim()) {
        requestBody.liveUrl = liveUrl.trim();
      }

      if (action === 'reject' && rejectionReason.trim()) {
        requestBody.rejectionReason = rejectionReason.trim();
      }

      if (adminNotes.trim()) {
        requestBody.adminNotes = adminNotes.trim();
      }

      const response = await fetch('/api/nomination/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-passcode': passcode,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        // Refresh nominations list
        await fetchNominations(passcode);
        // Reset form
        setSelectedNomination(null);
        setLiveUrl('');
        setAdminNotes('');
        setRejectionReason('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Failed to ${action} nomination`);
      }
    } catch (err) {
      setError(`Failed to ${action} nomination`);
    } finally {
      setProcessingId(null);
    }
  };

  const getDisplayName = (nominee: Nominee) => {
    if (nominee.type === 'person') {
      return `${nominee.firstname || ''} ${nominee.lastname || ''}`.trim();
    }
    return nominee.company_name || 'Unknown Company';
  };

  const getStatusBadge = (state: string) => {
    switch (state) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading nominations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/admin/dashboard" className="mr-4">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Nominations Management</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-yellow-600">
                {nominations.filter(n => n.state === 'submitted').length}
              </div>
              <p className="text-sm text-gray-600">Pending Review</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">
                {nominations.filter(n => n.state === 'approved').length}
              </div>
              <p className="text-sm text-gray-600">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-red-600">
                {nominations.filter(n => n.state === 'rejected').length}
              </div>
              <p className="text-sm text-gray-600">Rejected</p>
            </CardContent>
          </Card>
        </div>

        {/* Nominations List */}
        <div className="space-y-6">
          {nominations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">No nominations found.</p>
              </CardContent>
            </Card>
          ) : (
            nominations.map((nomination) => (
              <Card key={nomination.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center">
                        {nomination.nominee.type === 'person' ? (
                          <User className="w-5 h-5 mr-2" />
                        ) : (
                          <Building className="w-5 h-5 mr-2" />
                        )}
                        {getDisplayName(nomination.nominee)}
                      </CardTitle>
                      <CardDescription>
                        Category: {nomination.subcategory_id} • 
                        Submitted: {new Date(nomination.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {getStatusBadge(nomination.state)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Nominee Details */}
                    <div>
                      <h4 className="font-medium mb-3">Nominee Information</h4>
                      <div className="space-y-2 text-sm">
                        {nomination.nominee.type === 'person' ? (
                          <>
                            {nomination.nominee.jobtitle && (
                              <div className="flex items-center">
                                <span className="font-medium w-20">Role:</span>
                                <span>{nomination.nominee.jobtitle}</span>
                              </div>
                            )}
                            {nomination.nominee.person_company && (
                              <div className="flex items-center">
                                <Building className="w-4 h-4 mr-2" />
                                <span>{nomination.nominee.person_company}</span>
                              </div>
                            )}
                            {nomination.nominee.person_email && (
                              <div className="flex items-center">
                                <Mail className="w-4 h-4 mr-2" />
                                <span>{nomination.nominee.person_email}</span>
                              </div>
                            )}
                            {nomination.nominee.person_linkedin && (
                              <div className="flex items-center">
                                <Linkedin className="w-4 h-4 mr-2" />
                                <a href={nomination.nominee.person_linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  LinkedIn Profile
                                </a>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            {nomination.nominee.company_website && (
                              <div className="flex items-center">
                                <Globe className="w-4 h-4 mr-2" />
                                <a href={nomination.nominee.company_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  Website
                                </a>
                              </div>
                            )}
                            {nomination.nominee.company_email && (
                              <div className="flex items-center">
                                <Mail className="w-4 h-4 mr-2" />
                                <span>{nomination.nominee.company_email}</span>
                              </div>
                            )}
                            {nomination.nominee.company_industry && (
                              <div className="flex items-center">
                                <span className="font-medium w-20">Industry:</span>
                                <span>{nomination.nominee.company_industry}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Nominator Details */}
                    <div>
                      <h4 className="font-medium mb-3">Nominated By</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          <span>{nomination.nominator.firstname} {nomination.nominator.lastname}</span>
                        </div>
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-2" />
                          <span>{nomination.nominator.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Admin Actions */}
                  {nomination.state === 'submitted' && (
                    <div className="mt-6 pt-6 border-t">
                      {selectedNomination?.id === nomination.id ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">Live URL (for approval)</label>
                              <Input
                                value={liveUrl}
                                onChange={(e) => setLiveUrl(e.target.value)}
                                placeholder="https://example.com/nominee-page"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">Rejection Reason (for rejection)</label>
                              <Input
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Reason for rejection"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Admin Notes (optional)</label>
                            <Textarea
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              placeholder="Internal notes about this nomination"
                              rows={3}
                            />
                          </div>
                          <div className="flex space-x-3">
                            <Button
                              onClick={() => handleApproveReject(nomination.id, 'approve')}
                              disabled={processingId === nomination.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {processingId === nomination.id ? 'Processing...' : 'Approve'}
                            </Button>
                            <Button
                              onClick={() => handleApproveReject(nomination.id, 'reject')}
                              disabled={processingId === nomination.id}
                              variant="destructive"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              {processingId === nomination.id ? 'Processing...' : 'Reject'}
                            </Button>
                            <Button
                              onClick={() => setSelectedNomination(null)}
                              variant="outline"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          onClick={() => setSelectedNomination(nomination)}
                          variant="outline"
                        >
                          Review Nomination
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Show approval/rejection details */}
                  {nomination.state !== 'submitted' && (
                    <div className="mt-6 pt-6 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {nomination.approved_at && (
                          <div>
                            <span className="font-medium">Approved:</span>
                            <span className="ml-2">{new Date(nomination.approved_at).toLocaleString()}</span>
                          </div>
                        )}
                        {nomination.live_url && (
                          <div className="flex items-center">
                            <span className="font-medium mr-2">Live URL:</span>
                            <a href={nomination.live_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                              View Page <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          </div>
                        )}
                        {nomination.rejection_reason && (
                          <div>
                            <span className="font-medium">Rejection Reason:</span>
                            <span className="ml-2">{nomination.rejection_reason}</span>
                          </div>
                        )}
                        {nomination.admin_notes && (
                          <div>
                            <span className="font-medium">Admin Notes:</span>
                            <span className="ml-2">{nomination.admin_notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}