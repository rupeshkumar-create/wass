#!/usr/bin/env node

/**
 * Test nomination approval specifically
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testNominationApproval() {
  console.log('🔍 Testing Nomination Approval...');
  
  try {
    // First, get a pending nomination
    const { data: nominations, error: fetchError } = await supabase
      .from('nominations')
      .select('*')
      .eq('state', 'pending')
      .limit(1);

    if (fetchError) throw fetchError;

    if (!nominations || nominations.length === 0) {
      console.log('ℹ️ No pending nominations found. Creating a test nomination first...');
      
      // Create a test nomination
      const testNomination = {
        type: 'person',
        categoryGroupId: 'individual-awards',
        subcategoryId: 'best-recruiter',
        nominator: {
          firstname: 'Test',
          lastname: 'Nominator',
          email: 'test.nominator@example.com',
          linkedin: 'https://linkedin.com/in/testnominator',
          company: 'Test Company',
          jobTitle: 'Test Role',
          phone: '+1-555-0123',
          country: 'United States'
        },
        nominee: {
          firstname: 'Test',
          lastname: 'Nominee',
          email: 'test.nominee@example.com',
          linkedin: 'https://linkedin.com/in/testnominee',
          jobtitle: 'Test Position',
          company: 'Test Corp',
          country: 'United States',
          headshotUrl: 'https://example.com/headshot.jpg',
          whyMe: 'Test reason',
          bio: 'Test bio',
          achievements: 'Test achievements'
        }
      };

      const submitResponse = await fetch('http://localhost:3000/api/nomination/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testNomination)
      });

      const submitResult = await submitResponse.json();
      
      if (!submitResponse.ok) {
        console.error('❌ Failed to create test nomination:', submitResult.error);
        return false;
      }

      console.log('✅ Test nomination created:', submitResult.nominationId);
      
      // Now try to approve it
      const approvalResponse = await fetch('http://localhost:3000/api/nomination/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nominationId: submitResult.nominationId,
          liveUrl: 'https://worldstaffingawards.com/nominee/test-nominee'
        })
      });

      const approvalResult = await approvalResponse.json();
      
      if (approvalResponse.ok) {
        console.log('✅ Nomination approved successfully:', approvalResult);
        return true;
      } else {
        console.error('❌ Nomination approval failed:', approvalResult.error);
        console.error('Response status:', approvalResponse.status);
        return false;
      }
    } else {
      // Use existing pending nomination
      const nomination = nominations[0];
      console.log('Found pending nomination:', nomination.id);
      
      const approvalResponse = await fetch('http://localhost:3000/api/nomination/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nominationId: nomination.id,
          liveUrl: 'https://worldstaffingawards.com/nominee/test-approval'
        })
      });

      const approvalResult = await approvalResponse.json();
      
      if (approvalResponse.ok) {
        console.log('✅ Nomination approved successfully:', approvalResult);
        return true;
      } else {
        console.error('❌ Nomination approval failed:', approvalResult.error);
        console.error('Response status:', approvalResponse.status);
        return false;
      }
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Nomination Approval Test');
  console.log('=====================================');

  const success = await testNominationApproval();
  
  if (success) {
    console.log('\n🎉 Nomination approval test passed!');
  } else {
    console.log('\n❌ Nomination approval test failed.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});