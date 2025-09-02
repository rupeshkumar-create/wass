#!/usr/bin/env node

/**
 * Debug Nominees API Structure
 * Check what the API is actually returning vs what frontend expects
 */

async function debugAPI() {
  console.log('🔍 Debugging Nominees API Structure...\n');

  try {
    const response = await fetch('http://localhost:3004/api/nominees?limit=1');
    
    if (!response.ok) {
      console.error(`❌ API failed: ${response.status}`);
      const errorText = await response.text();
      console.error('Error:', errorText);
      return;
    }

    const result = await response.json();
    
    if (!result.success) {
      console.error('❌ API error:', result.error);
      return;
    }

    if (result.data.length === 0) {
      console.log('⚠️  No nominees found');
      return;
    }

    const sample = result.data[0];
    
    console.log('📋 API Response Structure:');
    console.log('='.repeat(50));
    console.log('Top-level fields:');
    Object.keys(sample).forEach(key => {
      console.log(`  - ${key}: ${typeof sample[key]} = ${JSON.stringify(sample[key]).slice(0, 100)}...`);
    });
    
    console.log('\n📋 Nominee object structure:');
    if (sample.nominee) {
      Object.keys(sample.nominee).forEach(key => {
        console.log(`  - nominee.${key}: ${typeof sample.nominee[key]} = ${JSON.stringify(sample.nominee[key]).slice(0, 100)}...`);
      });
    } else {
      console.log('  ❌ No nominee object found!');
    }
    
    console.log('\n🎯 Frontend expects:');
    console.log('  - nomination.nominee.name (for CardNominee)');
    console.log('  - nomination.imageUrl (for getNomineeImage)');
    console.log('  - nomination.category (for Grid grouping)');
    console.log('  - nomination.votes (for vote count)');
    
    console.log('\n✅ Validation:');
    console.log(`  - nominee.name exists: ${!!sample.nominee?.name}`);
    console.log(`  - imageUrl exists: ${!!sample.imageUrl}`);
    console.log(`  - category exists: ${!!sample.category}`);
    console.log(`  - votes exists: ${!!sample.votes}`);
    
    if (!sample.nominee?.name) {
      console.log('\n❌ ISSUE FOUND: nominee.name is missing!');
      console.log('Available name fields:');
      console.log(`  - sample.name: ${sample.name}`);
      console.log(`  - sample.displayName: ${sample.displayName}`);
      console.log(`  - sample.nominee.displayName: ${sample.nominee?.displayName}`);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugAPI();