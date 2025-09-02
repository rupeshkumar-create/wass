import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

/**
 * Generate a slug from a name
 */
function generateSlug(name: string): string {
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
 */
function getBaseUrl(request: NextRequest): string {
  // Always use localhost for development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  // Check for Vercel environment
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Check for custom domain
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  // Use the request host
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  
  if (host) {
    return `${protocol}://${host}`;
  }
  
  // Fallback to localhost
  return 'http://localhost:3000';
}

export async function POST(request: NextRequest) {
  try {
    const { nominationId } = await request.json();

    if (!nominationId) {
      return NextResponse.json(
        { success: false, error: 'Nomination ID is required' },
        { status: 400 }
      );
    }

    // Fetch the nomination details
    const { data: nomination, error: fetchError } = await supabase
      .from('nominations')
      .select('*')
      .eq('id', nominationId)
      .single();

    if (fetchError || !nomination) {
      return NextResponse.json(
        { success: false, error: 'Nomination not found' },
        { status: 404 }
      );
    }

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

    // Generate the Live URL
    const baseUrl = getBaseUrl(request);
    const slug = generateSlug(displayName);
    const liveUrl = `${baseUrl}/nominee/${slug}`;

    // Update the nomination with the generated URL
    const { error: updateError } = await supabase
      .from('nominations')
      .update({ 
        liveUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', nominationId);

    if (updateError) {
      console.error('Error updating nomination with Live URL:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update nomination' },
        { status: 500 }
      );
    }

    // Sync with Loops if the nomination is approved
    if (nomination.state === 'approved') {
      try {
        await fetch(`${baseUrl}/api/sync/loops/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nominationId })
        });
      } catch (syncError) {
        console.error('Error syncing with Loops:', syncError);
        // Don't fail the main operation if sync fails
      }
    }

    return NextResponse.json({
      success: true,
      liveUrl,
      message: 'Live URL generated successfully'
    });

  } catch (error) {
    console.error('Error generating Live URL:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}