#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🧪 Testing Homepage Banner Removal...');
console.log('====================================');

try {
  const pageResult = execSync('curl -s "http://localhost:3000/"', { encoding: 'utf8' });
  
  console.log('\n✅ Verification Results:');
  
  // Check if promotional content is removed
  const hasResumeBuilder = pageResult.includes('AI-POWERED') || 
                          pageResult.includes('RESUME BUILDER') || 
                          pageResult.includes('candidately');
  
  if (!hasResumeBuilder) {
    console.log('   ✓ AI-POWERED RESUME BUILDER banner removed');
  } else {
    console.log('   ✗ Promotional banner still present');
  }
  
  // Check if main homepage content is still there
  const hasMainContent = pageResult.includes('World Staffing Awards') && 
                        pageResult.includes('Submit Nomination') && 
                        pageResult.includes('View Nominees');
  
  if (hasMainContent) {
    console.log('   ✓ Main homepage content preserved');
  } else {
    console.log('   ✗ Main homepage content missing');
  }
  
  // Check if other sections are still there
  const hasCategories = pageResult.includes('Award Categories');
  const hasTimeline = pageResult.includes('Awards Timeline');
  const hasCTA = pageResult.includes('Ready to Nominate');
  
  if (hasCategories) {
    console.log('   ✓ Award Categories section preserved');
  } else {
    console.log('   ✗ Award Categories section missing');
  }
  
  if (hasTimeline) {
    console.log('   ✓ Awards Timeline section preserved');
  } else {
    console.log('   ✗ Awards Timeline section missing');
  }
  
  if (hasCTA) {
    console.log('   ✓ Call-to-action section preserved');
  } else {
    console.log('   ✗ Call-to-action section missing');
  }
  
  console.log('\n📋 Summary:');
  if (!hasResumeBuilder && hasMainContent && hasCategories && hasTimeline && hasCTA) {
    console.log('   🎉 SUCCESS: Promotional banner removed, all other content preserved');
  } else {
    console.log('   ⚠️  Some issues detected - please review the homepage');
  }
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
}

console.log('\n🌐 Test the homepage in your browser:');
console.log('   http://localhost:3000/');

console.log('\n💡 What you should see:');
console.log('   ✅ World Staffing Awards 2026 hero section');
console.log('   ✅ Submit Nomination and View Nominees buttons');
console.log('   ✅ Stats section');
console.log('   ✅ Public podium');
console.log('   ✅ Award categories');
console.log('   ✅ Awards timeline');
console.log('   ✅ Ready to Nominate call-to-action');
console.log('   ❌ NO AI-POWERED RESUME BUILDER banner');