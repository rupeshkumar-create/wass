"use client";

import { useState, useEffect } from "react";
import { X, ExternalLink, User, Building2, Save, Loader2, Upload } from "lucide-react";

interface EnhancedEditDialogProps {
  nomination: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: any) => Promise<void>;
}

export function EnhancedEditDialog({ nomination, isOpen, onClose, onSave }: EnhancedEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  
  // Form state
  const [whyText, setWhyText] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Initialize form data when nomination changes
  useEffect(() => {
    if (nomination) {
      setActiveTab("basic");
      setWhyText(nomination.whyMe || nomination.whyUs || "");
      setLiveUrl(nomination.liveUrl || "");
      // Get LinkedIn URL from various possible fields
      const linkedinUrl = nomination.linkedin || 
                         nomination.personLinkedin || 
                         nomination.companyLinkedin ||
                         nomination.nominee?.linkedin ||
                         nomination.nominee?.personLinkedin ||
                         nomination.nominee?.companyLinkedin ||
                         "";
      setLinkedin(linkedinUrl);
      setAdminNotes(nomination.adminNotes || "");
      setRejectionReason(nomination.rejectionReason || "");
      setImagePreview(null);
      setImageFile(null);
    }
  }, [nomination]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updates: any = {
        liveUrl: liveUrl.trim(),
        linkedin: linkedin.trim(),
        adminNotes: adminNotes.trim(),
        rejectionReason: rejectionReason.trim()
      };

      // Update why text based on nomination type
      if (nomination.type === 'person') {
        updates.whyMe = whyText.trim();
      } else {
        updates.whyUs = whyText.trim();
      }

      // Handle image upload if there's a new image
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('nominationId', nomination.id);
        formData.append('type', nomination.type);

        const uploadResponse = await fetch('/api/uploads/image', {
          method: 'POST',
          body: formData
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          if (nomination.type === 'person') {
            updates.headshotUrl = uploadResult.url;
          } else {
            updates.logoUrl = uploadResult.url;
          }
        } else {
          throw new Error('Failed to upload image');
        }
      }

      await onSave(updates);
      onClose();
    } catch (error) {
      console.error('Error saving nomination:', error);
      alert('Failed to save changes: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const currentImage = imagePreview || nomination?.imageUrl;

  if (!nomination || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] min-h-[500px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            {nomination.type === 'person' ? (
              <User className="h-5 w-5" />
            ) : (
              <Building2 className="h-5 w-5" />
            )}
            <div>
              <h2 className="text-lg font-semibold">Edit Nomination Details</h2>
              <p className="text-sm text-gray-500">
                Update information for {nomination.displayName || 'this nomination'}
              </p>
            </div>
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

        {/* Tab Navigation */}
        <div className="border-b">
          <div className="flex">
            <button
              type="button"
              onClick={() => setActiveTab('basic')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'basic'
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Basic Info
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('content')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'content'
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Content & Media
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'admin'
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Admin Notes
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              {/* Nominee Overview */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  Nominee Overview
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    nomination.type === 'person' 
                      ? 'bg-brand-100 text-brand-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {nomination.type === 'person' ? 'Individual' : 'Company'}
                  </span>
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Name:</strong> {nomination.displayName}</p>
                    <p><strong>Category:</strong> {nomination.subcategory_id || nomination.subcategoryId}</p>
                    <p><strong>Status:</strong> 
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        nomination.state === 'approved' 
                          ? 'bg-green-100 text-green-800'
                          : nomination.state === 'rejected' 
                          ? 'bg-red-100 text-red-800'
                          : 'bg-brand-100 text-brand-800'
                      }`}>
                        {nomination.state}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p><strong>Votes:</strong> {nomination.votes || 0}</p>
                    <p><strong>Created:</strong> {new Date(nomination.createdAt || nomination.created_at).toLocaleDateString()}</p>
                    {nomination.type === 'person' && nomination.jobtitle && (
                      <p><strong>Job Title:</strong> {nomination.jobtitle}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* LinkedIn URL */}
              <div>
                <label htmlFor="linkedin" className="block text-sm font-medium mb-2">
                  LinkedIn Profile URL
                </label>
                <div className="flex gap-2">
                  <input
                    id="linkedin"
                    type="url"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {linkedin && (
                    <button
                      type="button"
                      onClick={() => window.open(linkedin, '_blank', 'noopener,noreferrer')}
                      className="px-3 py-2 border border-gray-300 rounded-md hover:bg-brand-50 hover:border-brand-300"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  LinkedIn profile URL for this {nomination.type}
                </p>
              </div>

              {/* Live URL */}
              <div>
                <label htmlFor="liveUrl" className="block text-sm font-medium mb-2">
                  Live URL (Auto-Generated)
                </label>
                <div className="flex gap-2">
                  <input
                    id="liveUrl"
                    type="url"
                    value={liveUrl}
                    onChange={(e) => setLiveUrl(e.target.value)}
                    placeholder="Auto-generated when nomination is approved"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50"
                    readOnly
                  />
                  {liveUrl && (
                    <button
                      type="button"
                      onClick={() => window.open(liveUrl, '_blank', 'noopener,noreferrer')}
                      className="px-3 py-2 border border-gray-300 rounded-md hover:bg-brand-50 hover:border-brand-300"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Live URL is automatically generated when the nomination is approved. Format: {typeof window !== 'undefined' ? window.location.origin : 'https://yoursite.com'}/nominee/nominee-name
                </p>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-6">
              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {nomination.type === 'person' ? 'Headshot' : 'Company Logo'}
                </label>
                
                <div className="mb-4">
                  {currentImage ? (
                    <div className="relative inline-block">
                      <img
                        src={currentImage}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center shadow-sm"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No image</p>
                      </div>
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload a new {nomination.type === 'person' ? 'headshot' : 'logo'} (JPG, PNG, max 5MB)
                </p>
              </div>

              {/* Why Vote Text */}
              <div>
                <label htmlFor="whyText" className="block text-sm font-medium mb-2">
                  {nomination.type === 'person' ? 'Why vote for this person?' : 'Why vote for this company?'}
                </label>
                <textarea
                  id="whyText"
                  value={whyText}
                  onChange={(e) => setWhyText(e.target.value)}
                  placeholder={`Explain why this ${nomination.type} deserves to win...`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[120px]"
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {whyText.length}/1000 characters
                </p>
              </div>
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="space-y-6">
              {/* Admin Notes */}
              <div>
                <label htmlFor="adminNotes" className="block text-sm font-medium mb-2">
                  Admin Notes (Internal)
                </label>
                <textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal notes about this nomination..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[100px]"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {adminNotes.length}/500 characters - Only visible to admins
                </p>
              </div>

              {/* Rejection Reason */}
              <div>
                <label htmlFor="rejectionReason" className="block text-sm font-medium mb-2">
                  Rejection Reason (If Applicable)
                </label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Reason for rejection (if nomination was rejected)..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[100px]"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {rejectionReason.length}/500 characters - Used for rejection notifications
                </p>
              </div>

              {/* Nominator Information */}
              {nomination.nominatorEmail && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Nominator Information</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Email:</strong> {nomination.nominatorEmail}</p>
                    {nomination.nominatorName && (
                      <p><strong>Name:</strong> {nomination.nominatorName}</p>
                    )}
                    {nomination.nominatorCompany && (
                      <p><strong>Company:</strong> {nomination.nominatorCompany}</p>
                    )}
                    {nomination.nominatorJobTitle && (
                      <p><strong>Job Title:</strong> {nomination.nominatorJobTitle}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 mt-auto flex-shrink-0 sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-3 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2 transition-colors shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}