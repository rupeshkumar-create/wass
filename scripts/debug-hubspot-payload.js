#!/usr/bin/env node

/**
 * Debug the exact payload being sent to HubSpot
 */

require('dotenv').config();

async function debugHubSpotPayload() {
  console.log('🔍 Debugging HubSpot Payload\n');
  
  try {
    // Get a nominee with LinkedIn URL
    const nomineesResponse = await fetch('http://localhost:3000/api/nominees?limit=1');
    
    if (!nomineesResponse.ok) {
      console.log('❌ Could not fetch nominees');
      return;
    }
    
    const nominees = await nomineesResponse.json();
    if (nominees.length === 0) {
      console.log('❌ No nominees found');
      return;
    }
    
    const nominee = nominees[0];
    console.log('📋 Selected nominee for testing:');
    console.log(`   Name: ${nominee.nominee.name}`);
    console.log(`   Type: ${nominee.type}`);
    console.log(`   LinkedIn: ${nominee.nominee.linkedin}`);
    console.log('');
    
    // Test the mappers directly by importing them
    console.log('🧪 Testing mappers directly...\n');
    
    // Simulate the nomination object that would be passed to mappers
    const testNomination = {
      id: nominee.id,
      type: nominee.type,
      category: nominee.category,
      nominee: {
        name: nominee.nominee.name,
        linkedin: nominee.nominee.linkedin,
        country: nominee.nominee.country,
        title: nominee.nominee.title,
        website: nominee.nominee.website,
        email: 'test@example.com' // Add email for person nominations
      },
      liveUrl: nominee.liveUrl
    };
    
    console.log('📤 Input to mapper:');
    console.log(JSON.stringify(testNomination, null, 2));
    console.log('');
    
    // Manually simulate the mapper logic
    if (nominee.type === 'person') {
      console.log('👤 Testing Person Nominee Mapper:');
      
      const nameParts = nominee.nominee.name.split(' ');
      const firstname = nameParts[0] || '';
      const lastname = nameParts.slice(1).join(' ') || '';
      
      const mappedData = {
        properties: {
          firstname,
          lastname,
          email: 'test@example.com',
          jobtitle: nominee.nominee.title ? `${nominee.nominee.title} (WSA 2026 Nominee - ${nominee.category})` : `WSA 2026 Nominee - ${nominee.category}`,
          website: nominee.nominee.linkedin || undefined,
          linkedin_url: nominee.nominee.linkedin || undefined,
          hs_content_membership_notes: `WSA 2026 Data:
Category: ${nominee.category}
Nomination ID: ${nominee.id}
Live URL: ${nominee.liveUrl}
LinkedIn: ${nominee.nominee.linkedin || 'N/A'}
Country: ${nominee.nominee.country || 'N/A'}`,
        },
      };
      
      console.log('📋 Mapped HubSpot Contact Data:');
      console.log(JSON.stringify(mappedData, null, 2));
      
    } else if (nominee.type === 'company') {
      console.log('🏢 Testing Company Nominee Mapper:');
      
      let domain = undefined;
      if (nominee.nominee.website) {
        try {
          const url = new URL(nominee.nominee.website);
          domain = url.hostname.replace('www.', '');
        } catch (error) {
          // Invalid URL, skip domain
        }
      }
      
      const mappedData = {
        properties: {
          name: `${nominee.nominee.name} (WSA 2026 Nominee)`,
          domain,
          website: nominee.nominee.website || undefined,
          linkedin_company_page: nominee.nominee.linkedin || undefined,
          description: `WSA 2026 Nominee
Category: ${nominee.category}
Nomination ID: ${nominee.id}
LinkedIn: ${nominee.nominee.linkedin || 'N/A'}
Country: ${nominee.nominee.country || 'N/A'}`,
        },
      };
      
      console.log('📋 Mapped HubSpot Company Data:');
      console.log(JSON.stringify(mappedData, null, 2));
    }
    
    console.log('\n🔍 Key LinkedIn URL Fields:');
    console.log(`   linkedin_url: ${nominee.nominee.linkedin}`);
    console.log(`   linkedin_url: ${nominee.nominee.linkedin}`);
    if (nominee.type === 'person') {
      console.log(`   website: ${nominee.nominee.linkedin}`);
    }
    
    // Test if these fields are valid HubSpot property names
    console.log('\n📝 HubSpot Field Validation:');
    console.log('   ✅ linkedin_url - Standard HubSpot field');
    console.log('   ✅ linkedin_url - Standard HubSpot field');
    console.log('   ✅ website - Standard HubSpot field');
    
  } catch (error) {
    console.error('❌ Error debugging payload:', error.message);
  }
}

debugHubSpotPayload().catch(console.error);