"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, X, ExternalLink, User, Building2, Save, Loader2 } from "lucide-react";

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
  
  // Form state
  const [whyText, setWhyText] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Initialize form data when nomination changes
  useEffect(() => {
    if (nomination) {
      setWhyText(nomination.whyMe || nomination.whyUs || "");
      setLiveUrl(nomination.liveUrl || "");
      setLinkedin(nomination.linkedin || nomination.personLinkedin || nomination.companyLinkedin || "");
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

  if (!nomination) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {nomination.type === 'person' ? (
              <User className="h-5 w-5" />
            ) : (
              <Building2 className="h-5 w-5" />
            )}
            Edit Nomination Details
          </DialogTitle>
          <DialogDescription>
            Update information for {nomination.displayName || 'this nomination'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="content">Content & Media</TabsTrigger>
            <TabsTrigger value="admin">Admin Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            {/* Nominee Overview */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                Nominee Overview
                <Badge variant={nomination.type === 'person' ? 'default' : 'secondary'}>
                  {nomination.type === 'person' ? 'Individual' : 'Company'}
                </Badge>
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Name:</strong> {nomination.displayName}</p>
                  <p><strong>Category:</strong> {nomination.subcategory_id || nomination.subcategoryId}</p>
                  <p><strong>Status:</strong> 
                    <Badge 
                      variant={nomination.state === 'approved' ? 'default' : nomination.state === 'rejected' ? 'destructive' : 'secondary'}
                      className="ml-2"
                    >
                      {nomination.state}
                    </Badge>
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
              <Label htmlFor="linkedin" className="text-sm font-medium">
                LinkedIn Profile URL
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="linkedin"
                  type="url"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="flex-1"
                />
                {linkedin && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 px-3"
                    onClick={() => window.open(linkedin, '_blank', 'noopener,noreferrer')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                LinkedIn profile URL for this {nomination.type}
              </p>
            </div>

            {/* Live URL */}
            <div>
              <Label htmlFor="liveUrl" className="text-sm font-medium">
                Live URL (Optional)
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="liveUrl"
                  type="url"
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="flex-1"
                />
                {liveUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 px-3"
                    onClick={() => window.open(liveUrl, '_blank', 'noopener,noreferrer')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                URL where voters can learn more about this nomination
              </p>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            {/* Image Upload Section */}
            <div>
              <Label className="text-sm font-medium">
                {nomination.type === 'person' ? 'Headshot' : 'Company Logo'}
              </Label>
              
              <div className="mt-2">
                {currentImage ? (
                  <div className="relative inline-block">
                    <img
                      src={currentImage}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={removeImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
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

              <div className="mt-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload a new {nomination.type === 'person' ? 'headshot' : 'logo'} (JPG, PNG, max 5MB)
                </p>
              </div>
            </div>

            {/* Why Vote Text */}
            <div>
              <Label htmlFor="whyText" className="text-sm font-medium">
                {nomination.type === 'person' ? 'Why vote for this person?' : 'Why vote for this company?'}
              </Label>
              <Textarea
                id="whyText"
                value={whyText}
                onChange={(e) => setWhyText(e.target.value)}
                placeholder={`Explain why this ${nomination.type} deserves to win...`}
                className="mt-2 min-h-[120px]"
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {whyText.length}/1000 characters
              </p>
            </div>
          </TabsContent>

          <TabsContent value="admin" className="space-y-6">
            {/* Admin Notes */}
            <div>
              <Label htmlFor="adminNotes" className="text-sm font-medium">
                Admin Notes (Internal)
              </Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal notes about this nomination..."
                className="mt-2 min-h-[100px]"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {adminNotes.length}/500 characters - Only visible to admins
              </p>
            </div>

            {/* Rejection Reason */}
            <div>
              <Label htmlFor="rejectionReason" className="text-sm font-medium">
                Rejection Reason (If Applicable)
              </Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for rejection (if nomination was rejected)..."
                className="mt-2 min-h-[100px]"
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
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}