import { z } from 'zod';

// Helper function to normalize LinkedIn URLs for people
const normalizePersonLinkedIn = (url: string) => {
  if (!url) return url;
  
  const cleanUrl = url.trim().toLowerCase();
  
  // Person LinkedIn should be /in/username
  if (cleanUrl.includes('/in/')) {
    return cleanUrl;
  }
  
  // Try to extract username and format properly
  const match = cleanUrl.match(/linkedin\.com\/(?:in\/)?([^\/\?]+)/);
  if (match) {
    return `https://linkedin.com/in/${match[1]}`;
  }
  
  return url;
};

// Vote schema
export const VoteSchema = z.object({
  email: z.string().email().transform(email => email.toLowerCase()),
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  linkedin: z.string().min(1).transform(url => normalizePersonLinkedIn(url)),
  subcategoryId: z.string().min(1),
  votedForDisplayName: z.string().min(1)
});

// Types
export type VoteInput = z.infer<typeof VoteSchema>;