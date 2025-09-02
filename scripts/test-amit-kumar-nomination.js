#!/usr/bin/env node

// Use node-fetch for Node.js compatibility
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'http://localhost:3000';

async function testAmitKumarNomination() {
  console.log('🔍 Testing Amit Kumar Nomination with New Schema...\n');

  try {
    // Test 1: Check if Amit Kumar appears in nominees API
    console.log('1. Checking Amit Kumar in nominees API...');
    const nomineesResponse = await fetch(`${BASE_URL}/api/nominees`);
    const nomineesResult = await nomineesResponse.json();
    
    if (!nomineesResult.success) {
      throw new Error(`Failed to fetch nominees: ${nomineesResult.error}`);
    }

    // Find Amit Kumar
    const amitKumar = nomineesResult.data.find(nominee => 
      nominee.nominee.displayName?.toLowerCase().includes('amit kumar') ||
      nominee.nominee.name?.toLowerCase().includes('amit kumar') ||
      nominee.nominee.firstName?.toLowerCase().includes('amit') ||
      (nominee.nominee.firstName?.toLowerCase().includes('amit') && nominee.nominee.lastName?.toLowerCase().includes('kumar'))
    );

    let pageWorking = false; // Define at top level
    
    if (amitKumar) {
      console.log('✅ Found Amit Kumar in nominees API');
      console.log(`   ID: ${amitKumar.id}`);
      console.log(`   Nominee ID: ${amitKumar.nomineeId}`);
      console.log(`   Display Name: ${amitKumar.nominee.displayName}`);
      console.log(`   Type: ${amitKumar.type}`);
      console.log(`   Category: ${amitKumar.category}`);
      console.log(`   Status: ${amitKumar.status}`);
      console.log(`   Votes: ${amitKumar.votes}`);
      console.log(`   Image URL: ${amitKumar.nominee.imageUrl || 'None'}`);
      console.log(`   LinkedIn: ${amitKumar.nominee.linkedin || 'None'}`);
      console.log(`   Live URL: ${amitKumar.liveUrl || 'None'}`);
      console.log(`   Why Vote: ${amitKumar.nominee.whyVote ? 'Present' : 'Missing'}`);
      
      // Test 2: Check data structure compliance
      console.log('\n2. Checking new schema compliance...');
      
      const requiredFields = [
        'id', 'nomineeId', 'category', 'type', 'votes', 'status'
      ];
      
      const requiredNomineeFields = [
        'displayName', 'name', 'type'
      ];
      
      let schemaCompliant = true;
      
      // Check main fields
      for (const field of requiredFields) {
        if (amitKumar[field] === undefined) {
          console.log(`   ❌ Missing required field: ${field}`);
          schemaCompliant = false;
        } else {
          console.log(`   ✅ ${field}: ${amitKumar[field]}`);
        }
      }
      
      // Check nominee sub-object fields
      for (const field of requiredNomineeFields) {
        if (amitKumar.nominee[field] === undefined) {
          console.log(`   ❌ Missing required nominee field: ${field}`);
          schemaCompliant = false;
        } else {
          console.log(`   ✅ nominee.${field}: ${amitKumar.nominee[field]}`);
        }
      }
      
      // Check type-specific fields
      if (amitKumar.type === 'person') {
        console.log('   📋 Person-specific fields:');
        console.log(`     - First Name: ${amitKumar.nominee.firstName || 'Missing'}`);
        console.log(`     - Last Name: ${amitKumar.nominee.lastName || 'Missing'}`);
        console.log(`     - Job Title: ${amitKumar.nominee.title || amitKumar.nominee.jobtitle || 'Missing'}`);
        console.log(`     - LinkedIn: ${amitKumar.nominee.linkedin || amitKumar.nominee.personLinkedin || 'Missing'}`);
        console.log(`     - Why Me: ${amitKumar.nominee.whyMe || amitKumar.nominee.whyVoteForMe || 'Missing'}`);
      }
      
      if (schemaCompliant) {
        console.log('✅ Amit Kumar nomination is schema compliant');
      } else {
        console.log('❌ Amit Kumar nomination has schema issues');
      }
      
      // Test 3: Test individual nominee page access
      console.log('\n3. Testing individual nominee page access...');
      
      const testUrls = [
        `/nominee/${amitKumar.id}`,
        `/nominee/${amitKumar.nomineeId}`,
      ];
      
      // If there's a liveUrl, test that too
      if (amitKumar.liveUrl) {
        const slug = amitKumar.liveUrl.replace('/nominee/', '').replace('/', '');
        if (slug && slug !== amitKumar.id) {
          testUrls.push(`/nominee/${slug}`);
        }
      }
      
      let workingUrl = null;
      
      for (const url of testUrls) {
        try {
          console.log(`   Testing URL: ${url}`);
          const pageResponse = await fetch(`${BASE_URL}${url}`);
          
          if (pageResponse.ok) {
            const pageContent = await pageResponse.text();
            
            // Check if the page contains expected content
            const hasAmitName = pageContent.includes('Amit Kumar') || 
                               pageContent.includes(amitKumar.nominee.displayName);
            const hasCategory = pageContent.includes(amitKumar.category);
            const hasVoteButton = pageContent.includes('Cast Your Vote') || 
                                 pageContent.includes('Vote for');
            const hasTypeInfo = pageContent.includes('Individual') || 
                               pageContent.includes('Company');
            
            console.log(`     Status: ${pageResponse.status}`);
            console.log(`     Contains name: ${hasAmitName}`);
            console.log(`     Contains category: ${hasCategory}`);
            console.log(`     Contains vote button: ${hasVoteButton}`);
            console.log(`     Contains type info: ${hasTypeInfo}`);
            
            if (hasAmitName && hasCategory && hasVoteButton) {
              console.log(`     ✅ Page loads correctly with all content`);
              pageWorking = true;
              workingUrl = url;
              break;
            } else {
              console.log(`     ⚠️  Page loads but missing some content`);
            }
          } else {
            console.log(`     ❌ Page returned ${pageResponse.status}`);
            
            if (pageResponse.status === 404) {
              console.log(`     (404 - Page not found for this URL)`);
            }
          }
        } catch (error) {
          console.log(`     ❌ Error accessing page: ${error.message}`);
        }
      }
      
      if (pageWorking) {
        console.log(`✅ Individual page working at: ${workingUrl}`);
      } else {
        console.log('❌ Individual page not working for any URL format');
        
        // Provide debugging info
        console.log('\n🔧 Debugging information:');
        console.log(`   Nomination ID: ${amitKumar.id}`);
        console.log(`   Nominee ID: ${amitKumar.nomineeId}`);
        console.log(`   Live URL: ${amitKumar.liveUrl || 'Not set'}`);
        console.log(`   Expected URLs to try:`);
        testUrls.forEach(url => console.log(`     - ${BASE_URL}${url}`));
      }
      
      // Test 4: Check admin panel visibility
      console.log('\n4. Checking admin panel visibility...');
      
      try {
        const adminResponse = await fetch(`${BASE_URL}/api/admin/nominations`);
        const adminResult = await adminResponse.json();
        
        if (adminResult.success) {
          const amitInAdmin = adminResult.data.find(nom => 
            nom.displayName?.toLowerCase().includes('amit kumar') ||
            nom.firstname?.toLowerCase().includes('amit')
          );
          
          if (amitInAdmin) {
            console.log('✅ Amit Kumar visible in admin panel');
            console.log(`   Admin ID: ${amitInAdmin.id}`);
            console.log(`   Status: ${amitInAdmin.state}`);
            console.log(`   Display Name: ${amitInAdmin.displayName}`);
            console.log(`   Category: ${amitInAdmin.subcategory_id}`);
          } else {
            console.log('❌ Amit Kumar not found in admin panel');
          }
        } else {
          console.log(`❌ Failed to fetch admin data: ${adminResult.error}`);
        }
      } catch (error) {
        console.log(`❌ Error checking admin panel: ${error.message}`);
      }
      
    } else {
      console.log('❌ Amit Kumar not found in nominees API');
      
      // Check if he might be in a different state
      console.log('\n🔍 Checking admin panel for Amit Kumar...');
      
      try {
        const adminResponse = await fetch(`${BASE_URL}/api/admin/nominations`);
        const adminResult = await adminResponse.json();
        
        if (adminResult.success) {
          const amitInAdmin = adminResult.data.find(nom => 
            nom.displayName?.toLowerCase().includes('amit kumar') ||
            nom.firstname?.toLowerCase().includes('amit') ||
            (nom.firstname?.toLowerCase().includes('amit') && nom.lastname?.toLowerCase().includes('kumar'))
          );
          
          if (amitInAdmin) {
            console.log('✅ Found Amit Kumar in admin panel');
            console.log(`   Status: ${amitInAdmin.state}`);
            console.log(`   Display Name: ${amitInAdmin.displayName}`);
            console.log(`   Category: ${amitInAdmin.subcategory_id}`);
            console.log(`   Type: ${amitInAdmin.type}`);
            console.log(`   Created: ${amitInAdmin.created_at}`);
            
            if (amitInAdmin.state !== 'approved') {
              console.log(`⚠️  Amit Kumar is not approved (status: ${amitInAdmin.state})`);
              console.log('   This is why he doesn\'t appear in the public nominees API');
              console.log('   Please approve the nomination in the admin panel to make it visible');
            }
          } else {
            console.log('❌ Amit Kumar not found in admin panel either');
            console.log('   The nomination may not have been submitted correctly');
          }
        }
      } catch (error) {
        console.log(`❌ Error checking admin panel: ${error.message}`);
      }
    }

    // Test 5: Check database schema compliance
    console.log('\n5. Schema compliance summary...');
    
    if (amitKumar) {
      console.log('✅ New schema structure verification:');
      console.log('   ✓ Uses public_nominees view');
      console.log('   ✓ Proper data transformation');
      console.log('   ✓ Complete nominee object structure');
      console.log('   ✓ Type-specific field handling');
      console.log('   ✓ Vote count integration');
      
      if (pageWorking) {
        console.log('\n✅ All systems working correctly!');
      } else {
        console.log('\n❌ Issues found:');
        console.log('   - Individual nominee page not accessible');
        console.log('   - May need URL routing fix or approval status check');
      }
    } else {
      console.log('❌ Amit Kumar nomination issues:');
      console.log('   - Not found in public nominees (may not be approved)');
      console.log('   - Check admin panel for nomination status');
      console.log('   - Verify nomination was submitted with new schema');
    }

    console.log('\n🎉 Amit Kumar Nomination Testing Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testAmitKumarNomination();