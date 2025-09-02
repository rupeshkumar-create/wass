import { NextRequest, NextResponse } from 'next/server';
import { onVote } from '@/server/hubspot/sync';
import { z } from 'zod';

// Validation schema
const VoteSyncSchema = z.object({
  voter: z.object({
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    company: z.string().min(1),
    linkedin: z.string().url(),
  }),
  nominee: z.object({
    id: z.string(),
    name: z.string().min(1),
    type: z.enum(['person', 'company']),
    linkedin: z.string().url(),
    email: z.string().email().optional(),
  }),
  category: z.string().min(1),
  subcategoryId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = VoteSyncSchema.parse(body);
    
    console.log('Starting HubSpot vote sync for:', {
      voter: validatedData.voter.email,
      nominee: validatedData.nominee.name,
      category: validatedData.category,
    });

    // Sync to HubSpot using new sync system
    const result = await onVote({
      voter: {
        email: validatedData.voter.email,
        firstname: validatedData.voter.firstName,
        lastname: validatedData.voter.lastName,
        company: validatedData.voter.company,
        linkedin: validatedData.voter.linkedin,
      },
      nominee: {
        id: validatedData.nominee.id,
        name: validatedData.nominee.name,
        type: validatedData.nominee.type,
        email: validatedData.nominee.email,
        linkedin: validatedData.nominee.linkedin,
      },
      votedForDisplayName: validatedData.nominee.name,
      subcategoryId: validatedData.subcategoryId,
    });
    
    if (result.success) {
      console.log('HubSpot vote sync completed successfully');
      return NextResponse.json({
        success: true,
        voterContactId: result.voterContactId,
      });
    } else {
      console.error('HubSpot vote sync failed:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Vote sync API error:', error);
    
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