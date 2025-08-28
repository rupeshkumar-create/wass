import { NextRequest, NextResponse } from 'next/server';
import { onSubmit } from '@/server/hubspot/sync';
import { z } from 'zod';

// Validation schema
const NominationSubmitSyncSchema = z.object({
  nominator: z.object({
    email: z.string().email(),
    name: z.string().min(1),
    company: z.string().min(1),
    linkedin: z.string().url(),
  }),
  nominee: z.object({
    name: z.string().min(1),
    type: z.enum(['person', 'company']),
    linkedin: z.string().url(),
    email: z.string().email().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    title: z.string().optional(),
    website: z.string().url().optional(),

  }),
  category: z.string().min(1),
  categoryGroupId: z.string().min(1),
  subcategoryId: z.string().min(1),
  whyNominated: z.string().min(1),
  imageUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = NominationSubmitSyncSchema.parse(body);
    
    console.log('Starting HubSpot nomination submit sync for:', {
      nominator: validatedData.nominator.email,
      nominee: validatedData.nominee.name,
      category: validatedData.category,
    });

    // Sync to HubSpot using new sync system
    const result = await onSubmit({
      nominator: {
        email: validatedData.nominator.email,
        name: validatedData.nominator.name,
        company: validatedData.nominator.company,
        linkedin: validatedData.nominator.linkedin,
      },
      nominee: {
        name: validatedData.nominee.name,
        type: validatedData.nominee.type,
        email: validatedData.nominee.email,
        firstname: validatedData.nominee.firstName,
        lastname: validatedData.nominee.lastName,
        jobtitle: validatedData.nominee.title,
        website: validatedData.nominee.website,
        linkedin: validatedData.nominee.linkedin,
        categories: [validatedData.subcategoryId],
        headshotUrl: validatedData.imageUrl,
        logoUrl: validatedData.imageUrl,

      },
      categoryGroupId: validatedData.categoryGroupId,
      subcategoryId: validatedData.subcategoryId,
      imageUrl: validatedData.imageUrl,
      content: validatedData.whyNominated,
    });
    
    if (result.success) {
      console.log('HubSpot nomination submit sync completed successfully');
      return NextResponse.json({
        success: true,
        nominatorContactId: result.nominatorContactId,
        nomineeContactId: result.nomineeContactId,
        nomineeCompanyId: result.nomineeCompanyId,
        ticketId: result.ticketId,
      });
    } else {
      console.error('HubSpot nomination submit sync failed:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Nomination submit sync API error:', error);
    
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