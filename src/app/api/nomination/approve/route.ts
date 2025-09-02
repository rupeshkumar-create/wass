import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/server/supabase/client';
import { NominationApproveSchema } from '@/lib/zod/nomination';
import { validateAdminAuth, createAuthErrorResponse } from '@/lib/auth/admin';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  // Validate admin authentication
  if (!validateAdminAuth(request)) {
    return createAuthErrorResponse();
  }
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = NominationApproveSchema.parse(body);
    
    console.log('Processing nomination approval:', {
      nominationId: validatedData.nominationId,
      action: validatedData.action || 'approve',
      liveUrl: validatedData.liveUrl,
      adminNotes: validatedData.adminNotes
    });

    // 1. Get the nomination to approve
    const { data: nomination, error: fetchError } = await supabaseAdmin
      .from('nominations')
      .select('*')
      .eq('id', validatedData.nominationId)
      .single();

    if (fetchError || !nomination) {
      return NextResponse.json(
        { error: 'Nomination not found' },
        { status: 404 }
      );
    }

    // 2. Get nominee details first (we need the type)
    const { data: nominee, error: nomineeError } = await supabaseAdmin
      .from('nominees')
      .select('*')
      .eq('id', nomination.nominee_id)
      .single();

    if (nomineeError || !nominee) {
      return NextResponse.json(
        { error: 'Nominee not found' },
        { status: 404 }
      );
    }

    // 3. Determine action and update nomination
    const action = validatedData.action || 'approve';
    let liveUrl = validatedData.liveUrl;
    const displayName = nominee.type === 'person' 
      ? `${nominee.firstname || ''} ${nominee.lastname || ''}`.trim()
      : nominee.company_name || '';
    
    const updateData: any = {
      state: action === 'approve' ? 'approved' : 'rejected',
    };

    if (action === 'approve') {
      updateData.approved_at = new Date().toISOString();
      updateData.approved_by = 'admin'; // Could be dynamic based on auth
      
      // Auto-generate Live URL if not provided
      if (!liveUrl && displayName) {
          // Generate slug
          const slug = displayName
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
          
          // Get base URL - always use localhost for development
          let baseUrl = 'http://localhost:3000';
          
          // Only use production URLs if explicitly in production
          if (process.env.NODE_ENV === 'production') {
            // Get host from request headers
            const host = request.headers.get('host');
            const protocol = request.headers.get('x-forwarded-proto') || 'https';
            
            // Use request host if available
            if (host) {
              baseUrl = `${protocol}://${host}`;
            }
            // Fallback to environment variables
            else if (process.env.VERCEL_URL) {
              baseUrl = `https://${process.env.VERCEL_URL}`;
            } 
            else if (process.env.NEXT_PUBLIC_SITE_URL) {
              baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
            }
          }
          
        liveUrl = `${baseUrl}/nominee/${slug}`;
        console.log(`Generated live URL: ${liveUrl} for ${displayName}`);
      }
      
      // Store the live URL in the database
      if (liveUrl) {
        updateData.live_url = liveUrl;
      }
    } else {
      updateData.rejection_reason = validatedData.rejectionReason || 'Rejected by admin';
    }

    if (validatedData.adminNotes) {
      updateData.admin_notes = validatedData.adminNotes;
    }

    const { data: updatedNomination, error: updateError } = await supabaseAdmin
      .from('nominations')
      .update(updateData)
      .eq('id', validatedData.nominationId)
      .select()
      .single();

    if (updateError) throw updateError;

    // 4. Find and update related nominator(s) to 'approved' status
    const { error: nominatorUpdateError } = await supabaseAdmin
      .from('nominators')
      .update({ status: 'approved' })
      .eq('subcategory_id', nomination.subcategory_id)
      .eq('nominated_display_name', displayName);

    if (nominatorUpdateError) {
      console.warn('Failed to update nominator status:', nominatorUpdateError);
      // Don't fail the whole operation for this
    }

    // 5. Real-time HubSpot sync for approved nominee
    try {
      const { syncNomineeToHubSpot } = await import('@/server/hubspot/realtime-sync');
      
      const nomineeSyncData = {
        type: nominee.type as 'person' | 'company',
        subcategoryId: nomination.subcategory_id,
        nominationId: validatedData.nominationId,
        liveUrl: liveUrl, // CRITICAL: Include the live URL (auto-generated or provided)
        // Person fields
        firstname: nominee.firstname,
        lastname: nominee.lastname,
        email: nominee.person_email,
        linkedin: nominee.person_linkedin,
        jobtitle: nominee.jobtitle,
        company: nominee.person_company,
        phone: nominee.person_phone,
        country: nominee.person_country,
        // Company fields
        companyName: nominee.company_name,
        companyWebsite: nominee.company_website,
        companyLinkedin: nominee.company_linkedin,
        companyEmail: nominee.company_email,
        companyPhone: nominee.company_phone,
        companyCountry: nominee.company_country,
        companyIndustry: nominee.company_industry,
        companySize: nominee.company_size,
      };

      const syncResult = await syncNomineeToHubSpot(nomineeSyncData);
      
      if (syncResult.success) {
        console.log(`✅ Nominee synced to HubSpot: ${syncResult.contactId}`);
      } else {
        console.warn(`⚠️ HubSpot sync failed for nominee: ${syncResult.error}`);
      }
    } catch (error) {
      console.warn('HubSpot sync failed (non-blocking):', error);
    }

    // 5b. Real-time Loops sync for approved nominee and nominator update
    try {
      const loopsEnabled = process.env.LOOPS_SYNC_ENABLED === 'true' && process.env.LOOPS_API_KEY;
      
      if (loopsEnabled && action === 'approve') {
        console.log('🔄 Starting Loops approval sync...');
        
        const loopsModule = await import('@/server/loops/realtime-sync').catch(importError => {
          console.warn('Failed to import Loops sync module:', importError);
          return null;
        });
        
        if (loopsModule) {
          const { syncNomineeToLoops, updateNominatorToLive } = loopsModule;
          
          // Sync nominee with "Nominess" user group and live URL
          const nomineeLoopsData = {
            type: nominee.type as 'person' | 'company',
            subcategoryId: nomination.subcategory_id,
            nominationId: validatedData.nominationId,
            liveUrl: liveUrl,
            // Person fields
            firstname: nominee.firstname,
            lastname: nominee.lastname,
            email: nominee.person_email,
            linkedin: nominee.person_linkedin,
            jobtitle: nominee.jobtitle,
            company: nominee.person_company,
            phone: nominee.person_phone,
            country: nominee.person_country,
            // Company fields
            companyName: nominee.company_name,
            companyWebsite: nominee.company_website,
            companyLinkedin: nominee.company_linkedin,
            companyEmail: nominee.company_email,
            companyPhone: nominee.company_phone,
            companyCountry: nominee.company_country,
            companyIndustry: nominee.company_industry,
            companySize: nominee.company_size,
          };

          const nomineeLoopsResult = await syncNomineeToLoops(nomineeLoopsData);
          
          if (nomineeLoopsResult.success) {
            console.log(`✅ Nominee synced to Loops: ${nomineeLoopsResult.contactId}`);
          } else {
            console.warn(`⚠️ Loops sync failed for nominee: ${nomineeLoopsResult.error}`);
          }

          // Update nominator to "Nominator Live" with nominee link
          const { data: nominatorData } = await supabaseAdmin
            .from('nominators')
            .select('email')
            .eq('id', nomination.nominator_id)
            .single();

          if (nominatorData && liveUrl) {
            const nomineeName = nominee.type === 'person' 
              ? `${nominee.firstname || ''} ${nominee.lastname || ''}`.trim()
              : nominee.company_name || '';

            const nominatorUpdateResult = await updateNominatorToLive(
              nominatorData.email,
              {
                name: nomineeName,
                liveUrl: liveUrl
              }
            );

            if (nominatorUpdateResult.success) {
              console.log(`✅ Nominator updated to "Nominator Live": ${nominatorData.email}`);
            } else {
              console.warn(`⚠️ Failed to update nominator to live: ${nominatorUpdateResult.error}`);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Loops sync failed (non-blocking):', error);
    }

    // 6. Get nominator data for outbox payload
    const { data: nominatorData } = await supabaseAdmin
      .from('nominators')
      .select('*')
      .eq('id', nomination.nominator_id)
      .single();

    // Insert hubspot_outbox row for backup sync
    const outboxPayload = {
      nominationId: validatedData.nominationId,
      liveUrl: liveUrl,
      type: nominee.type,
      subcategoryId: nomination.subcategory_id,
      displayName,
      nominee: nominee,
      nominator: nominatorData // CRITICAL: Include nominator data for "Nominator Live" update
    };

    const { error: outboxError } = await supabaseAdmin
      .from('hubspot_outbox')
      .insert({
        event_type: 'nomination_approved',
        payload: outboxPayload
      });

    if (outboxError) throw outboxError;

    // 6b. Insert loops_outbox row for backup sync
    try {
      const { error: loopsOutboxError } = await supabaseAdmin
        .from('loops_outbox')
        .insert({
          event_type: 'nomination_approved',
          payload: outboxPayload
        });

      if (loopsOutboxError) {
        console.warn('Failed to add to Loops outbox (non-blocking):', loopsOutboxError);
      }
    } catch (loopsOutboxError) {
      console.warn('Loops outbox not available (non-blocking):', loopsOutboxError);
    }

    console.log('Nomination processed successfully:', {
      nominationId: validatedData.nominationId,
      action,
      liveUrl: validatedData.liveUrl
    });

    return NextResponse.json({
      success: true,
      nominationId: validatedData.nominationId,
      action,
      state: updatedNomination.state,
      approvedAt: updatedNomination.approved_at,
      adminNotes: updatedNomination.admin_notes,
      liveUrl: liveUrl,
      displayName: displayName,
      message: action === 'approve' 
        ? `Nomination approved successfully! Live URL: ${liveUrl}`
        : 'Nomination rejected successfully'
    });

  } catch (error) {
    console.error('POST /api/nomination/approve error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid approval data',
          details: error.issues
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to approve nomination',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}