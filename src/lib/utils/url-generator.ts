/**
 * Utility functions for generating Live URLs for nominees
 */

/**
 * Generate a slug from a name (person or company)
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Get the base URL for the application
 * Works with both localhost and Vercel deployment
 */
export function getBaseUrl(): string {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Always use localhost for development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  // Server-side: Check for Vercel environment
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Check for custom domain
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  // Fallback to localhost
  return 'http://localhost:3000';
}

/**
 * Generate a Live URL for a nominee
 */
export function generateLiveUrl(nomination: any): string {
  const baseUrl = getBaseUrl();
  
  // Generate display name
  let displayName = '';
  if (nomination.type === 'person') {
    displayName = `${nomination.firstname || ''} ${nomination.lastname || ''}`.trim();
  } else {
    displayName = nomination.companyName || nomination.company_name || '';
  }
  
  if (!displayName) {
    displayName = `nominee-${nomination.id}`;
  }
  
  const slug = generateSlug(displayName);
  return `${baseUrl}/nominee/${slug}`;
}

/**
 * Generate and update Live URL for a nomination
 * This function can be called when approving nominations or editing them
 */
export async function generateAndUpdateLiveUrl(nominationId: string): Promise<string> {
  try {
    // Fetch the nomination details
    const response = await fetch(`/api/admin/nominations/${nominationId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch nomination details');
    }
    
    const nomination = await response.json();
    const liveUrl = generateLiveUrl(nomination);
    
    // Update the nomination with the generated URL
    const updateResponse = await fetch('/api/admin/nominations', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nominationId,
        updates: { liveUrl }
      })
    });
    
    if (!updateResponse.ok) {
      throw new Error('Failed to update nomination with Live URL');
    }
    
    return liveUrl;
  } catch (error) {
    console.error('Error generating Live URL:', error);
    throw error;
  }
}

/**
 * Validate if a URL is properly formatted
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}