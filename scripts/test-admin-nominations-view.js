#!/usr/bin/env node

/**
 * TEST ADMIN NOMINATIONS VIEW
 * This script tests the admin_nominations view to see its structure
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAdminNominationsView() {
  console.log('🔍 TESTING ADMIN NOMINATIONS VIEW\n');
  
  try {
    // First, let's create some test data to see the view in action
    console.log('📝 Creating test data...');
    
    // Create a test nominator
    const { data: nominator, error: nominatorError } = await supabase
      .from('nominators')
      .insert({
        email: 'test.nominator@example.com',
        firstname: 'Test',
        lastname: 'Nominator',
        company: 'Test Company',
        job_title: 'Test Role',
        linkedin: 'https://linkedin.com/in/test',
        country: 'USA'
      })
      .select()
      .single();
      
    if (nominatorError) {
      console.log(`❌ Failed to create nominator: ${nominatorError.message}`);
      return;
    }
    
    console.log(`✅ Created nominator: ${nominator.id}`);
    
    // Create a test nominee
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
        why_me: 'I am an excellent developer with great skills'
      })
      .select()
      .single();
      
    if (nomineeError) {
      console.log(`❌ Failed to create nominee: ${nomineeError.message}`);
      // Clean up nominator
      await supabase.from('nominators').delete().eq('id', nominator.id);
      return;
    }
    
    console.log(`✅ Created nominee: ${nominee.id}`);
    
    // Create a test nomination
    const { data: nomination, error: nominationError } = await supabase
      .from('nominations')
      .insert({
        nominator_id: nominator.id,
        nominee_id: nominee.id,
        category_group_id: 'individual-awards',
        subcategory_id: 'top-recruiter',
        state: 'submitted'
      })
      .select()
      .single();
      
    if (nominationError) {
      console.log(`❌ Failed to create nomination: ${nominationError.message}`);
      // Clean up
      await supabase.from('nominees').delete().eq('id', nominee.id);
      await supabase.from('nominators').delete().eq('id', nominator.id);
      return;
    }
    
    console.log(`✅ Created nomination: ${nomination.id}`);
    
    // Now test the admin_nominations view
    console.log('\n🔍 Testing admin_nominations view...');
    
    const { data: adminNominations, error: viewError } = await supabase
      .from('admin_nominations')
      .select('*')
      .eq('nomination_id', nomination.id);
      
    if (viewError) {
      console.log(`❌ Failed to query admin_nominations view: ${viewError.message}`);
    } else {
      console.log(`✅ Successfully queried admin_nominations view`);
      console.log(`📊 Found ${adminNominations.length} records`);
      
      if (adminNominations.length > 0) {
        const record = adminNominations[0];
        console.log('\n📋 Available columns:');
        Object.keys(record).forEach(key => {
          console.log(`   ${key}: ${record[key]}`);
        });
      }
    }
    
    // Test the API endpoint directly
    console.log('\n🌐 Testing API endpoint...');
    
    try {
      const response = await fetch('http://localhost:3000/api/admin/nominations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`📡 API Response Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ API Success: ${JSON.stringify(data, null, 2)}`);
      } else {
        const errorText = await response.text();
        console.log(`❌ API Error: ${errorText}`);
      }
    } catch (apiError) {
      console.log(`❌ API Network Error: ${apiError.message}`);
    }
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('nominations').delete().eq('id', nomination.id);
    await supabase.from('nominees').delete().eq('id', nominee.id);
    await supabase.from('nominators').delete().eq('id', nominator.id);
    console.log('✅ Cleanup complete');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAdminNominationsView().catch(console.error);