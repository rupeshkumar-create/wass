"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface EditWhyVoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nomination: {
    id: string;
    nominee: {
      name: string;
    };
    whyVoteForMe?: string;
  };
  onSave: (nominationId: string, whyVote: string) => Promise<void>;
}

export function EditWhyVoteDialog({ open, onOpenChange, nomination, onSave }: EditWhyVoteDialogProps) {
  const [whyVote, setWhyVote] = useState(nomination.whyVoteForMe || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    
    if (whyVote.trim().length === 0) {
      setError("Please provide a reason why someone should vote for this nominee");
      return;
    }
    
    if (whyVote.length > 1000) {
      setError("Please keep your response under 1000 characters");
      return;
    }

    setLoading(true);
    try {
      await onSave(nomination.id, whyVote.trim());
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setLoading(false);
    }
  };

  const remainingChars = 1000 - whyVote.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit "Why Vote" for {nomination.nominee.name}</DialogTitle>
          <DialogDescription>
            This text will be displayed on their public profile page to help voters understand why they should vote for this nominee.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="whyVote">Why should someone vote for this nominee?</Label>
            <Textarea
              id="whyVote"
              placeholder="Describe their achievements, impact, leadership qualities, or what sets them apart in the staffing industry..."
              value={whyVote}
              onChange={(e) => setWhyVote(e.target.value)}
              className="min-h-[120px] resize-none mt-2"
              maxLength={1000}
            />
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-muted-foreground">
                This will be displayed on their profile page
              </span>
              <span className={`${remainingChars < 50 ? 'text-orange-600' : remainingChars < 10 ? 'text-red-600' : 'text-muted-foreground'}`}>
                {remainingChars} characters remaining
              </span>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}