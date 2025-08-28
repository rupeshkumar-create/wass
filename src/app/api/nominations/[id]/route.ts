import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase/service';
import { z } from 'zod';

const UpdateStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
  moderatorNote: z.string().optional()
});

/**
 * GET /api/nominations/[id] - Get nomination by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const nomination = await supabaseService.getNomination(params.id);

    if (!nomination) {
      return NextResponse.json(
        { success: false, error: 'Nomination not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: nomination
    });

  } catch (error) {
    console.error(`GET /api/nominations/${params.id} error:`, error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get nomination'
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/nominations/[id] - Update nomination status (moderation)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = UpdateStatusSchema.parse(body);

    console.log('Updating nomination status:', {
      id: params.id,
      status: validatedData.status,
      moderatorNote: validatedData.moderatorNote
    });

    const nomination = await supabaseService.updateNominationStatus(
      params.id,
      validatedData.status,
      validatedData.moderatorNote
    );

    console.log('Nomination status updated successfully:', nomination.id);

    return NextResponse.json({
      success: true,
      data: nomination
    });

  } catch (error) {
    console.error(`PATCH /api/nominations/${params.id} error:`, error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid update data',
          details: error.issues
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update nomination'
      },
      { status: 500 }
    );
  }
}