import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/bulk-upload/batches/[id]/errors - Get errors for a specific batch
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication is now handled by middleware

    const { id: batchId } = await params;

    const { data: errors, error } = await supabase
      .from('bulk_upload_errors')
      .select('*')
      .eq('batch_id', batchId)
      .order('row_number', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: errors
    });

  } catch (error) {
    console.error('Error fetching batch errors:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch errors' 
      },
      { status: 500 }
    );
  }
}