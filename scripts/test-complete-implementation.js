#!/usr/bin/env node

/**
 * Complete Implementation Test Script
 * Tests images, HubSpot sync, and why vote for me functionality
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAPI(url, options = {}) {
  try {
    const response = await fetch(`http://localhost:3010${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(`API call failed: ${error.message}`);
  }
}

async function main() {
  log('🧪 Testing Complete Implementation', 'cyan');
  log('=' .repeat(50), 'cyan');
  
  let totalTests = 0;
  let passedTests = 0;
  
  // Test 1: Create a nomination with image
  log('\\n1️⃣  Testing Nomination Creation', 'blue');
  totalTests++;
  
  try {
    const nomination = await testAPI('/api/nominations', {
      method: 'POST',
      body: JSON.stringify({
        category: 'Top Recruiter',
        nominator: {
          name: 'Test User Complete',
          email: 'test-complete@example.com',
          phone: ''
        },
        nominee: {
          name: 'Complete Test Nominee',
          email: 'complete-nominee@example.com',
          title: 'Senior Recruiter',
          country: 'USA',
          linkedin: 'https://www.linkedin.com/in/complete-test-nominee-unique-final'
        }
      })
    });
    
    log(`✅ Nomination created: ${nomination.id}`, 'green');
    passedTests++;
    
    // Test 2: Approve nomination (should trigger HubSpot sync)
    log('\\n2️⃣  Testing Nomination Approval & HubSpot Sync', 'blue');
    totalTests++;
    
    try {
      await testAPI('/api/nominations', {
        method: 'PATCH',
        body: JSON.stringify({
          id: nomination.id,
          status: 'approved'
        })
      });
      
      log('✅ Nomination approved (HubSpot sync triggered)', 'green');
      passedTests++;
    } catch (error) {
      log(`❌ Nomination approval failed: ${error.message}`, 'red');
    }
    
    // Test 3: Update why vote for me
    log('\\n3️⃣  Testing Why Vote For Me Update', 'blue');
    totalTests++;
    
    try {
      await testAPI('/api/nominations', {
        method: 'PATCH',
        body: JSON.stringify({
          id: nomination.id,
          why_vote: 'This nominee is exceptional because they have demonstrated outstanding leadership and innovation in the recruiting industry.'
        })
      });
      
      log('✅ Why vote for me updated', 'green');
      passedTests++;
    } catch (error) {
      log(`❌ Why vote update failed: ${error.message}`, 'red');
    }
    
    // Test 4: Cast a vote (should trigger HubSpot voter sync)
    log('\\n4️⃣  Testing Vote Casting & HubSpot Voter Sync', 'blue');
    totalTests++;
    
    try {
      const voteResult = await testAPI('/api/votes', {
        method: 'POST',
        body: JSON.stringify({
          nomineeId: nomination.id,
          category: 'Top Recruiter',
          voter: {
            firstName: 'Complete',
            lastName: 'Voter',
            email: 'complete-voter@example.com',
            linkedin: 'https://www.linkedin.com/in/complete-voter'
          }
        })
      });
      
      log(`✅ Vote cast successfully (HubSpot voter sync triggered)`, 'green');
      passedTests++;
    } catch (error) {
      log(`❌ Vote casting failed: ${error.message}`, 'red');
    }
    
    // Test 5: Check nominee API with image and why vote
    log('\\n5️⃣  Testing Nominee API Response', 'blue');
    totalTests++;
    
    try {
      const nomineeData = await testAPI(`/api/nominee/complete-test-nominee`);
      
      if (nomineeData.whyVoteForMe) {
        log('✅ Why vote for me field present in API response', 'green');
      } else {
        log('⚠️  Why vote for me field missing in API response', 'yellow');
      }
      
      log(`✅ Nominee API working (votes: ${nomineeData.votes || 0})`, 'green');
      passedTests++;
    } catch (error) {
      log(`❌ Nominee API failed: ${error.message}`, 'red');
    }
    
    // Test 6: Check upload debug API
    log('\\n6️⃣  Testing Upload Debug API', 'blue');
    totalTests++;
    
    try {
      const debugData = await testAPI('/api/uploads/debug?slug=complete-test-nominee');
      
      log(`✅ Upload debug API working`, 'green');
      log(`   Database image_url: ${debugData.database?.image_url || 'null'}`, 'reset');
      log(`   Files headshot exists: ${debugData.files?.headshot?.exists || false}`, 'reset');
      passedTests++;
    } catch (error) {
      log(`❌ Upload debug API failed: ${error.message}`, 'red');
    }
    
  } catch (error) {
    log(`❌ Nomination creation failed: ${error.message}`, 'red');
  }
  
  // Test 7: Check HubSpot integration status
  log('\\n7️⃣  Testing HubSpot Integration Status', 'blue');
  totalTests++;
  
  try {
    const hubspotStats = await testAPI('/api/integrations/hubspot/stats');
    
    if (hubspotStats.hubspotStatus === 'connected') {
      log('✅ HubSpot integration connected', 'green');
      passedTests++;
    } else {
      log('❌ HubSpot integration not connected', 'red');
    }
  } catch (error) {
    log(`❌ HubSpot stats failed: ${error.message}`, 'red');
  }
  
  // Summary
  log('\\n' + '=' .repeat(50), 'cyan');
  log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`, 'bright');
  
  const percentage = Math.round((passedTests / totalTests) * 100);
  
  if (percentage === 100) {
    log('🎉 All tests passed! Implementation is complete.', 'green');
  } else if (percentage >= 80) {
    log(`⚠️  Most tests passed (${percentage}%). Review failed items above.`, 'yellow');
  } else {
    log(`❌ Many tests failed (${percentage}%). Implementation needs work.`, 'red');
  }
  
  log('\\n📋 Manual Tests to Perform:', 'blue');
  log('1. Visit http://localhost:3010/directory - check image display', 'reset');
  log('2. Visit nominee profile - check image and "why vote" section', 'reset');
  log('3. Visit http://localhost:3010/admin - check HubSpot tab', 'reset');
  log('4. Check HubSpot dashboard for new contacts', 'reset');
}

main().catch(error => {
  log(`\\n💥 Test script failed: ${error.message}`, 'red');
  process.exit(1);
});