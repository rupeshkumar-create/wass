import { InvalidLinkedInError } from "./errors";

export function normalizeLinkedIn(url: string): string {
  try {
    // Trim and clean input
    let cleanUrl = url.trim();
    
    // Handle common input variations
    if (!cleanUrl.startsWith('http')) {
      // Add protocol if missing
      if (cleanUrl.startsWith('linkedin.com') || cleanUrl.startsWith('www.linkedin.com')) {
        cleanUrl = `https://${cleanUrl}`;
      } else if (cleanUrl.includes('linkedin.com')) {
        cleanUrl = `https://${cleanUrl}`;
      } else {
        // Assume it's a partial LinkedIn URL
        cleanUrl = `https://www.linkedin.com/${cleanUrl.replace(/^\/+/, '')}`;
      }
    }
    
    const urlObj = new URL(cleanUrl);
    
    // Ensure it's a LinkedIn URL
    const hostname = urlObj.hostname.toLowerCase();
    if (!hostname.includes('linkedin.com')) {
      throw new InvalidLinkedInError('URL must be from linkedin.com');
    }
    
    // Normalize hostname to www.linkedin.com
    urlObj.hostname = 'www.linkedin.com';
    urlObj.protocol = 'https:';
    
    // Normalize pathname
    let pathname = urlObj.pathname.toLowerCase();
    
    // Remove trailing slash
    pathname = pathname.replace(/\/$/, '');
    
    // Ensure it's a valid profile or company page
    if (!pathname.startsWith('/in/') && !pathname.startsWith('/company/')) {
      throw new InvalidLinkedInError('LinkedIn URL must be a profile (/in/) or company (/company/) page');
    }
    
    // Remove query parameters and fragments
    return `https://www.linkedin.com${pathname}`;
    
  } catch (error) {
    if (error instanceof InvalidLinkedInError) {
      throw error;
    }
    throw new InvalidLinkedInError(`Invalid LinkedIn URL format: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function extractLinkedInSlug(url: string): string {
  try {
    const normalizedUrl = normalizeLinkedIn(url);
    const urlObj = new URL(normalizedUrl);
    const pathname = urlObj.pathname;
    const segments = pathname.split("/").filter(Boolean);
    return segments[segments.length - 1] || "unknown";
  } catch {
    return "unknown";
  }
}

export function buildUniqueKey(category: string, linkedinUrl: string): string {
  const normalizedUrl = normalizeLinkedIn(linkedinUrl);
  return `${category.toLowerCase()}__${normalizedUrl}`;
}