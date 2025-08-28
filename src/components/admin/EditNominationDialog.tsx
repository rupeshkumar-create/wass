"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X } from "lucide-react";

interface EditNominationDialogProps {
  nomination: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: any) => Promise<void>;
}

export function EditNominationDialog({ nomination, isOpen, onClose, onSave }: EditNominationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [whyText, setWhyText] = useState(nomination?.whyMe || nomination?.whyUs || "");
  const [liveUrl, setLiveUrl] = useState(nomination?.liveUrl || "");

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
        liveUrl: liveUrl.trim()
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
      alert('Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  const currentImage = imagePreview || nomination?.imageUrl;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Nomination</DialogTitle>
          <DialogDescription>
            Update the {nomination?.type === 'person' ? 'headshot' : 'logo'} and details for {nomination?.displayName || 'this nomination'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Upload Section */}
          <div>
            <Label className="text-sm font-medium">
              {nomination?.type === 'person' ? 'Headshot' : 'Company Logo'}
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
                Upload a new {nomination?.type === 'person' ? 'headshot' : 'logo'} (JPG, PNG, max 5MB)
              </p>
            </div>
          </div>

          {/* Why Vote Text */}
          <div>
            <Label htmlFor="whyText" className="text-sm font-medium">
              {nomination?.type === 'person' ? 'Why vote for this person?' : 'Why vote for this company?'}
            </Label>
            <Textarea
              id="whyText"
              value={whyText}
              onChange={(e) => setWhyText(e.target.value)}
              placeholder={`Explain why this ${nomination?.type} deserves to win...`}
              className="mt-2 min-h-[120px]"
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {whyText.length}/1000 characters
            </p>
          </div>

          {/* Live URL */}
          <div>
            <Label htmlFor="liveUrl" className="text-sm font-medium">
              Live URL (Optional)
            </Label>
            <Input
              id="liveUrl"
              type="url"
              value={liveUrl}
              onChange={(e) => setLiveUrl(e.target.value)}
              placeholder="https://example.com"
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              URL where voters can learn more about this nomination
            </p>
          </div>

          {/* Current Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Current Details</h4>
            <div className="text-sm space-y-1">
              <p><strong>Name:</strong> {nomination?.displayName}</p>
              <p><strong>Type:</strong> {nomination?.type}</p>
              <p><strong>Category:</strong> {nomination?.subcategory_id}</p>
              <p><strong>Status:</strong> {nomination?.state}</p>
              <p><strong>Votes:</strong> {nomination?.votes || 0}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}