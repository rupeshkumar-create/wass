"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, AlertTriangle } from "lucide-react";

interface ConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflictData: {
    reason?: string;
    existingId: string;
    existingStatus: string;
    liveUrl: string;
  } | null;
  currentNomineeName: string;
  onRejectCurrent: () => void;
  onViewExisting: () => void;
}

export function ConflictDialog({
  open,
  onOpenChange,
  conflictData,
  currentNomineeName,
  onRejectCurrent,
  onViewExisting,
}: ConflictDialogProps) {
  if (!conflictData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Duplicate Nomination Detected
          </DialogTitle>
          <DialogDescription>
            {conflictData.reason || "A nomination for this category with the same LinkedIn profile already exists."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              <strong>{currentNomineeName}</strong> cannot be approved because {
                conflictData.reason?.toLowerCase() || "another nomination with the same LinkedIn URL already exists for this category"
              }.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <p className="text-sm font-medium">Existing nomination:</p>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Status:</span> {conflictData.existingStatus}
              </p>
              <p className="text-sm">
                <span className="font-medium">ID:</span> {conflictData.existingId}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">What would you like to do?</p>
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                onClick={onViewExisting}
                className="justify-start"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Existing Nomination
              </Button>
              <Button 
                variant="destructive" 
                onClick={onRejectCurrent}
                className="justify-start"
              >
                Reject This Nomination
              </Button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}