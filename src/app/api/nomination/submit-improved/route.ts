import { NextRequest, NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabase/server';
import { NominationSubmitSchema } from '@/lib/zod/nomination';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = NominationSubmitSchema.parse(body);
    
    console.log('Processing improved nomination submission:', {
      type: validatedData.type,
      subcategoryId: validatedData.subcategoryId,
      nominatorEmail: validatedData.nominator.email
    });

    // Step 1: Upsert nominator
    const nominatorData = {
      email: validatedData.nominator.email.toLowerCase(),
      firstname: validatedData.nominator.firstname,
      lastname: validatedData.nominator.lastname,
      linkedin: validatedData.nominator.linkedin || null,
      company: validatedData.nominator.company || null,
      job_title: validatedData.nominator.jobTitle || null,
      phone: validatedData.nominator.phone || null,
      country: validatedData.nominator.country || null,
    };

    const { data: existingNominator } = await supabaseAdmin
      .from('nominators')
      .select('*')
      .eq('email', nominatorData.email)
      .single();

    let nominator;
    if (existingNominator) {
      // Update existing nominator
      const { data: updatedNominator, error: updateError } = await supabaseAdmin
        .from('nominators')
        .update(nominatorData)
        .eq('id', existingNominator.id)
        .select()
        .single();

      if (updateError) throw updateError;
      nominator = updatedNominator;
    } else {
      // Insert new nominator
      const { data: newNominator, error: insertError } = await supabaseAdmin
        .from('nominators')
        .insert(nominatorData)
        .select()
        .single();

      if (insertError) throw insertError;
      nominator = newNominator;
    }

    // Step 2: Create or update nominee
    const nominee = validatedData.nominee as any;
    
    // Check for existing nominee (by email for person, by name for company)
    let existingNominee = null;
    if (validatedData.type === 'person' && nominee.email) {
      const { data } = await supabaseAdmin
        .from('nominees')
        .select('*')
        .eq('type', 'person')
        .eq('person_email', nominee.email.toLowerCase())
        .single();
      existingNominee = data;
    } else if (validatedData.type === 'company' && nominee.name) {
      const { data } = await supabaseAdmin
        .from('nominees')
        .select('*')
        .eq('type', 'company')
        .eq('company_name', nominee.name)
        .single();
      existingNominee = data;
    }

    const nomineeData: any = {
      type: validatedData.type,
    };

    if (validatedData.type === 'person') {
      nomineeData.firstname = nominee.firstname;
      nomineeData.lastname = nominee.lastname;
      nomineeData.person_email = nominee.email?.toLowerCase() || null;
      nomineeData.person_linkedin = nominee.linkedin || null;
      nomineeData.person_phone = nominee.phone || null;
      nomineeData.jobtitle = nominee.jobtitle || null;
      nomineeData.person_company = nominee.company || null;
      nomineeData.person_country = nominee.country || null;
      nomineeData.headshot_url = nominee.headshotUrl; // This should be properly set from form
      nomineeData.why_me = nominee.whyMe;
      nomineeData.bio = nominee.bio || null;
    } else {
      nomineeData.company_name = nominee.name;
      nomineeData.company_domain = nominee.domain || null;
      nomineeData.company_website = nominee.website || null;
      nomineeData.company_linkedin = nominee.linkedin || null;
      nomineeData.company_phone = nominee.phone || null;
      nomineeData.company_country = nominee.country || null;
      nomineeData.company_size = nominee.size || null;
      nomineeData.company_industry = nominee.industry || null;
      nomineeData.logo_url = nominee.logoUrl; // This should be properly set from form
      nomineeData.why_us = nominee.whyUs;
    }

    // Add shared fields
    nomineeData.live_url = nominee.liveUrl || null;
    nomineeData.achievements = nominee.achievements || null;
    nomineeData.social_media = nominee.socialMedia || null;

    let nomineeRecord;
    if (existingNominee) {
      // Update existing nominee
      const { data: updatedNominee, error: updateError } = await supabaseAdmin
        .from('nominees')
        .update(nomineeData)
        .eq('id', existingNominee.id)
        .select()
        .single();

      if (updateError) throw updateError;
      nomineeRecord = updatedNominee;
    } else {
      // Insert new nominee
      const { data: newNominee, error: insertError } = await supabaseAdmin
        .from('nominees')
        .insert(nomineeData)
        .select()
        .single();

      if (insertError) throw insertError;
      nomineeRecord = newNominee;
    }

    // Step 3: Check for existing nomination
    const { data: existingNomination } = await supabaseAdmin
      .from('nominations')
      .select('*')
      .eq('nominee_id', nomineeRecord.id)
      .eq('subcategory_id', validatedData.subcategoryId)
      .single();

    if (existingNomination) {
      // Update existing nomination with new nominator
      const { data: updatedNomination, error: updateError } = await supabaseAdmin
        .from('nominations')
        .update({
          nominator_id: nominator.id,
          state: 'submitted', // Reset to submitted if it was rejected
        })
        .eq('id', existingNomination.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return NextResponse.json({
        nominationId: updatedNomination.id,
        state: updatedNomination.state,
        duplicate: true,
        reason: 'This nominee is already nominated in this category. Your nomination has been updated.'
      }, { status: 200 });
    }

    // Step 4: Create new nomination
    const nominationData = {
      nominator_id: nominator.id,
      nominee_id: nomineeRecord.id,
      category_group_id: validatedData.categoryGroupId,
      subcategory_id: validatedData.subcategoryId,
      state: 'submitted',
      votes: 0,
    };

    const { data: nomination, error: nominationError } = await supabaseAdmin
      .from('nominations')
      .insert(nominationData)
      .select()
      .single();

    if (nominationError) throw nominationError;

    // Step 5: Add to HubSpot outbox
    const outboxPayload = {
      nominationId: nomination.id,
      nominatorId: nominator.id,
      nomineeId: nomineeRecord.id,
      type: validatedData.type,
      subcategoryId: validatedData.subcategoryId,
      nominator: validatedData.nominator,
      nominee: validatedData.nominee
    };

    const { error: outboxError } = await supabaseAdmin
      .from('hubspot_outbox')
      .insert({
        event_type: 'nomination_submitted',
        payload: outboxPayload
      });

    if (outboxError) {
      console.warn('Failed to add to HubSpot outbox:', outboxError);
      // Don't fail the nomination for this
    }

    console.log('Improved nomination submitted successfully:', nomination.id);

    return NextResponse.json({
      nominationId: nomination.id,
      state: 'submitted',
      nomineeId: nomineeRecord.id,
      nominatorId: nominator.id
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/nomination/submit-improved error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid nomination data',
          details: error.issues
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to submit nomination'
      },
      { status: 500 }
    );
  }
}