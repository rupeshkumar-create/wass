"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Check, X, ExternalLink, User, Building, Camera } from "lucide-react";
import { Nomination } from "@/lib/types";
import { ConflictDialog } from "./ConflictDialog";
import { EditWhyVoteDialog } from "./EditWhyVoteDialog";
import { PhotoManagementDialog } from "@/components/admin/PhotoManagementDialog";
import { getNomineeImage } from "@/lib/nominee-image";

interface NominationsTableProps {
  nominations: Nomination[];
  onUpdateStatus: (id: string, status: "approved" | "rejected") => Promise<any>;
  onUpdateWhyVote?: (id: string, whyVote: string) => Promise<void>;
  onPhotoUpdated?: (nominationId: string, imageUrl: string | null) => void;
}

export function NominationsTable({ nominations, onUpdateStatus, onUpdateWhyVote, onPhotoUpdated }: NominationsTableProps) {
  const [updating, setUpdating] = useState<string | null>(null);

  const [conflictDialog, setConflictDialog] = useState<{
    open: boolean;
    nominationId: string;
    nomineeName: string;
    conflictData: any;
  }>({ open: false, nominationId: "", nomineeName: "", conflictData: null });

  const [editWhyVoteDialog, setEditWhyVoteDialog] = useState<{
    open: boolean;
    nomination: Nomination | null;
  }>({ open: false, nomination: null });

  const [photoDialog, setPhotoDialog] = useState<{
    open: boolean;
    nomination: Nomination | null;
  }>({ open: false, nomination: null });

  const handleStatusUpdate = async (id: string, status: "approved" | "rejected") => {
    setUpdating(id);
    try {
      const result = await onUpdateStatus(id, status);
      
      // Handle conflict response
      if (result && result.conflict) {
        const nomination = nominations.find(n => n.id === id);
        setConflictDialog({
          open: true,
          nominationId: id,
          nomineeName: nomination?.nominee.name || "Unknown",
          conflictData: result
        });
      }
    } finally {
      setUpdating(null);
    }
  };

  const handleRejectCurrent = async () => {
    if (conflictDialog.nominationId) {
      await onUpdateStatus(conflictDialog.nominationId, "rejected");
    }
    setConflictDialog({ open: false, nominationId: "", nomineeName: "", conflictData: null });
  };

  const handleViewExisting = () => {
    if (conflictDialog.conflictData?.liveUrl) {
      window.open(conflictDialog.conflictData.liveUrl, "_blank");
    }
    setConflictDialog({ open: false, nominationId: "", nomineeName: "", conflictData: null });
  };



  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nominee</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Nominator</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nominations.map((nomination) => (
            <TableRow key={nomination.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    {(() => {
                      const imageData = getNomineeImage(nomination);
                      return imageData.isInitials ? (
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                          {nomination.nominee.name
                            .split(" ")
                            .map(n => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      ) : (
                        <AvatarImage 
                          src={imageData.src}
                          alt={imageData.alt}
                        />
                      );
                    })()}
                  </Avatar>
                  <div>
                    <div className="font-medium">{nomination.nominee.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {nomination.type === "person" && "title" in nomination.nominee && nomination.nominee.title
                        ? nomination.nominee.title
                        : nomination.type === "company" && "website" in nomination.nominee
                        ? nomination.nominee.website
                        : ""}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-[200px]">
                  <div className="truncate">{nomination.category}</div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={nomination.type === "person" ? "default" : "secondary"}>
                  {nomination.type}
                </Badge>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{nomination.nominator.name}</div>
                  <div className="text-sm text-muted-foreground">{nomination.nominator.email}</div>
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={
                    nomination.status === "approved" 
                      ? "default" 
                      : nomination.status === "rejected" 
                      ? "destructive" 
                      : "secondary"
                  }
                >
                  {nomination.status}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(nomination.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="h-8 w-8 p-0"
                      disabled={updating === nomination.id}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {nomination.status !== "approved" && (
                      <DropdownMenuItem
                        onClick={() => handleStatusUpdate(nomination.id, "approved")}
                        className="text-green-600"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                      </DropdownMenuItem>
                    )}
                    {nomination.status !== "rejected" && (
                      <DropdownMenuItem
                        onClick={() => handleStatusUpdate(nomination.id, "rejected")}
                        className="text-red-600"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <a 
                        href={nomination.liveUrl.startsWith('/') ? nomination.liveUrl : `/nominee/${nomination.liveUrl}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Profile
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a 
                        href={nomination.nominee.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        LinkedIn
                      </a>
                    </DropdownMenuItem>
                    {onUpdateWhyVote && (
                      <DropdownMenuItem
                        onClick={() => setEditWhyVoteDialog({ open: true, nomination })}
                        className="flex items-center"
                      >
                        <User className="mr-2 h-4 w-4" />
                        Edit Why Vote
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => setPhotoDialog({ open: true, nomination })}
                      className="flex items-center"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Manage Photo
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {nominations.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No nominations found
        </div>
      )}
      
      <ConflictDialog
        open={conflictDialog.open}
        onOpenChange={(open) => setConflictDialog(prev => ({ ...prev, open }))}
        conflictData={conflictDialog.conflictData}
        currentNomineeName={conflictDialog.nomineeName}
        onRejectCurrent={handleRejectCurrent}
        onViewExisting={handleViewExisting}
      />

      {editWhyVoteDialog.nomination && (
        <EditWhyVoteDialog
          open={editWhyVoteDialog.open}
          onOpenChange={(open) => setEditWhyVoteDialog(prev => ({ ...prev, open }))}
          nomination={editWhyVoteDialog.nomination}
          onSave={async (nominationId, whyVote) => {
            if (onUpdateWhyVote) {
              await onUpdateWhyVote(nominationId, whyVote);
            }
          }}
        />
      )}

      <PhotoManagementDialog
        open={photoDialog.open}
        onOpenChange={(open) => setPhotoDialog(prev => ({ ...prev, open }))}
        nomination={photoDialog.nomination}
        onPhotoUpdated={(nominationId, imageUrl) => {
          if (onPhotoUpdated) {
            onPhotoUpdated(nominationId, imageUrl);
          }
        }}
      />
    </div>
  );
}