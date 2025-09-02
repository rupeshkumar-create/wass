#!/usr/bin/env node

/**
 * Check Nominator Live Status
 * Verify if nominators with approved nominees have been updated to "Nominator Live"
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkNominatorLiveStatus() {
  console.log('🔍 Checking Nominator Live Status...\n');

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
    // Get nominators who have approved nominations
    const { data: nominatorsWithApproved, error } = await supabase
      .from('nominators')
      .select(`
        *,
        nominations!inner(
          id,
          state,
          approved_at,
          nominees!inner(
            firstname,
            lastname,
            company_name,
            type
          )
        )
      `)
      .eq('nominations.state', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching nominators:', error);
      return;
    }

    console.log(`Found ${nominatorsWithApproved?.length || 0} nominators with approved nominations`);

    if (nominatorsWithApproved && nominatorsWithApproved.length > 0) {
      for (const nominator of nominatorsWithApproved) {
        console.log(`\nNominator: ${nominator.email} (${nominator.firstname} ${nominator.lastname})`);
        
        // Show their approved nominations
        const approvedNominations = nominator.nominations.filter(n => n.state === 'approved');
        console.log(`  Has ${approvedNominations.length} approved nomination(s):`);
        
        for (const nomination of approvedNominations) {
          const nominee = nomination.nominees;
          const nomineeName = nominee.type === 'person' 
            ? `${nominee.firstname || ''} ${nominee.lastname || ''}`.trim()
            : nominee.company_name || '';
          console.log(`    - ${nomineeName} (approved: ${nomination.approved_at})`);
        }

        // Check their status in Loops
        try {
          const response = await fetch(`${baseUrl}/contacts/find?email=${nominator.email}`, {
            headers,
          });

          if (response.ok) {
            const contacts = await response.json();
            if (contacts && contacts.length > 0) {
              const contact = contacts[0];
              console.log(`  ✅ Found in Loops - userGroup: "${contact.userGroup}"`);
              
              if (contact.userGroup === 'Nominator Live') {
                console.log(`    ✅ Correct "Nominator Live" status`);
                if (contact.nomineeName) {
                  console.log(`    - Nominee Name: ${contact.nomineeName}`);
                }
                if (contact.nomineeLiveUrl) {
                  console.log(`    - Nominee Live URL: ${contact.nomineeLiveUrl}`);
                }
              } else if (contact.userGroup === 'Nominator') {
                console.log(`    ❌ Should be "Nominator Live" but is "${contact.userGroup}"`);
                
                // Let's update them manually
                console.log(`    🔧 Updating to "Nominator Live"...`);
                
                const firstApprovedNomination = approvedNominations[0];
                const nominee = firstApprovedNomination.nominees;
                const nomineeName = nominee.type === 'person' 
                  ? `${nominee.firstname || ''} ${nominee.lastname || ''}`.trim()
                  : nominee.company_name || '';

                const updateResult = await fetch(`${baseUrl}/contacts/update`, {
                  method: 'PUT',
                  headers,
                  body: JSON.stringify({
                    email: nominator.email.toLowerCase(),
                    userGroup: 'Nominator Live',
                    nomineeName: nomineeName,
                    nomineeLiveUrl: `https://worldstaffingawards.com/nominee/${firstApprovedNomination.id}`,
                    approvalDate: firstApprovedNomination.approved_at,
                  }),
                });

                if (updateResult.ok) {
                  console.log(`    ✅ Successfully updated to "Nominator Live"`);
                } else {
                  console.log(`    ❌ Failed to update: ${updateResult.status}`);
                }
              } else {
                console.log(`    ⚠️ Unexpected userGroup: "${contact.userGroup}"`);
              }
            } else {
              console.log(`    ❌ Not found in Loops`);
            }
          } else {
            console.log(`    ❌ Failed to check Loops: ${response.status}`);
          }
        } catch (error) {
          console.log(`    ❌ Error checking Loops: ${error.message}`);
        }
      }
    }

    console.log('\n✅ Nominator Live status check completed');

  } catch (error) {
    console.error('❌ Error during check:', error);
  }
}

// Run the check
checkNominatorLiveStatus().catch(console.error);