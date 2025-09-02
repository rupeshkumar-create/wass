"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Eye,
  Trash2
} from "lucide-react";

interface BulkUploadPanelProps {
  onUploadComplete?: () => void;
}

interface UploadBatch {
  id: string;
  filename: string;
  total_rows: number;
  processed_rows: number;
  successful_rows: number;
  failed_rows: number;
  status: 'processing' | 'completed' | 'failed';
  uploaded_at: string;
  error_summary?: string;
}

interface UploadError {
  row_number: number;
  field_name?: string;
  error_message: string;
  raw_data?: any;
}

export function BulkUploadPanel({ onUploadComplete }: BulkUploadPanelProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [recentBatches, setRecentBatches] = useState<UploadBatch[]>([]);
  const [selectedBatchErrors, setSelectedBatchErrors] = useState<UploadError[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch recent upload batches
  const fetchRecentBatches = async () => {
    try {
      const response = await fetch('/api/admin/bulk-upload/batches');
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setRecentBatches(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  // Fetch errors for a specific batch
  const fetchBatchErrors = async (batchId: string) => {
    try {
      const response = await fetch(`/api/admin/bulk-upload/batches/${batchId}/errors`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSelectedBatchErrors(result.data);
          setShowErrors(true);
        }
      }
    } catch (error) {
      console.error('Error fetching batch errors:', error);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);
    setSuccess(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/bulk-upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setUploadResult(result.data);
        setSuccess(`Upload completed! ${result.data.successful_rows} nominees uploaded successfully.`);
        
        // Refresh batches list
        await fetchRecentBatches();
        
        // Notify parent component
        if (onUploadComplete) {
          onUploadComplete();
        }
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Download CSV template
  const downloadTemplate = () => {
    const csvContent = `type,category,first_name,last_name,job_title,company_name,email,phone,country,linkedin,website,bio,achievements,why_vote_for_me,company_size,industry,logo_url,headshot_url,nominator_name,nominator_email,nominator_company,nominator_job_title,nominator_phone,nominator_country
person,best-recruitment-consultant,John,Smith,Senior Recruitment Consultant,ABC Recruitment Ltd,john.smith@abc.com,+44 20 1234 5678,United Kingdom,https://linkedin.com/in/johnsmith,,Experienced recruiter with 10+ years in tech recruitment,Placed 500+ candidates in 2024,Outstanding performance and client satisfaction,,,,,Jane Doe,jane.doe@company.com,XYZ Corp,HR Director,+44 20 9876 5432,United Kingdom
company,best-recruitment-agency,,,,,TechTalent Solutions,info@techtalent.com,+1 555 123 4567,United States,,https://www.techtalent.com,Leading technology recruitment agency,Award-winning agency with 95% success rate,Consistently delivers top talent to Fortune 500 companies,100-200 employees,Technology Recruitment,https://techtalent.com/logo.png,,Sarah Johnson,sarah.j@client.com,Client Corp,Talent Director,,United States`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Load recent batches on component mount
  React.useEffect(() => {
    fetchRecentBatches();
  }, []);

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Upload Nominees
          </CardTitle>
          <CardDescription>
            Upload multiple nominees at once using a CSV file. All uploaded nominees will be in draft status for manual approval.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error/Success Alerts */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Template Download */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div>
              <h4 className="font-medium">CSV Template</h4>
              <p className="text-sm text-muted-foreground">
                Download the template with sample data and required format
              </p>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">Select CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={uploading}
              ref={fileInputRef}
            />
            <p className="text-xs text-muted-foreground">
              Maximum file size: 10MB. Only CSV files are accepted.
            </p>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Processing upload...</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <div className="p-4 border rounded-lg bg-blue-50">
              <h4 className="font-medium mb-2">Upload Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium text-blue-600">{uploadResult.total_rows}</div>
                  <div className="text-muted-foreground">Total Rows</div>
                </div>
                <div>
                  <div className="font-medium text-green-600">{uploadResult.successful_rows}</div>
                  <div className="text-muted-foreground">Successful</div>
                </div>
                <div>
                  <div className="font-medium text-red-600">{uploadResult.failed_rows}</div>
                  <div className="text-muted-foreground">Failed</div>
                </div>
                <div>
                  <div className="font-medium text-orange-600">Draft</div>
                  <div className="text-muted-foreground">Status</div>
                </div>
              </div>
              {uploadResult.failed_rows > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => fetchBatchErrors(uploadResult.batch_id)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Errors
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Uploads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Uploads
          </CardTitle>
          <CardDescription>
            View and manage recent bulk upload batches
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentBatches.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No recent uploads found
            </p>
          ) : (
            <div className="space-y-3">
              {recentBatches.map((batch) => (
                <div key={batch.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{batch.filename}</span>
                      <Badge 
                        variant={
                          batch.status === 'completed' ? 'default' :
                          batch.status === 'failed' ? 'destructive' : 'secondary'
                        }
                      >
                        {batch.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{batch.total_rows} total</span>
                      <span className="text-green-600">{batch.successful_rows} success</span>
                      {batch.failed_rows > 0 && (
                        <span className="text-red-600">{batch.failed_rows} failed</span>
                      )}
                      <span>{new Date(batch.uploaded_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {batch.failed_rows > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchBatchErrors(batch.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Details Modal */}
      {showErrors && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Upload Errors
              </span>
              <Button variant="ghost" size="sm" onClick={() => setShowErrors(false)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedBatchErrors.length === 0 ? (
              <p className="text-muted-foreground">No errors found</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedBatchErrors.map((error, index) => (
                  <div key={index} className="p-3 border rounded-lg bg-red-50">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="destructive">Row {error.row_number}</Badge>
                      {error.field_name && (
                        <Badge variant="outline">{error.field_name}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-red-800">{error.error_message}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">1</div>
            <div>
              <strong>Download Template:</strong> Use the CSV template with the correct column headers and format
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">2</div>
            <div>
              <strong>Fill Data:</strong> Complete all required fields. Person nominations need first_name, last_name, job_title
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">3</div>
            <div>
              <strong>Upload & Review:</strong> Upload the CSV file and review any validation errors
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">4</div>
            <div>
              <strong>Manual Approval:</strong> All uploaded nominees will be in draft status for manual approval in the nominations tab
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">5</div>
            <div>
              <strong>Loops Sync:</strong> Approved nominees will automatically sync to Loops for email campaigns
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}