#!/usr/bin/env node

/**
 * Debug Specific Approval Issues
 * Investigate the specific cases mentioned:
 * - rafyuyospe@necub.com (nominator) - should be "Nominator Live" with nominee live link
 * - higilip579@besaies.com (nominee) - should be synced with "Nominess" and live URL
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugSpecificApprovalIssues() {
  console.log('🔍 Debugging Specific Approval Issues...\n');

  const apiKey = process.env.LOOPS_API_KEY;
  if (!apiKey) {
    console.log('❌ LOOPS_API_KEY not configured');
    return;
  }

  const baseUrl = 'https://app.loops.so/api/v1';
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // 1. Check rafyuyospe@necub.com (nominator)
    console.log('1. Checking nominator: rafyuyospe@necub.com');
    
    // Find their nomination in database
    const { data: nominatorData } = await supabase
      .from('nominators')
      .select('*')
      .eq('email', 'rafyuyospe@necub.com')
      .single();

    if (nominatorData) {
      console.log(`   ✅ Found nominator in database: ${nominatorData.firstname} ${nominatorData.lastname}`);
      
      // Find their nominations
      const { data: nominations } = await supabase
        .from('admin_nominations')
        .select('*')
        .eq('nominator_email', 'rafyuyospe@necub.com');

      if (nominations && nominations.length > 0) {
        console.log(`   Found ${nominations.length} nomination(s):`);
        
        for (const nomination of nominations) {
          console.log(`     - ${nomination.nominee_display_name} (${nomination.state})`);
          if (nomination.state === 'approved') {
            console.log(`       ✅ Approved at: ${nomination.approved_at}`);
            console.log(`       Nominee email: ${nomination.nominee_email}`);
          }
        }
      }

      // Check in Loops
      try {
        const loopsResponse = await fetch(`${baseUrl}/contacts/find?email=rafyuyospe@necub.com`, {
          headers,
        });

        if (loopsResponse.ok) {
          const loopsContacts = await loopsResponse.json();
          if (loopsContacts && loopsContacts.length > 0) {
            const contact = loopsContacts[0];
            console.log(`   ✅ Found in Loops:`);
            console.log(`     - UserGroup: "${contact.userGroup}"`);
            console.log(`     - Nominee Name: ${contact.nomineeName || 'None'}`);
            console.log(`     - Nominee Live URL: ${contact.nomineeLiveUrl || 'None'}`);
            
            if (contact.userGroup !== 'Nominator Live') {
              console.log(`     ❌ Should be "Nominator Live" but is "${contact.userGroup}"`);
            }
          } else {
            console.log(`   ❌ Not found in Loops`);
          }
        }
      } catch (error) {
        console.log(`   ❌ Error checking Loops: ${error.message}`);
      }
    } else {
      console.log(`   ❌ Nominator not found in database`);
    }

    // 2. Check higilip579@besaies.com (nominee)
    console.log('\n2. Checking nominee: higilip579@besaies.com');
    
    // Find their nomination in database
    const { data: nomineeNominations } = await supabase
      .from('admin_nominations')
      .select('*')
      .eq('nominee_email', 'higilip579@besaies.com');

    if (nomineeNominations && nomineeNominations.length > 0) {
      console.log(`   ✅ Found ${nomineeNominations.length} nomination(s) in database:`);
      
      for (const nomination of nomineeNominations) {
        console.log(`     - ${nomination.nominee_display_name} (${nomination.state})`);
        console.log(`       Nominator: ${nomination.nominator_email}`);
        if (nomination.state === 'approved') {
          console.log(`       ✅ Approved at: ${nomination.approved_at}`);
        }
      }
    } else {
      console.log(`   ❌ Nominee not found in database`);
    }

    // Check in Loops
    try {
      const loopsResponse = await fetch(`${baseUrl}/contacts/find?email=higilip579@besaies.com`, {
        headers,
      });

      if (loopsResponse.ok) {
        const loopsContacts = await loopsResponse.json();
        if (loopsContacts && loopsContacts.length > 0) {
          const contact = loopsContacts[0];
          console.log(`   ✅ Found in Loops:`);
          console.log(`     - UserGroup: "${contact.userGroup}"`);
          console.log(`     - Live URL: ${contact.liveUrl || 'None'}`);
          console.log(`     - Nominee Type: ${contact.nomineeType || 'None'}`);
        } else {
          console.log(`   ❌ Not found in Loops`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error checking Loops: ${error.message}`);
    }

    // 3. Check loops_outbox for these specific cases
    console.log('\n3. Checking loops_outbox for these cases...');
    
    const { data: outboxEntries } = await supabase
      .from('loops_outbox')
      .select('*')
      .or('payload->>nominatorEmail.eq.rafyuyospe@necub.com,payload->>nomineeEmail.eq.higilip579@besaies.com')
      .order('created_at', { ascending: false });

    if (outboxEntries && outboxEntries.length > 0) {
      console.log(`   Found ${outboxEntries.length} outbox entries:`);
      
      for (const entry of outboxEntries) {
        console.log(`     - ${entry.event_type}: ${entry.status} (${entry.created_at})`);
        if (entry.last_error) {
          console.log(`       Error: ${entry.last_error}`);
        }
      }
    } else {
      console.log(`   No outbox entries found for these contacts`);
    }

    // 4. Check recent approved nominations that might not have synced
    console.log('\n4. Checking recent approved nominations...');
    
    const { data: recentApprovals } = await supabase
      .from('admin_nominations')
      .select('*')
      .eq('state', 'approved')
      .order('approved_at', { ascending: false })
      .limit(10);

    if (recentApprovals && recentApprovals.length > 0) {
      console.log(`   Found ${recentApprovals.length} recent approvals:`);
      
      for (const approval of recentApprovals) {
        console.log(`     - ${approval.nominee_display_name} (${approval.approved_at})`);
        console.log(`       Nominator: ${approval.nominator_email}`);
        console.log(`       Nominee: ${approval.nominee_email || 'No email'}`);
        
        // Check if there's a loops_outbox entry for this approval
        const { data: outboxEntry } = await supabase
          .from('loops_outbox')
          .select('*')
          .eq('event_type', 'nomination_approved')
          .eq('payload->nominationId', approval.nomination_id)
          .single();

        if (outboxEntry) {
          console.log(`         Loops outbox: ${outboxEntry.status}`);
        } else {
          console.log(`         ❌ No loops outbox entry`);
        }
      }
    }

    console.log('\n✅ Specific approval issues debug completed');

  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
}

// Run the debug
debugSpecificApprovalIssues().catch(console.error);