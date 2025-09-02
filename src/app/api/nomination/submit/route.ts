import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { NominationSubmitSchema } from '@/lib/zod/nomination';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = NominationSubmitSchema.parse(body);
    
    console.log('Processing nomination submission:', {
      type: validatedData.type,
      subcategoryId: validatedData.subcategoryId,
      nominatorEmail: validatedData.nominator.email
    });

    // 1. Upsert nominator
    const nominatorData = {
      email: validatedData.nominator.email.toLowerCase(),
      firstname: validatedData.nominator.firstname,
      lastname: validatedData.nominator.lastname,
      linkedin: validatedData.nominator.linkedin || null,
      company: validatedData.nominator.company || null,
      job_title: validatedData.nominator.jobTitle || null,
      phone: validatedData.nominator.phone || null,
      country: validatedData.nominator.country || null
    };

    const { data: existingNominator } = await supabase
      .from('nominators')
      .select('*')
      .eq('email', nominatorData.email)
      .single();

    let nominator;
    if (existingNominator) {
      // Update existing nominator
      const { data: updatedNominator, error: updateError } = await supabase
        .from('nominators')
        .update(nominatorData)
        .eq('id', existingNominator.id)
        .select()
        .single();

      if (updateError) throw updateError;
      nominator = updatedNominator;
    } else {
      // Insert new nominator
      const { data: newNominator, error: insertError } = await supabase
        .from('nominators')
        .insert(nominatorData)
        .select()
        .single();

      if (insertError) throw insertError;
      nominator = newNominator;
    }

    // 2. Create nominee
    const nomineeData: any = {
      type: validatedData.type
    };

    if (validatedData.type === 'person') {
      const nominee = validatedData.nominee as any;
      nomineeData.firstname = nominee.firstname;
      nomineeData.lastname = nominee.lastname;
      nomineeData.person_email = nominee.email || null;
      nomineeData.person_linkedin = nominee.linkedin || null;
      nomineeData.person_phone = nominee.phone || null;
      nomineeData.jobtitle = nominee.jobtitle || null;
      nomineeData.person_company = nominee.company || null;
      nomineeData.person_country = nominee.country || null;
      nomineeData.headshot_url = nominee.headshotUrl;
      nomineeData.why_me = nominee.whyMe || null;
      nomineeData.live_url = nominee.liveUrl || null;
      nomineeData.bio = nominee.bio || null;
      nomineeData.achievements = nominee.achievements || null;
    } else {
      const nominee = validatedData.nominee as any;
      nomineeData.company_name = nominee.name;
      nomineeData.company_domain = nominee.domain || null;
      nomineeData.company_website = nominee.website || null;
      nomineeData.company_linkedin = nominee.linkedin || null;
      nomineeData.company_phone = nominee.phone || null;
      nomineeData.company_country = nominee.country || null;
      nomineeData.company_size = nominee.size || null;
      nomineeData.company_industry = nominee.industry || null;
      nomineeData.logo_url = nominee.logoUrl;
      nomineeData.why_us = nominee.whyUs || null;
      nomineeData.live_url = nominee.liveUrl || null;
      nomineeData.bio = nominee.bio || null;
      nomineeData.achievements = nominee.achievements || null;
    }

    const { data: nominee, error: nomineeError } = await supabase
      .from('nominees')
      .insert(nomineeData)
      .select()
      .single();

    if (nomineeError) throw nomineeError;

    // 3. Create nomination linking nominator and nominee
    const nominationData = {
      nominator_id: nominator.id,
      nominee_id: nominee.id,
      category_group_id: validatedData.categoryGroupId,
      subcategory_id: validatedData.subcategoryId,
      state: 'submitted' as const, // Changed from 'pending' to 'submitted' to match schema
      votes: 0
    };

    const { data: nomination, error: nominationError } = await supabase
      .from('nominations')
      .insert(nominationData)
      .select()
      .single();

    if (nominationError) throw nominationError;

    // 4. Real-time HubSpot and Loops sync for BOTH nominator AND nominee
    let nominatorSyncSuccess = false;
    let nomineeSyncSuccess = false;
    let nominatorLoopsSyncSuccess = false;
    let nomineeLoopsSyncSuccess = false;
    
    try {
      // Check if HubSpot sync is enabled
      const hubspotEnabled = process.env.HUBSPOT_SYNC_ENABLED === 'true' && (process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_TOKEN);
      
      if (hubspotEnabled) {
        console.log('🔄 Starting HubSpot real-time sync...');
        
        // Dynamic import with better error handling
        const hubspotModule = await import('@/server/hubspot/realtime-sync').catch(importError => {
          console.warn('Failed to import HubSpot sync module:', importError);
          return null;
        });
        
        if (hubspotModule) {
          const { syncNominatorToHubSpot, syncNomineeToHubSpot } = hubspotModule;
          
          // Sync nominator immediately
          const nominatorSyncData = {
            firstname: validatedData.nominator.firstname,
            lastname: validatedData.nominator.lastname,
            email: validatedData.nominator.email,
            linkedin: validatedData.nominator.linkedin,
            company: validatedData.nominator.company,
            jobTitle: validatedData.nominator.jobTitle,
            phone: validatedData.nominator.phone,
            country: validatedData.nominator.country,
          };

          console.log('🔄 Syncing nominator to HubSpot:', nominatorSyncData.email);
          const nominatorSyncResult = await syncNominatorToHubSpot(nominatorSyncData).catch(syncError => {
            console.warn('Nominator sync error:', syncError);
            return { success: false, error: syncError.message };
          });
          
          if (nominatorSyncResult.success) {
            nominatorSyncSuccess = true;
            console.log(`✅ Nominator synced to HubSpot: ${nominatorSyncResult.contactId}`);
          } else {
            console.warn(`⚠️ HubSpot sync failed for nominator: ${nominatorSyncResult.error}`);
          }

          // Sync nominee immediately as well (don't wait for approval)
          const nomineeSyncData = {
            type: validatedData.type as 'person' | 'company',
            subcategoryId: validatedData.subcategoryId,
            nominationId: nomination.id,
            // Person fields
            firstname: validatedData.type === 'person' ? (validatedData.nominee as any).firstname : undefined,
            lastname: validatedData.type === 'person' ? (validatedData.nominee as any).lastname : undefined,
            email: validatedData.type === 'person' ? (validatedData.nominee as any).email : undefined,
            linkedin: validatedData.type === 'person' ? (validatedData.nominee as any).linkedin : undefined,
            jobtitle: validatedData.type === 'person' ? (validatedData.nominee as any).jobtitle : undefined,
            company: validatedData.type === 'person' ? (validatedData.nominee as any).company : undefined,
            phone: validatedData.type === 'person' ? (validatedData.nominee as any).phone : undefined,
            country: validatedData.type === 'person' ? (validatedData.nominee as any).country : undefined,
            // Company fields
            companyName: validatedData.type === 'company' ? (validatedData.nominee as any).name : undefined,
            companyWebsite: validatedData.type === 'company' ? (validatedData.nominee as any).website : undefined,
            companyLinkedin: validatedData.type === 'company' ? (validatedData.nominee as any).linkedin : undefined,
            companyEmail: validatedData.type === 'company' ? (validatedData.nominee as any).email : undefined,
            companyPhone: validatedData.type === 'company' ? (validatedData.nominee as any).phone : undefined,
            companyCountry: validatedData.type === 'company' ? (validatedData.nominee as any).country : undefined,
            companyIndustry: validatedData.type === 'company' ? (validatedData.nominee as any).industry : undefined,
            companySize: validatedData.type === 'company' ? (validatedData.nominee as any).size : undefined,
          };

          console.log('🔄 Syncing nominee to HubSpot:', nomineeSyncData.email || nomineeSyncData.companyName);
          const nomineeSyncResult = await syncNomineeToHubSpot(nomineeSyncData).catch(syncError => {
            console.warn('Nominee sync error:', syncError);
            return { success: false, error: syncError.message };
          });
          
          if (nomineeSyncResult.success) {
            nomineeSyncSuccess = true;
            console.log(`✅ Nominee synced to HubSpot immediately: ${nomineeSyncResult.contactId}`);
          } else {
            console.warn(`⚠️ HubSpot sync failed for nominee: ${nomineeSyncResult.error}`);
          }
        } else {
          console.warn('⚠️ HubSpot sync module not available');
        }
      } else {
        console.log('ℹ️ HubSpot sync disabled or not configured');
      }
    } catch (error) {
      console.warn('HubSpot real-time sync failed (non-blocking):', error);
    }

    // 4b. Real-time Loops sync for nominator (nominees sync on approval)
    try {
      // Check if Loops sync is enabled
      const loopsEnabled = process.env.LOOPS_SYNC_ENABLED === 'true' && process.env.LOOPS_API_KEY;
      
      if (loopsEnabled) {
        console.log('🔄 Starting Loops real-time sync...');
        
        // Dynamic import with better error handling
        const loopsModule = await import('@/server/loops/realtime-sync').catch(importError => {
          console.warn('Failed to import Loops sync module:', importError);
          return null;
        });
        
        if (loopsModule) {
          const { syncNominatorToLoops } = loopsModule;
          
          // Sync nominator immediately with "Nominator 2026" tag
          const nominatorLoopsData = {
            firstname: validatedData.nominator.firstname,
            lastname: validatedData.nominator.lastname,
            email: validatedData.nominator.email,
            linkedin: validatedData.nominator.linkedin,
            company: validatedData.nominator.company,
            jobTitle: validatedData.nominator.jobTitle,
            phone: validatedData.nominator.phone,
            country: validatedData.nominator.country,
          };

          console.log('🔄 Syncing nominator to Loops:', nominatorLoopsData.email);
          const nominatorLoopsResult = await syncNominatorToLoops(nominatorLoopsData).catch(syncError => {
            console.warn('Nominator Loops sync error:', syncError);
            return { success: false, error: syncError.message };
          });
          
          if (nominatorLoopsResult.success) {
            nominatorLoopsSyncSuccess = true;
            console.log(`✅ Nominator synced to Loops: ${nominatorLoopsResult.contactId}`);
          } else {
            console.warn(`⚠️ Loops sync failed for nominator: ${nominatorLoopsResult.error}`);
          }
        } else {
          console.warn('⚠️ Loops sync module not available');
        }
      } else {
        console.log('ℹ️ Loops sync disabled or not configured');
      }
    } catch (error) {
      console.warn('Loops real-time sync failed (non-blocking):', error);
    }

    // 5. Insert hubspot_outbox row for backup sync
    const outboxPayload = {
      nominationId: nomination.id,
      nominatorId: nominator.id,
      nomineeId: nominee.id,
      type: validatedData.type,
      subcategoryId: validatedData.subcategoryId,
      nominator: validatedData.nominator,
      nominee: validatedData.nominee
    };

    const { error: outboxError } = await supabase
      .from('hubspot_outbox')
      .insert({
        event_type: 'nomination_submitted',
        payload: outboxPayload
      });

    if (outboxError) throw outboxError;

    // 5b. Insert loops_outbox row for backup sync
    try {
      const { error: loopsOutboxError } = await supabase
        .from('loops_outbox')
        .insert({
          event_type: 'nomination_submitted',
          payload: outboxPayload
        });

      if (loopsOutboxError) {
        console.warn('Failed to add to Loops outbox (non-blocking):', loopsOutboxError);
      }
    } catch (loopsOutboxError) {
      console.warn('Loops outbox not available (non-blocking):', loopsOutboxError);
    }

    console.log('Nomination submitted successfully:', nomination.id);

    return NextResponse.json({
      nominationId: nomination.id,
      nominatorId: nominator.id,
      nomineeId: nominee.id,
      state: 'submitted',
      hubspotSync: {
        nominatorSynced: nominatorSyncSuccess,
        nomineeSynced: nomineeSyncSuccess,
        outboxCreated: true
      },
      loopsSync: {
        nominatorSynced: nominatorLoopsSyncSuccess,
        outboxCreated: true
      }
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/nomination/submit error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', error.issues);
      return NextResponse.json(
        {
          error: 'Invalid nomination data',
          details: error.issues
        },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to submit nomination';
    console.error('Final error message:', errorMessage);

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.stack : 'Unknown error'
      },
      { status: 500 }
    );
  }
}