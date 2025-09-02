import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { VoteSchema } from '@/lib/zod/vote';
import { z } from 'zod';
import { voteRateLimit, dailyVoteRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const minuteLimit = voteRateLimit(request);
    const dailyLimit = dailyVoteRateLimit(request);
    
    if (!minuteLimit.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many votes. Please wait before voting again.',
          rateLimitExceeded: true,
          resetTime: minuteLimit.resetTime
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': minuteLimit.limit.toString(),
            'X-RateLimit-Remaining': minuteLimit.remaining.toString(),
            'X-RateLimit-Reset': minuteLimit.resetTime.toString()
          }
        }
      );
    }
    
    if (!dailyLimit.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Daily vote limit exceeded. Please try again tomorrow.',
          rateLimitExceeded: true,
          resetTime: dailyLimit.resetTime
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': dailyLimit.limit.toString(),
            'X-RateLimit-Remaining': dailyLimit.remaining.toString(),
            'X-RateLimit-Reset': dailyLimit.resetTime.toString()
          }
        }
      );
    }
    
    const body = await request.json();
    
    // Validate input
    const validatedData = VoteSchema.parse(body);
    
    console.log('Processing vote:', {
      subcategoryId: validatedData.subcategoryId,
      voterEmail: validatedData.email,
      votedFor: validatedData.votedForDisplayName
    });

    // 1. Check if user has already voted in this subcategory
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('voter_id', (await supabase
        .from('voters')
        .select('id')
        .eq('email', validatedData.email.toLowerCase())
        .single()).data?.id || '')
      .eq('subcategory_id', validatedData.subcategoryId)
      .single();

    if (existingVote) {
      return NextResponse.json(
        { error: 'ALREADY_VOTED', message: 'You have already voted in this category' },
        { status: 409 }
      );
    }

    // 2. Upsert voter
    const voterData = {
      email: validatedData.email.toLowerCase(),
      firstname: validatedData.firstname,
      lastname: validatedData.lastname,
      linkedin: validatedData.linkedin,
      company: validatedData.company || null,
      job_title: validatedData.jobTitle || null,
      country: validatedData.country || null
    };

    const { data: existingVoter } = await supabase
      .from('voters')
      .select('*')
      .eq('email', voterData.email)
      .single();

    let voter;
    if (existingVoter) {
      // Update existing voter
      const { data: updatedVoter, error: updateError } = await supabase
        .from('voters')
        .update(voterData)
        .eq('id', existingVoter.id)
        .select()
        .single();

      if (updateError) throw updateError;
      voter = updatedVoter;
    } else {
      // Insert new voter
      const { data: newVoter, error: insertError } = await supabase
        .from('voters')
        .insert(voterData)
        .select()
        .single();

      if (insertError) throw insertError;
      voter = newVoter;
    }

    // 3. Find the nomination to vote for using the public_nominees view
    const { data: nominees, error: findError } = await supabase
      .from('public_nominees')
      .select('nomination_id, display_name')
      .eq('subcategory_id', validatedData.subcategoryId);

    if (findError) throw findError;

    const matchingNominee = nominees?.find(nominee => 
      nominee.display_name === validatedData.votedForDisplayName
    );

    if (!matchingNominee) {
      return NextResponse.json(
        { error: 'Nomination not found for voting' },
        { status: 404 }
      );
    }

    // 4. Insert vote record (this will trigger the vote count update via database trigger)
    const voteData = {
      voter_id: voter.id,
      nomination_id: matchingNominee.nomination_id,
      subcategory_id: validatedData.subcategoryId,
      vote_timestamp: new Date().toISOString(),
      ip_address: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  null,
      user_agent: request.headers.get('user-agent') || null
    };

    const { data: vote, error: voteError } = await supabase
      .from('votes')
      .insert(voteData)
      .select()
      .single();

    if (voteError) throw voteError;

    // 5. Get updated vote count
    const { data: updatedNomination } = await supabase
      .from('nominations')
      .select('votes')
      .eq('id', matchingNominee.nomination_id)
      .single();

    // 6. Real-time HubSpot sync for voter
    try {
      const { syncVoterToHubSpot } = await import('@/server/hubspot/realtime-sync');
      
      const voterSyncData = {
        firstname: validatedData.firstname,
        lastname: validatedData.lastname,
        email: validatedData.email,
        linkedin: validatedData.linkedin,
        company: validatedData.company,
        jobTitle: validatedData.jobTitle,
        country: validatedData.country,
        votedFor: validatedData.votedForDisplayName,
        subcategoryId: validatedData.subcategoryId,
      };

      const syncResult = await syncVoterToHubSpot(voterSyncData);
      
      if (syncResult.success) {
        console.log(`✅ Voter synced to HubSpot: ${syncResult.contactId}`);
      } else {
        console.warn(`⚠️ HubSpot sync failed for voter: ${syncResult.error}`);
      }
    } catch (error) {
      console.warn('HubSpot sync failed (non-blocking):', error);
    }

    // 6b. Real-time Loops sync for voter
    try {
      const loopsEnabled = process.env.LOOPS_SYNC_ENABLED === 'true' && process.env.LOOPS_API_KEY;
      
      if (loopsEnabled) {
        console.log('🔄 Starting Loops voter sync...');
        
        const loopsModule = await import('@/server/loops/realtime-sync').catch(importError => {
          console.warn('Failed to import Loops sync module:', importError);
          return null;
        });
        
        if (loopsModule) {
          const { syncVoterToLoops } = loopsModule;
          
          const voterLoopsData = {
            firstname: validatedData.firstname,
            lastname: validatedData.lastname,
            email: validatedData.email,
            linkedin: validatedData.linkedin,
            company: validatedData.company,
            jobTitle: validatedData.jobTitle,
            country: validatedData.country,
            votedFor: validatedData.votedForDisplayName,
            subcategoryId: validatedData.subcategoryId,
          };

          const loopsResult = await syncVoterToLoops(voterLoopsData);
          
          if (loopsResult.success) {
            console.log(`✅ Voter synced to Loops: ${loopsResult.contactId}`);
          } else {
            console.warn(`⚠️ Loops sync failed for voter: ${loopsResult.error}`);
          }
        }
      }
    } catch (error) {
      console.warn('Loops sync failed (non-blocking):', error);
    }

    // 7. Insert hubspot_outbox row for backup sync
    const outboxPayload = {
      voteId: vote.id,
      voterId: voter.id,
      nominationId: matchingNominee.nomination_id,
      subcategoryId: validatedData.subcategoryId,
      voter: {
        email: validatedData.email,
        firstname: validatedData.firstname,
        lastname: validatedData.lastname,
        linkedin: validatedData.linkedin,
        company: validatedData.company,
        job_title: validatedData.jobTitle,
        country: validatedData.country
      },
      votedForDisplayName: validatedData.votedForDisplayName
    };

    const { error: outboxError } = await supabase
      .from('hubspot_outbox')
      .insert({
        event_type: 'vote_cast',
        payload: outboxPayload
      });

    if (outboxError) throw outboxError;

    // 7b. Insert loops_outbox row for backup sync
    try {
      const { error: loopsOutboxError } = await supabase
        .from('loops_outbox')
        .insert({
          event_type: 'vote_cast',
          payload: outboxPayload
        });

      if (loopsOutboxError) {
        console.warn('Failed to add to Loops outbox (non-blocking):', loopsOutboxError);
      }
    } catch (loopsOutboxError) {
      console.warn('Loops outbox not available (non-blocking):', loopsOutboxError);
    }

    console.log('Vote cast successfully:', vote.id);

    return NextResponse.json({
      ok: true,
      voteId: vote.id,
      voterId: voter.id,
      newVoteCount: updatedNomination?.votes || 0
    });

  } catch (error) {
    console.error('POST /api/vote error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid vote data',
          details: error.issues
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to cast vote'
      },
      { status: 500 }
    );
  }
}