"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, X, User, Loader2 } from "lucide-react";
import { MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES } from "@/lib/constants";

interface Step6PersonHeadshotProps {
  imageUrl: string;
  personName: string; // For generating slug
  onNext: (imageUrl: string) => void;
  onBack: () => void;
}

export function Step6PersonHeadshot({ imageUrl, personName, onNext, onBack }: Step6PersonHeadshotProps) {
  const [preview, setPreview] = useState<string>(imageUrl);
  const [uploadedUrl, setUploadedUrl] = useState<string>(imageUrl);
  const [error, setError] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  // Generate slug-safe path
  const generateSlug = (name: string) => {
    if (!name || typeof name !== 'string') {
      return 'nominee-' + Date.now();
    }
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Collapse multiple hyphens
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      || 'nominee-' + Date.now(); // Fallback if empty after processing
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Upload JPG, PNG, or SVG only");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError("Max 5MB");
      return;
    }

    // Store file reference
    fileRef.current = file;

    // Create stable preview URL
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    previewUrlRef.current = URL.createObjectURL(file);
    setPreview(previewUrlRef.current);

    // Upload to server in background
    setUploading(true);
    try {
      const slug = generateSlug(personName);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', 'headshot');
      formData.append('slug', slug);

      const response = await fetch('/api/uploads/image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadedUrl(result.url);
      // Keep preview URL until component unmounts or new file selected
      // Don't switch to uploaded URL to maintain stable preview
    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed');
      // Keep preview on error - user can try again
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    fileRef.current = null;
    setPreview("");
    setUploadedUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const handleNext = () => {
    if (!uploadedUrl) {
      setError("Professional headshot is required to continue");
      return;
    }
    onNext(uploadedUrl);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Professional Headshot *</CardTitle>
        <CardDescription>
          Upload a professional headshot of the nominee (required)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label htmlFor="headshot">Headshot Image *</Label>
          
          {preview ? (
            <div className="relative">
              <div className="w-48 h-48 mx-auto rounded-lg overflow-hidden border">
                <img 
                  src={preview} 
                  alt="Headshot preview" 
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or SVG (max {MAX_FILE_SIZE / (1024 * 1024)}MB)
                  </p>
                </div>
              </div>
            </div>
          )}

          <Input
            ref={fileInputRef}
            id="headshot"
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            onChange={handleFileSelect}
            className="cursor-pointer"
            disabled={uploading}
          />
          
          {uploading && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading image...
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Image Guidelines</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Use a professional, high-quality headshot</li>
            <li>• Face should be clearly visible and well-lit</li>
            <li>• Avoid group photos or casual images</li>
            <li>• Square or portrait orientation works best</li>
          </ul>
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button 
            onClick={handleNext} 
            disabled={!uploadedUrl || uploading}
            className="relative"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}