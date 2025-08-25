"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Linkedin, Twitter, Copy, Check } from "lucide-react";

interface ShareButtonsProps {
  nomineeName: string;
  liveUrl: string;
  className?: string;
}

export function ShareButtons({ nomineeName, liveUrl, className = "" }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  
  // Construct the full URL properly
  const fullUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/nominee/${liveUrl}` 
    : `/nominee/${liveUrl}`;
  
  const shareText = `Vote for ${nomineeName} in World Staffing Awards 2026`;
  const shareBody = `Check out this nominee and cast your vote: ${fullUrl} #WorldStaffingAwards`;

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Vote for ${nomineeName} - World Staffing Awards 2026`);
    const body = encodeURIComponent(`I wanted to share this nominee with you for the World Staffing Awards 2026.\n\n${nomineeName} is nominated and you can cast your vote here:\n${fullUrl}\n\n#WorldStaffingAwards`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleLinkedInShare = () => {
    const url = encodeURIComponent(fullUrl);
    const text = encodeURIComponent(`${shareText} - Cast your vote now!`);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${text}`, '_blank');
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(shareBody);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(fullUrl);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = fullUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Still show success message as fallback might have worked
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="font-medium text-sm">Share this nomination:</h4>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleEmailShare}
          className="flex items-center gap-2"
        >
          <Mail className="h-4 w-4" />
          Email
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleLinkedInShare}
          className="flex items-center gap-2"
        >
          <Linkedin className="h-4 w-4" />
          LinkedIn
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleTwitterShare}
          className="flex items-center gap-2"
        >
          <Twitter className="h-4 w-4" />
          Twitter
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="flex items-center gap-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy Link
            </>
          )}
        </Button>
      </div>
    </div>
  );
}