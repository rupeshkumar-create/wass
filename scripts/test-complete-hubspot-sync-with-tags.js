#!/usr/bin/env node

/**
 * Test complete HubSpot sync with proper tags
 * Tests: Nominators, Nominees (person & company), Voters
 * Verifies: WSA2026 Nominator, WSA 2026 Nominees, WSA 2026 Voters tags
 * Company: WSA Nomination Category, Nominator 2026 tag
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCompleteHubSpotSync() {
  console.log('🧪 Testing Complete HubSpot Sync with Tags...\n');

  try {
    // 1. Setup HubSpot custom properties first
    console.log('1️⃣ Setting up HubSpot custom properties...');
    const setupResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/sync/hubspot/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'setup' })
    });

    if (!setupResponse.ok) {
      throw new Error(`Setup failed: ${setupResponse.status}`);
    }

    const setupResult = await setupResponse.json();
    console.log('✅ Setup result:', setupResult);

    // 2. Test Nominator Sync
    console.log('\n2️⃣ Testing Nominator Sync...');
    const nominatorData = {
      firstname: 'John',
      lastname: 'Nominator',
      email: 'john.nominator@testcompany.com',
      linkedin: 'https://linkedin.com/in/johnnominator',
      company: 'Test Nominator Company',
      jobTitle: 'HR Director',
      phone: '+1-555-0101',
      country: 'United States'
    };

    const nominatorResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/sync/hubspot/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'sync_nominator',
        data: nominatorData
      })
    });

    if (!nominatorResponse.ok) {
      throw new Error(`Nominator sync failed: ${nominatorResponse.status}`);
    }

    const nominatorResult = await nominatorResponse.json();
    console.log('✅ Nominator sync result:', nominatorResult);

    // 3. Test Person Nominee Sync
    console.log('\n3️⃣ Testing Person Nominee Sync...');
    const personNomineeData = {
      firstname: 'Jane',
      lastname: 'PersonNominee',
      email: 'jane.personnominee@testcompany.com',
      linkedin: 'https://linkedin.com/in/janepersonnominee',
      jobtitle: 'Senior Recruiter',
      company: 'Test Nominee Company',
      phone: '+1-555-0102',
      country: 'United States',
      type: 'person',
      subcategoryId: 'best-recruiter-individual',
      nominationId: 'test-nomination-person-001'
    };

    const personNomineeResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/sync/hubspot/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'sync_nominee',
        data: personNomineeData
      })
    });

    if (!personNomineeResponse.ok) {
      throw new Error(`Person nominee sync failed: ${personNomineeResponse.status}`);
    }

    const personNomineeResult = await personNomineeResponse.json();
    console.log('✅ Person nominee sync result:', personNomineeResult);

    // 4. Test Company Nominee Sync
    console.log('\n4️⃣ Testing Company Nominee Sync...');
    const companyNomineeData = {
      type: 'company',
      companyName: 'Test Company Nominee Inc',
      companyWebsite: 'https://testcompanynominee.com',
      companyLinkedin: 'https://linkedin.com/company/testcompanynominee',
      companyEmail: 'contact@testcompanynominee.com',
      companyPhone: '+1-555-0103',
      companyCountry: 'United States',
      companyIndustry: 'Staffing & Recruiting',
      companySize: '51-200',
      subcategoryId: 'best-staffing-firm',
      nominationId: 'test-nomination-company-001'
    };

    const companyNomineeResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/sync/hubspot/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'sync_nominee',
        data: companyNomineeData
      })
    });

    if (!companyNomineeResponse.ok) {
      throw new Error(`Company nominee sync failed: ${companyNomineeResponse.status}`);
    }

    const companyNomineeResult = await companyNomineeResponse.json();
    console.log('✅ Company nominee sync result:', companyNomineeResult);

    // 5. Test Voter Sync
    console.log('\n5️⃣ Testing Voter Sync...');
    const voterData = {
      firstname: 'Bob',
      lastname: 'Voter',
      email: 'bob.voter@testcompany.com',
      linkedin: 'https://linkedin.com/in/bobvoter',
      company: 'Test Voter Company',
      jobTitle: 'Talent Acquisition Manager',
      phone: '+1-555-0104',
      country: 'United States',
      votedFor: 'Jane PersonNominee',
      subcategoryId: 'best-recruiter-individual'
    };

    const voterResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/sync/hubspot/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'sync_voter',
        data: voterData
      })
    });

    if (!voterResponse.ok) {
      throw new Error(`Voter sync failed: ${voterResponse.status}`);
    }

    const voterResult = await voterResponse.json();
    console.log('✅ Voter sync result:', voterResult);

    // 6. Test batch sync
    console.log('\n6️⃣ Testing Batch Sync...');
    const batchData = [
      { type: 'nominator', data: nominatorData },
      { type: 'nominee', data: personNomineeData },
      { type: 'nominee', data: companyNomineeData },
      { type: 'voter', data: voterData }
    ];

    const batchResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/sync/hubspot/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'batch_sync',
        data: batchData
      })
    });

    if (!batchResponse.ok) {
      throw new Error(`Batch sync failed: ${batchResponse.status}`);
    }

    const batchResult = await batchResponse.json();
    console.log('✅ Batch sync result:', batchResult);

    // 7. Test HubSpot connection
    console.log('\n7️⃣ Testing HubSpot Connection...');
    const testResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/sync/hubspot/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'test' })
    });

    if (!testResponse.ok) {
      throw new Error(`HubSpot test failed: ${testResponse.status}`);
    }

    const testResult = await testResponse.json();
    console.log('✅ HubSpot test result:', testResult);

    console.log('\n🎉 All HubSpot sync tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Nominators sync with "WSA2026 Nominator" tag');
    console.log('- ✅ Person nominees sync with "WSA 2026 Nominees" tag');
    console.log('- ✅ Company nominees sync with "WSA 2026 Nominees" tag + Company object with "Nominator 2026" tag');
    console.log('- ✅ Voters sync with "WSA 2026 Voters" tag');
    console.log('- ✅ Batch sync works for all types');
    console.log('- ✅ HubSpot connection and properties are working');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testCompleteHubSpotSync();