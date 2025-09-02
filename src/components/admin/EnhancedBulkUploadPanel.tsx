"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Download,
  Users,
  Clock,
  AlertTriangle,
  Eye,
  Check,
  X,
  RefreshCw
} from 'lucide-react';

interface EnhancedBulkUploadPanelProps {
  onUploadComplete?: (result: any) => void;
}

interface UploadResult {
  success: boolean;
  batchId?: string;
  summary?: {
    totalRows: number;
    validationErrors: number;
    successfulUploads: number;
    failedUploads: number;
    pendingApproval: number;
    duplicatesFound: number;
  };
  nextSteps?: string[];
  error?: string;
}

interface BatchInfo {
  batch_id: string;
  filename: string;
  total_rows: number;
  successful_rows: number;
  failed_rows: number;
  draft_rows: number;
  pending_approvals: number;
  status: string;
  uploaded_at: string;
  uploaded_by: string;
  processing_percentage: number;
  success_percentage: number;
}

interface PendingNominee {
  nomination_id: string;
  nominee_display_name: string;
  nominee_email: string;
  nominee_type: string;
  subcategory_id: number;
  bulk_upload_row_number: number;
  uploaded_at: string;
  batch_filename: string;
}

interface BulkUploadStats {
  total_batches: number;
  total_nominees_uploaded: number;
  pending_approval: number;
  approved_bulk: number;
  rejected_bulk: number;
  draft_nominees: number;
  failed_uploads: number;
}

export function EnhancedBulkUploadPanel({ onUploadComplete }: EnhancedBulkUploadPanelProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [batches, setBatches] = useState<BatchInfo[]>([]);
  const [pendingNominees, setPendingNominees] = useState<PendingNominee[]>([]);
  const [selectedNominees, setSelectedNominees] = useState<Set<string>>(new Set());
  const [isApproving, setIsApproving] = useState(false);
  const [stats, setStats] = useState<BulkUploadStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadBatchData();
    loadPendingNominees();
  }, []);

  const loadBatchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/bulk-upload-enhanced');
      if (response.ok) {
        const data = await response.json();
        setBatches(data.batches || []);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load batch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingNominees = async (batchId?: string) => {
    try {
      const url = batchId 
        ? `/api/admin/bulk-approve?batchId=${batchId}`
        : '/api/admin/bulk-approve';
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPendingNominees(data.pendingNominees || []);
      }
    } catch (error) {
      console.error('Failed to load pending nominees:', error);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadResult({
        success: false,
        error: 'Please select a CSV file'
      });
      return;
    }

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/admin/bulk-upload-enhanced', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (response.ok && result.success) {
        setUploadResult(result);
        onUploadComplete?.(result);
        await loadBatchData();
        await loadPendingNominees();
      } else {
        setUploadResult({
          success: false,
          error: result.error || 'Upload failed'
        });
      }
    } catch (error) {
      setUploadResult({
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleBulkApproval = async () => {
    if (selectedNominees.size === 0) return;

    setIsApproving(true);
    try {
      const response = await fetch('/api/admin/bulk-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nominationIds: Array.from(selectedNominees)
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setSelectedNominees(new Set());
        await loadBatchData();
        await loadPendingNominees();
        
        // Show success message
        setUploadResult({
          success: true,
          summary: {
            totalRows: result.summary.totalRequested,
            validationErrors: 0,
            successfulUploads: result.summary.approved,
            failedUploads: result.summary.failed,
            pendingApproval: 0,
            duplicatesFound: 0
          },
          nextSteps: result.nextSteps
        });
      } else {
        throw new Error(result.error || 'Approval failed');
      }
    } catch (error) {
      setUploadResult({
        success: false,
        error: error instanceof Error ? error.message : 'Approval failed'
      });
    } finally {
      setIsApproving(false);
    }
  };

  const toggleNomineeSelection = (nomineeId: string) => {
    const newSelection = new Set(selectedNominees);
    if (newSelection.has(nomineeId)) {
      newSelection.delete(nomineeId);
    } else {
      newSelection.add(nomineeId);
    }
    setSelectedNominees(newSelection);
  };

  const selectAllNominees = () => {
    setSelectedNominees(new Set(pendingNominees.map(n => n.nomination_id)));
  };

  const clearSelection = () => {
    setSelectedNominees(new Set());
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const downloadTemplate = () => {
    const csvContent = `type,firstname,lastname,person_email,person_phone,person_linkedin,jobtitle,person_company,person_country,why_me,company_name,company_email,company_phone,company_website,company_linkedin,company_country,company_size,company_industry,company_domain,why_us,subcategory_id,category_group_id,bio,achievements,social_media,live_url
person,John,Smith,john.smith@example.com,+1-555-0123,https://linkedin.com/in/johnsmith,Senior Recruiter,TechStaff Solutions,United States,"Experienced recruiter with 8+ years in tech staffing",,,,,,,,,,,,4,2,"Technology recruitment specialist","Top performer 2022-2024",,https://johnsmith.com
company,,,,,,,,,"",InnovateTech Staffing,info@innovatetech.com,+1-555-0456,https://innovatetech.com,https://linkedin.com/company/innovatetech,United States,51-200,Technology Staffing,innovatetech.com,"Leading tech staffing firm with AI-powered matching",7,3,,,`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_upload_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const refreshData = async () => {
    await Promise.all([loadBatchData(), loadPendingNominees()]);
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Batches</p>
                  <p className="text-2xl font-bold">{stats.total_batches}</p>
                </div>
                <Upload className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Approval</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pending_approval}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved_bulk}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failed_uploads}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload CSV</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Approval ({stats?.pending_approval || 0})
          </TabsTrigger>
          <TabsTrigger value="batches">Upload History</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Bulk Upload Nominees
              </CardTitle>
              <CardDescription>
                Upload multiple nominees at once using a CSV file. All uploaded nominees will be in draft mode for manual approval.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {!isUploading ? (
                  <div className="space-y-4">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium">Choose CSV file to upload</p>
                      <p className="text-sm text-gray-500">
                        Maximum file size: 10MB | Maximum rows: 1000
                      </p>
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={triggerFileSelect}>
                        Select CSV File
                      </Button>
                      <Button variant="outline" onClick={downloadTemplate}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Template
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <div>
                      <p className="text-lg font-medium">Uploading and processing...</p>
                      <Progress value={uploadProgress} className="mt-2" />
                      <p className="text-sm text-gray-500 mt-1">{uploadProgress}% complete</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Result */}
              {uploadResult && (
                <div className="space-y-4">
                  {uploadResult.success ? (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <div className="space-y-2">
                          <p className="font-medium">
                            {uploadResult.summary ? 'Upload completed successfully!' : 'Bulk approval completed!'}
                          </p>
                          {uploadResult.summary && (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>Total Rows: {uploadResult.summary.totalRows}</div>
                              <div>Successful: {uploadResult.summary.successfulUploads}</div>
                              <div>Failed: {uploadResult.summary.failedUploads}</div>
                              <div>Pending Approval: {uploadResult.summary.pendingApproval}</div>
                              {uploadResult.summary.duplicatesFound > 0 && (
                                <div className="col-span-2 text-orange-600">
                                  Duplicates Found: {uploadResult.summary.duplicatesFound}
                                </div>
                              )}
                            </div>
                          )}
                          {uploadResult.batchId && (
                            <p className="text-sm">
                              Batch ID: <code className="bg-white px-1 rounded">{uploadResult.batchId}</code>
                            </p>
                          )}
                          {uploadResult.nextSteps && (
                            <div className="mt-3">
                              <p className="font-medium text-sm">Next Steps:</p>
                              <ul className="text-sm list-disc list-inside space-y-1">
                                {uploadResult.nextSteps.map((step, index) => (
                                  <li key={index}>{step}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="border-red-200 bg-red-50">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <p className="font-medium">Operation failed</p>
                        <p className="text-sm">{uploadResult.error}</p>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-medium text-blue-900">CSV Format Requirements:</p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Include required headers: type, firstname/company_name, person_email/company_email, subcategory_id, category_group_id</li>
                      <li>• Type must be "person" or "company"</li>
                      <li>• All uploaded nominees will be in draft mode</li>
                      <li>• You must manually approve each nominee to make them live</li>
                      <li>• Approved nominees will automatically sync to Loops.so</li>
                      <li>• Duplicate emails will be rejected</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Nominees Pending Approval
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={refreshData}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                {selectedNominees.size > 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSelection}
                    >
                      Clear Selection
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleBulkApproval}
                      disabled={isApproving}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isApproving ? 'Approving...' : `Approve Selected (${selectedNominees.size})`}
                    </Button>
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                Review and approve bulk uploaded nominees. Click to select nominees for batch approval.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingNominees.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No nominees pending approval</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      {pendingNominees.length} nominees pending approval
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllNominees}
                    >
                      Select All
                    </Button>
                  </div>
                  
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {pendingNominees.map((nominee) => (
                      <div
                        key={nominee.nomination_id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedNominees.has(nominee.nomination_id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleNomineeSelection(nominee.nomination_id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{nominee.nominee_display_name}</h4>
                              <Badge variant={nominee.nominee_type === 'person' ? 'default' : 'secondary'}>
                                {nominee.nominee_type}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{nominee.nominee_email}</p>
                            <p className="text-xs text-gray-500">
                              Row {nominee.bulk_upload_row_number} from {nominee.batch_filename}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedNominees.has(nominee.nomination_id)}
                              onChange={() => toggleNomineeSelection(nominee.nomination_id)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Upload History
              </CardTitle>
              <CardDescription>
                View all bulk upload batches and their processing status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {batches.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No upload batches found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {batches.map((batch) => (
                    <div key={batch.batch_id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{batch.filename}</h4>
                        <Badge 
                          variant={
                            batch.status === 'completed' ? 'default' :
                            batch.status === 'failed' ? 'destructive' :
                            batch.status === 'partial' ? 'secondary' : 'outline'
                          }
                        >
                          {batch.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Total Rows</p>
                          <p className="font-medium">{batch.total_rows}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Successful</p>
                          <p className="font-medium text-green-600">{batch.successful_rows}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Failed</p>
                          <p className="font-medium text-red-600">{batch.failed_rows}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Pending Approval</p>
                          <p className="font-medium text-orange-600">{batch.pending_approvals}</p>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Processing: {batch.processing_percentage}%</span>
                          <span>Success Rate: {batch.success_percentage}%</span>
                        </div>
                        <Progress value={batch.processing_percentage} className="h-2" />
                      </div>
                      
                      <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                        <span>Uploaded by {batch.uploaded_by}</span>
                        <span>{new Date(batch.uploaded_at).toLocaleString()}</span>
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadPendingNominees(batch.batch_id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        {batch.pending_approvals > 0 && (
                          <Button
                            size="sm"
                            onClick={() => {
                              loadPendingNominees(batch.batch_id);
                            }}
                          >
                            Review Pending ({batch.pending_approvals})
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}