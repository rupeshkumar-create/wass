#!/usr/bin/env node

/**
 * Final Loops Verification
 * Comprehensive verification of all Loops integration fixes
 */

require('dotenv').config({ path: '.env.local' });

async function finalLoopsVerification() {
  console.log('🎯 Final Loops Integration Verification\n');

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
    console.log('✅ VERIFICATION RESULTS:\n');

    // 1. Verify Voters
    console.log('1. VOTERS - User Group: "Voters"');
    const voterEmails = [
      'test.voter.1756405118335@example.com',
      'test.voter.1756404860273@example.com',
      'yjbib@powerscrews.com'
    ];

    let votersCorrect = 0;
    for (const email of voterEmails) {
      try {
        const response = await fetch(`${baseUrl}/contacts/find?email=${email}`, { headers });
        if (response.ok) {
          const contacts = await response.json();
          if (contacts && contacts.length > 0 && contacts[0].userGroup === 'Voters') {
            console.log(`   ✅ ${email} - Correct "Voters" user group`);
            votersCorrect++;
          } else {
            console.log(`   ❌ ${email} - Incorrect user group: ${contacts[0]?.userGroup || 'Not found'}`);
          }
        }
      } catch (error) {
        console.log(`   ❌ ${email} - Error: ${error.message}`);
      }
    }
    console.log(`   Result: ${votersCorrect}/${voterEmails.length} voters correctly synced\n`);

    // 2. Verify Nominees
    console.log('2. NOMINEES - User Group: "Nominess" + Live URLs');
    const nomineeEmails = [
      'jane.smith.loops.test@example.com',
      'test.nominee.1756404860273@example.com',
      'test.nominee.1756405118335@example.com'
    ];

    let nomineesCorrect = 0;
    for (const email of nomineeEmails) {
      try {
        const response = await fetch(`${baseUrl}/contacts/find?email=${email}`, { headers });
        if (response.ok) {
          const contacts = await response.json();
          if (contacts && contacts.length > 0) {
            const contact = contacts[0];
            const hasCorrectUserGroup = contact.userGroup === 'Nominess';
            const hasLiveUrl = !!contact.liveUrl;
            
            if (hasCorrectUserGroup && hasLiveUrl) {
              console.log(`   ✅ ${email} - Correct "Nominess" user group + Live URL`);
              nomineesCorrect++;
            } else {
              console.log(`   ❌ ${email} - UserGroup: ${contact.userGroup}, Live URL: ${hasLiveUrl ? 'Yes' : 'No'}`);
            }
          } else {
            console.log(`   ❌ ${email} - Not found`);
          }
        }
      } catch (error) {
        console.log(`   ❌ ${email} - Error: ${error.message}`);
      }
    }
    console.log(`   Result: ${nomineesCorrect}/${nomineeEmails.length} nominees correctly synced\n`);

    // 3. Verify Nominators Live
    console.log('3. NOMINATORS - User Group: "Nominator Live" + Nominee Details');
    const nominatorEmails = [
      'test.nominator.1756405118335@example.com',
      'test.nominator.1756404860273@example.com',
      'john.doe.loops.test@example.com'
    ];

    let nominatorsCorrect = 0;
    for (const email of nominatorEmails) {
      try {
        const response = await fetch(`${baseUrl}/contacts/find?email=${email}`, { headers });
        if (response.ok) {
          const contacts = await response.json();
          if (contacts && contacts.length > 0) {
            const contact = contacts[0];
            const hasCorrectUserGroup = contact.userGroup === 'Nominator Live';
            const hasNomineeDetails = !!(contact.nomineeName || contact.nomineeLiveUrl);
            
            if (hasCorrectUserGroup) {
              console.log(`   ✅ ${email} - Correct "Nominator Live" user group`);
              if (hasNomineeDetails) {
                console.log(`      - Nominee: ${contact.nomineeName || 'N/A'}`);
                console.log(`      - Live URL: ${contact.nomineeLiveUrl ? 'Yes' : 'No'}`);
              }
              nominatorsCorrect++;
            } else {
              console.log(`   ❌ ${email} - UserGroup: ${contact.userGroup}`);
            }
          } else {
            console.log(`   ❌ ${email} - Not found`);
          }
        }
      } catch (error) {
        console.log(`   ❌ ${email} - Error: ${error.message}`);
      }
    }
    console.log(`   Result: ${nominatorsCorrect}/${nominatorEmails.length} nominators correctly updated\n`);

    // 4. Summary
    console.log('🎯 FINAL SUMMARY:');
    console.log(`   ✅ Voters: ${votersCorrect}/${voterEmails.length} working correctly`);
    console.log(`   ✅ Nominees: ${nomineesCorrect}/${nomineeEmails.length} working correctly`);
    console.log(`   ✅ Nominators: ${nominatorsCorrect}/${nominatorEmails.length} working correctly`);
    
    const totalCorrect = votersCorrect + nomineesCorrect + nominatorsCorrect;
    const totalChecked = voterEmails.length + nomineeEmails.length + nominatorEmails.length;
    
    console.log(`\n   Overall: ${totalCorrect}/${totalChecked} (${Math.round(totalCorrect/totalChecked*100)}%) working correctly`);

    if (totalCorrect === totalChecked) {
      console.log('\n🎉 ALL LOOPS INTEGRATION ISSUES FIXED!');
      console.log('   ✅ Voters sync with "Voters" user group');
      console.log('   ✅ Nominees sync when approved with "Nominess" user group + live URLs');
      console.log('   ✅ Nominators update to "Nominator Live" when nominees are approved');
    } else {
      console.log('\n⚠️  Some issues remain - see details above');
    }

    console.log('\n✅ Final verification completed');

  } catch (error) {
    console.error('❌ Error during final verification:', error);
  }
}

// Run the verification
finalLoopsVerification().catch(console.error);