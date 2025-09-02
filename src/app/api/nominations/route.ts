import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase/service';
import { PersonNominationInputSchema, CompanyNominationInputSchema } from '@/lib/data-types';
import { z } from 'zod';

// Combined input schema
const NominationInputSchema = z.discriminatedUnion('type', [
  PersonNominationInputSchema.extend({ type: z.literal('person') }),
  CompanyNominationInputSchema.extend({ type: z.literal('company') })
]);

/**
 * GET /api/nominations - Get all nominations with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      category: searchParams.get('category') || undefined,
      type: (searchParams.get('type') as 'person' | 'company') || undefined,
      status: (searchParams.get('status') as 'pending' | 'approved' | 'rejected') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    const nominations = await supabaseService.getNominations(filters);

    return NextResponse.json({
      success: true,
      data: nominations,
      count: nominations.length
    });

  } catch (error) {
    console.error('GET /api/nominations error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get nominations'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/nominations - Create a new nomination
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = NominationInputSchema.parse(body);
    
    console.log('Creating nomination:', {
      type: validatedData.type,
      category: validatedData.category,
      nominee: validatedData.nominee.name || (validatedData.nominee as any).firstName + ' ' + (validatedData.nominee as any).lastName,
      nominator: validatedData.nominator.email
    });

    // Create nomination in Supabase
    const nomination = await supabaseService.createNomination(validatedData);

    console.log('Nomination created successfully:', nomination.id);

    return NextResponse.json({
      success: true,
      data: nomination
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/nominations error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid nomination data',
          details: error.issues
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create nomination'
      },
      { status: 500 }
    );
  }
}