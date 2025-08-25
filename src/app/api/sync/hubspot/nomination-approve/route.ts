import { NextRequest, NextResponse } from 'next/server';
import { syncNominationApprove } from '@/server/hubspot/sync';
import { z } from 'zod';

// Validation schema
const NominationApproveSyncSchema = z.object({
  nominee: z.object({
    id: z.string(),
    name: z.string().min(1),
    type: z.enum(['person', 'company']),
    email: z.string().email().optional(),
    linkedin: z.string().url(),
  }),
  nominator: z.object({
    email: z.string().email(),
  }),
  liveUrl: z.string().url(),
  categoryGroupId: z.string().min(1),
  subcategoryId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = NominationApproveSyncSchema.parse(body);
    
    console.log('Starting HubSpot nomination approve sync for:', {
      nominee: validatedData.nominee.name,
      nominator: validatedData.nominator.email,
      liveUrl: validatedData.liveUrl,
    });

    // Sync to HubSpot
    const result = await syncNominationApprove(validatedData);
    
    if (result.success) {
      console.log('HubSpot nomination approve sync completed successfully');
      return NextResponse.json({
        success: true,
      });
    } else {
      console.error('HubSpot nomination approve sync failed:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Nomination approve sync API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}