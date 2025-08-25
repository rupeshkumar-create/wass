"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, X, Camera } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PhotoUploadProps {
  currentImageUrl?: string;
  nomineeName: string;
  onPhotoUpdate: (imageUrl: string | null) => Promise<void>;
  disabled?: boolean;
}

export function PhotoUpload({ 
  currentImageUrl, 
  nomineeName, 
  onPhotoUpdate, 
  disabled = false 
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'photo');
      formData.append('name', nomineeName?.toLowerCase?.() || 'nominee');

      // Upload to your existing upload endpoint
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      if (result.success && result.url) {
        setPreviewUrl(result.url);
        await onPhotoUpdate(result.url);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async () => {
    setUploading(true);
    setError(null);
    
    try {
      setPreviewUrl(null);
      await onPhotoUpdate(null);
    } catch (err) {
      console.error('Photo removal error:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove photo');
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {/* Current Photo Preview */}
        <Avatar className="h-16 w-16">
          {previewUrl ? (
            <AvatarImage 
              src={previewUrl} 
              alt={`${nomineeName} photo`}
              className="object-cover"
            />
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg">
              {getInitials(nomineeName)}
            </AvatarFallback>
          )}
        </Avatar>

        {/* Upload Controls */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
              className="flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  {previewUrl ? 'Replace' : 'Upload'} Photo
                </>
              )}
            </Button>

            {previewUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemovePhoto}
                disabled={disabled || uploading}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
                Remove
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {previewUrl ? 'Photo uploaded' : 'No photo - showing initials'}
          </p>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Upload Guidelines */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Supported formats: JPG, PNG, GIF, WebP</p>
        <p>• Maximum size: 5MB</p>
        <p>• Recommended: Square images (1:1 ratio)</p>
      </div>
    </div>
  );
}