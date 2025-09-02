import { NextRequest, NextResponse } from 'next/server';
import { onApprove } from '@/server/hubspot/sync';
import { z } from 'zod';

// Validation schema
const NominationApproveSyncSchema = z.object({
  nominee: z.object({
    type: z.enum(['person', 'company']),
    displayName: z.string().min(1),
    email: z.string().email().optional(),
    domain: z.string().optional(),
    linkedin: z.string().url().optional(),
    imageUrl: z.string().url().optional(),
  }),
  nominator: z.object({
    email: z.string().email(),
  }),
  liveUrl: z.string().url(),
  categoryGroupId: z.string().min(1),
  subcategoryId: z.string().min(1),
  ticketId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = NominationApproveSyncSchema.parse(body);
    
    console.log('Starting HubSpot nomination approval sync for:', {
      nominee: validatedData.nominee.displayName,
      nominator: validatedData.nominator.email,
      liveUrl: validatedData.liveUrl,
    });

    // Sync to HubSpot using new sync system
    const result = await onApprove({
      nominee: {
        type: validatedData.nominee.type,
        displayName: validatedData.nominee.displayName,
        email: validatedData.nominee.email,
        domain: validatedData.nominee.domain,
        linkedin: validatedData.nominee.linkedin,
        imageUrl: validatedData.nominee.imageUrl,
      },
      nominator: {
        email: validatedData.nominator.email,
      },
      liveUrl: validatedData.liveUrl,
      categoryGroupId: validatedData.categoryGroupId,
      subcategoryId: validatedData.subcategoryId,
      ticketId: validatedData.ticketId,
    });
    
    if (result.success) {
      console.log('HubSpot nomination approval sync completed successfully');
      return NextResponse.json({
        success: true,
        ticketId: result.ticketId,
      });
    } else {
      console.error('HubSpot nomination approval sync failed:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Nomination approval sync API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.issues,
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