import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/bulk-upload/batches - Get recent upload batches
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication is now handled by middleware

    const { data: batches, error } = await supabase
      .from('bulk_upload_batches')
      .select('*')
      .order('uploaded_at', { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: batches
    });

  } catch (error) {
    console.error('Error fetching batches:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch batches' 
      },
      { status: 500 }
    );
  }
}