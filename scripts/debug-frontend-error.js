#!/usr/bin/env node

/**
 * DEBUG FRONTEND ERROR
 * This script creates test data and checks the API response structure
 * to identify frontend compatibility issues
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugFrontendError() {
  console.log('🔍 DEBUGGING FRONTEND ERROR\n');
  
  let testData = {
    nominatorId: null,
    nomineeId: null,
    nominationId: null
  };
  
  try {
    // 1. Create test data
    console.log('📝 Creating test data...');
    
    const { data: nominator, error: nominatorError } = await supabase
      .from('nominators')
      .insert({
        email: 'frontend.test@example.com',
        firstname: 'Frontend',
        lastname: 'Tester',
        company: 'Test Company',
        job_title: 'Developer',
        linkedin: 'https://linkedin.com/in/frontendtester',
        country: 'USA'
      })
      .select()
      .single();
      
    if (nominatorError) throw new Error(`Failed to create nominator: ${nominatorError.message}`);
    testData.nominatorId = nominator.id;
    
    const { data: nominee, error: nomineeError } = await supabase
      .from('nominees')
      .insert({
        type: 'person',
        firstname: 'Test',
        lastname: 'Nominee',
        person_email: 'test.nominee@example.com',
        person_linkedin: 'https://linkedin.com/in/testnominee',
        jobtitle: 'Senior Developer',
        person_company: 'Tech Corp',
        person_country: 'USA',
        headshot_url: 'https://example.com/headshot.jpg',
        why_me: 'I am excellent at what I do.',
        live_url: 'https://techcorp.com/test-nominee'
      })
      .select()
      .single();
      
    if (nomineeError) throw new Error(`Failed to create nominee: ${nomineeError.message}`);
    testData.nomineeId = nominee.id;
    
    const { data: nomination, error: nominationError } = await supabase
      .from('nominations')
      .insert({
        nominator_id: testData.nominatorId,
        nominee_id: testData.nomineeId,
        category_group_id: 'individual-awards',
        subcategory_id: 'top-recruiter',
        state: 'submitted'
      })
      .select()
      .single();
      
    if (nominationError) throw new Error(`Failed to create nomination: ${nominationError.message}`);
    testData.nominationId = nomination.id;
    
    console.log('✅ Test data created successfully');
    
    // 2. Test API response
    console.log('\n🌐 Testing API response structure...');
    
    const response = await fetch('http://localhost:3000/api/admin/nominations');
    const data = await response.json();
    
    console.log('📊 API Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success && data.data.length > 0) {
      const firstNomination = data.data[0];
      console.log('\n🔍 First nomination structure:');
      console.log('Available properties:');
      Object.keys(firstNomination).forEach(key => {
        console.log(`   ${key}: ${typeof firstNomination[key]} = ${firstNomination[key]}`);
      });
      
      // Check for properties that frontend expects
      console.log('\n🔍 Frontend compatibility check:');
      const expectedProps = [
        'id', 'type', 'state', 'subcategory_id', 'firstname', 'lastname', 
        'company_name', 'votes', 'headshot_url', 'logo_url', 'created_at',
        'displayName', 'imageUrl', 'liveUrl', 'whyMe', 'whyUs', 'jobtitle',
        'personEmail', 'companyWebsite'
      ];
      
      expectedProps.forEach(prop => {
        const exists = prop in firstNomination;
        const value = firstNomination[prop];
        console.log(`   ${exists ? '✅' : '❌'} ${prop}: ${exists ? typeof value : 'MISSING'} ${exists ? `= ${value}` : ''}`);
      });
    }
    
    // 3. Test direct database view
    console.log('\n🗄️ Testing direct database view...');
    
    const { data: adminView, error: viewError } = await supabase
      .from('admin_nominations')
      .select('*')
      .limit(1);
      
    if (viewError) {
      console.log(`❌ View error: ${viewError.message}`);
    } else if (adminView.length > 0) {
      console.log('📋 Database view structure:');
      Object.keys(adminView[0]).forEach(key => {
        console.log(`   ${key}: ${adminView[0][key]}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    try {
      if (testData.nominationId) {
        await supabase.from('nominations').delete().eq('id', testData.nominationId);
      }
      if (testData.nomineeId) {
        await supabase.from('nominees').delete().eq('id', testData.nomineeId);
      }
      if (testData.nominatorId) {
        await supabase.from('nominators').delete().eq('id', testData.nominatorId);
      }
      console.log('✅ Cleanup complete');
    } catch (cleanupError) {
      console.error('⚠️ Cleanup error:', cleanupError.message);
    }
  }
}

debugFrontendError().catch(console.error);