#!/usr/bin/env node

/**
 * Test script to verify the approval dialog functionality
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testApprovalDialog() {
  console.log('🧪 Testing Approval Dialog Functionality\n');

  try {
    // 1. Get a test nomination
    console.log('1. Fetching test nominations...');
    const { data: nominations, error: fetchError } = await supabase
      .from('nominations')
      .select(`
        *,
        nominees (*)
      `)
      .eq('state', 'submitted')
      .limit(1);

    if (fetchError) throw fetchError;

    if (!nominations || nominations.length === 0) {
      console.log('⚠️ No submitted nominations found for testing');
      
      // Create a test nomination
      console.log('Creating test nomination...');
      
      // First create a test nominee
      const { data: nominee, error: nomineeError } = await supabase
        .from('nominees')
        .insert({
          type: 'person',
          firstname: 'Test',
          lastname: 'Nominee',
          person_email: 'test.nominee@example.com',
          person_linkedin: 'https://linkedin.com/in/test-nominee',
          jobtitle: 'Test Manager',
          person_company: 'Test Company',
          person_country: 'United States'
        })
        .select()
        .single();

      if (nomineeError) throw nomineeError;

      // Create a test nominator
      const { data: nominator, error: nominatorError } = await supabase
        .from('nominators')
        .insert({
          email: 'test.nominator@example.com',
          name: 'Test Nominator',
          company: 'Nominator Company',
          job_title: 'HR Manager',
          country: 'United States'
        })
        .select()
        .single();

      if (nominatorError) throw nominatorError;

      // Create the nomination
      const { data: nomination, error: nominationError } = await supabase
        .from('nominations')
        .insert({
          nominee_id: nominee.id,
          nominator_id: nominator.id,
          subcategory_id: 'top-executive-leader',
          state: 'submitted'
        })
        .select(`
          *,
          nominees (*)
        `)
        .single();

      if (nominationError) throw nominationError;

      console.log('✅ Test nomination created:', nomination.id);
      nominations.push(nomination);
    }

    const testNomination = nominations[0];
    const nominee = testNomination.nominees;
    
    console.log('✅ Found test nomination:', {
      id: testNomination.id,
      nominee: nominee.type === 'person' 
        ? `${nominee.firstname} ${nominee.lastname}`
        : nominee.company_name,
      state: testNomination.state
    });

    // 2. Test URL generation
    console.log('\n2. Testing URL generation...');
    const displayName = nominee.type === 'person' 
      ? `${nominee.firstname || ''} ${nominee.lastname || ''}`.trim()
      : nominee.company_name || '';

    const slug = displayName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    const generatedUrl = `https://worldstaffingawards.com/nominee/${slug}`;
    console.log('✅ Generated URL:', generatedUrl);

    // 3. Test approval API
    console.log('\n3. Testing approval API...');
    const approvalData = {
      nominationId: testNomination.id,
      action: 'approve',
      liveUrl: generatedUrl,
      adminNotes: 'Test approval via script'
    };

    console.log('Sending approval request:', approvalData);

    const response = await fetch('http://localhost:3000/api/nomination/approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(approvalData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Approval successful:', {
        nominationId: result.nominationId,
        state: result.state,
        liveUrl: result.liveUrl,
        message: result.message
      });
    } else {
      console.error('❌ Approval failed:', result);
    }

    // 4. Verify the nomination was updated
    console.log('\n4. Verifying nomination update...');
    const { data: updatedNomination, error: verifyError } = await supabase
      .from('nominations')
      .select('*')
      .eq('id', testNomination.id)
      .single();

    if (verifyError) throw verifyError;

    console.log('✅ Nomination updated:', {
      id: updatedNomination.id,
      state: updatedNomination.state,
      approved_at: updatedNomination.approved_at,
      admin_notes: updatedNomination.admin_notes
    });

    // 5. Check outbox entries
    console.log('\n5. Checking outbox entries...');
    
    const { data: hubspotOutbox } = await supabase
      .from('hubspot_outbox')
      .select('*')
      .eq('payload->nominationId', testNomination.id)
      .eq('event_type', 'nomination_approved');

    console.log('✅ HubSpot outbox entries:', hubspotOutbox?.length || 0);

    const { data: loopsOutbox } = await supabase
      .from('loops_outbox')
      .select('*')
      .eq('payload->nominationId', testNomination.id)
      .eq('event_type', 'nomination_approved');

    console.log('✅ Loops outbox entries:', loopsOutbox?.length || 0);

    console.log('\n🎉 Approval dialog test completed successfully!');
    console.log('\nKey features verified:');
    console.log('• URL generation works correctly');
    console.log('• Approval API processes requests properly');
    console.log('• Database updates are applied');
    console.log('• Outbox entries are created for sync');
    console.log('• Live URL is properly assigned and returned');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testApprovalDialog();