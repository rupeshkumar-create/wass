"use client";

import { useState } from "react";
import { X, CheckCircle, XCircle, ExternalLink, Loader2 } from "lucide-react";

interface ApprovalDialogProps {
  nomination: any;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (liveUrl: string, adminNotes?: string) => Promise<void>;
  onReject: (rejectionReason: string, adminNotes?: string) => Promise<void>;
}

export function ApprovalDialog({ nomination, isOpen, onClose, onApprove, onReject }: ApprovalDialogProps) {
  const generateLiveUrl = () => {
    if (!nomination) return "";
    
    // Generate display name
    const displayName = nomination.displayName || 
      (nomination.type === 'person' 
        ? `${nomination.firstname || ''} ${nomination.lastname || ''}`.trim()
        : nomination.companyName || nomination.company_name || 'nominee');
    
    // Create a slug from the display name
    const slug = displayName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
    
    // Use localhost for development, production URL for production
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'http://localhost:3000';
    
    return `${baseUrl}/nominee/${slug}`;
  };

  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [liveUrl, setLiveUrl] = useState(() => {
    // Auto-generate URL on component mount
    return nomination?.liveUrl || generateLiveUrl();
  });
  const [adminNotes, setAdminNotes] = useState(nomination?.adminNotes || "");
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = async () => {
    if (!liveUrl.trim()) {
      alert("Please provide a live URL for the approved nominee");
      return;
    }

    setLoading(true);
    try {
      await onApprove(liveUrl.trim(), adminNotes.trim() || undefined);
      onClose();
    } catch (error) {
      console.error('Error approving nomination:', error);
      alert('Failed to approve nomination: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    setLoading(true);
    try {
      await onReject(rejectionReason.trim(), adminNotes.trim() || undefined);
      onClose();
    } catch (error) {
      console.error('Error rejecting nomination:', error);
      alert('Failed to reject nomination: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleAutoGenerateUrl = () => {
    const generatedUrl = generateLiveUrl();
    setLiveUrl(generatedUrl);
  };

  if (!nomination || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold">
              {action === 'approve' ? 'Approve Nomination' : action === 'reject' ? 'Reject Nomination' : 'Review Nomination'}
            </h2>
            <p className="text-sm text-gray-500">
              {nomination.displayName} • {nomination.subcategory_id}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
            disabled={loading}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!action && (
            <div className="space-y-6">
              {/* Nominee Overview */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Nominee Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Name:</strong> {nomination.displayName}</p>
                    <p><strong>Type:</strong> {nomination.type === 'person' ? 'Individual' : 'Company'}</p>
                    <p><strong>Category:</strong> {nomination.subcategory_id}</p>
                  </div>
                  <div>
                    <p><strong>Votes:</strong> {nomination.votes || 0}</p>
                    <p><strong>Status:</strong> {nomination.state}</p>
                    <p><strong>Created:</strong> {new Date(nomination.created_at || nomination.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Action Selection */}
              <div className="space-y-4">
                <h4 className="font-medium">Choose Action</h4>
                <div className="flex gap-4">
                  <button
                    onClick={() => setAction('approve')}
                    className="flex-1 p-4 border-2 border-orange-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
                  >
                    <CheckCircle className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                    <div className="text-center">
                      <div className="font-medium text-orange-800">Approve</div>
                      <div className="text-sm text-orange-600">Accept this nomination</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setAction('reject')}
                    className="flex-1 p-4 border-2 border-red-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors"
                  >
                    <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                    <div className="text-center">
                      <div className="font-medium text-red-800">Reject</div>
                      <div className="text-sm text-red-600">Decline this nomination</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {action === 'approve' && (
            <div className="space-y-6">
              {/* Live URL Assignment */}
              <div>
                <label htmlFor="liveUrl" className="block text-sm font-medium mb-2">
                  Live URL (Auto-Generated)
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      id="liveUrl"
                      type="text"
                      value={liveUrl}
                      onChange={(e) => setLiveUrl(e.target.value)}
                      placeholder="Auto-generated based on nominee name"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => setLiveUrl(generateLiveUrl())}
                      className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                      title="Regenerate URL"
                    >
                      🔄
                    </button>
                    {liveUrl && (
                      <button
                        type="button"
                        onClick={() => window.open(liveUrl, '_blank', 'noopener,noreferrer')}
                        className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                        title="Preview URL"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  🤖 Live URL is automatically generated based on the nominee's name. This URL will be shown to voters and used in notifications.
                </p>
              </div>

              {/* Admin Notes */}
              <div>
                <label htmlFor="adminNotes" className="block text-sm font-medium mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal notes about this approval..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[80px]"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {adminNotes.length}/500 characters - Internal use only
                </p>
              </div>

              {/* Approval Summary */}
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="font-medium text-orange-800 mb-2">Approval Summary</h4>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• Nominee will be marked as approved</li>
                  <li>• Live URL: {liveUrl ? (
                    <code className="bg-orange-100 px-1 rounded">{liveUrl}</code>
                  ) : (
                    <span className="text-orange-600 font-medium">🤖 Will be auto-generated</span>
                  )}</li>
                  <li>• Nominator will be notified via email</li>
                  <li>• Nominee will be synced to HubSpot and Loops</li>
                  <li>• Nominee will appear in the public directory</li>
                </ul>
              </div>
            </div>
          )}

          {action === 'reject' && (
            <div className="space-y-6">
              {/* Rejection Reason */}
              <div>
                <label htmlFor="rejectionReason" className="block text-sm font-medium mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a clear reason for rejection..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[100px]"
                  maxLength={500}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {rejectionReason.length}/500 characters - This will be sent to the nominator
                </p>
              </div>

              {/* Admin Notes */}
              <div>
                <label htmlFor="adminNotes" className="block text-sm font-medium mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal notes about this rejection..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[80px]"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {adminNotes.length}/500 characters - Internal use only
                </p>
              </div>

              {/* Rejection Summary */}
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 className="font-medium text-red-800 mb-2">Rejection Summary</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Nominee will be marked as rejected</li>
                  <li>• Nominator will be notified with the rejection reason</li>
                  <li>• Nominee will not appear in the public directory</li>
                  <li>• No further action will be taken</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between gap-3 p-6 border-t bg-gray-50">
          {action ? (
            <>
              <button
                type="button"
                onClick={() => setAction(null)}
                disabled={loading}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Back
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                {action === 'approve' ? (
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={loading || !liveUrl.trim()}
                    className="px-6 py-3 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Approve Nomination
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={loading || !rejectionReason.trim()}
                    className="px-6 py-3 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4" />
                        Reject Nomination
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex justify-end w-full">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}