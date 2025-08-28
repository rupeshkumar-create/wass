"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PhotoUpload } from "./PhotoUpload";
import { Nomination } from "@/lib/types";

interface PhotoManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nomination: Nomination | null;
  onPhotoUpdated: (nominationId: string, imageUrl: string | null) => void;
}

export function PhotoManagementDialog({
  open,
  onOpenChange,
  nomination,
  onPhotoUpdated,
}: PhotoManagementDialogProps) {
  const [updating, setUpdating] = useState(false);

  if (!nomination) return null;

  const handlePhotoUpdate = async (imageUrl: string | null) => {
    setUpdating(true);
    try {
      // Update the nomination via API
      const response = await fetch('/api/nomination/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: nomination.id,
          imageUrl: imageUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update photo');
      }

      // Notify parent component
      onPhotoUpdated(nomination.id, imageUrl);
      
      // Close dialog on successful update
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update photo:', error);
      throw error; // Let PhotoUpload component handle the error display
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Photo</DialogTitle>
          <DialogDescription>
            Update or remove the photo for <strong>{nomination.nominee.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <PhotoUpload
            currentImageUrl={nomination.imageUrl || nomination.nominee.imageUrl}
            nomineeName={nomination.nominee.name}
            onPhotoUpdate={handlePhotoUpdate}
            disabled={updating}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}