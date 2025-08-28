#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function testNomineeFix() {
  try {
    console.log('🔍 Testing nominee profile fixes...\n');
    
    // Find Anil Kumar
    const { data: anilNominees, error: anilError } = await supabase
      .from('public_nominees')
      .select('*')
      .ilike('display_name', '%anil%kumar%');
    
    if (anilError) {
      console.log('❌ Error finding Anil Kumar:', anilError.message);
      return;
    }
    
    if (!anilNominees || anilNominees.length === 0) {
      console.log('❌ Anil Kumar not found in database');
      return;
    }
    
    const anil = anilNominees[0];
    console.log('✅ Found Anil Kumar:');
    console.log('- ID:', anil.nomination_id);
    console.log('- Name:', anil.display_name);
    console.log('- Type:', anil.type);
    console.log('- Category:', anil.subcategory_id);
    console.log('- Votes:', anil.votes);
    console.log('- Image URL:', anil.image_url || 'None');
    console.log('- LinkedIn:', anil.linkedin_url || 'None');
    console.log('- Why Vote:', anil.why_vote || 'None');
    console.log('- Live URL:', anil.live_url || 'None');
    
    // Test the API endpoint
    console.log('\n🔍 Testing API endpoint...');
    
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('http://localhost:3001/api/nominees', {
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      console.log('❌ API endpoint failed:', response.status, response.statusText);
      return;
    }
    
    const result = await response.json();
    
    if (!result.success) {
      console.log('❌ API returned error:', result.error);
      return;
    }
    
    console.log('✅ API endpoint working, found', result.data.length, 'nominees');
    
    // Find Anil in API results
    const anilFromAPI = result.data.find(n => 
      n.id === anil.nomination_id || 
      (n.nominee && n.nominee.name && n.nominee.name.toLowerCase().includes('anil'))
    );
    
    if (anilFromAPI) {
      console.log('✅ Anil Kumar found in API results:');
      console.log('- API ID:', anilFromAPI.id);
      console.log('- API Name:', anilFromAPI.nominee?.name || anilFromAPI.name);
      console.log('- API Category:', anilFromAPI.category);
      console.log('- API Type:', anilFromAPI.type);
      console.log('- API Votes:', anilFromAPI.votes);
      
      // Test the profile URL
      console.log('\n🔍 Testing profile URL...');
      const profileUrl = `http://localhost:3001/nominee/${anilFromAPI.id}`;
      console.log('Profile URL:', profileUrl);
      
      try {
        const profileResponse = await fetch(profileUrl);
        if (profileResponse.ok) {
          console.log('✅ Profile page loads successfully');
        } else {
          console.log('❌ Profile page failed:', profileResponse.status);
        }
      } catch (error) {
        console.log('❌ Profile page error:', error.message);
      }
    } else {
      console.log('❌ Anil Kumar not found in API results');
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testNomineeFix();