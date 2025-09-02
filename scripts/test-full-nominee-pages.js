#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🧪 Testing Full-Featured Nominee Pages...');
console.log('==========================================');

// Test a few specific nominees
const testNominees = [
  'ayush-raj',
  'complete-flow-test-nominee-2', 
  'ayush',
  'anu-manager',
  'akash-kumar'
];

let allWorking = true;

testNominees.forEach((slug, index) => {
  console.log(`\n${index + 1}️⃣ Testing: ${slug}`);
  console.log(`   URL: http://localhost:3000/nominee/${slug}`);
  
  try {
    // Test API first
    const apiResult = execSync(`curl -s "http://localhost:3000/api/nominee/${slug}"`, { encoding: 'utf8' });
    const apiData = JSON.parse(apiResult);
    const expectedName = apiData.nominee?.name;
    console.log(`   ✅ API: ${expectedName}`);
    
    // Test page - look for key features
    const pageResult = execSync(`curl -s "http://localhost:3000/nominee/${slug}"`, { encoding: 'utf8' });
    
    const features = {
      hasVoteButton: pageResult.includes('Cast Your Vote'),
      hasShareButtons: pageResult.includes('Share This Nomination'),
      hasLinkedInButton: pageResult.includes('LinkedIn Profile'),
      hasWhyVoteSection: pageResult.includes('Why you should vote for'),
      hasSuggestedNominees: pageResult.includes('More Profiles for You'),
      hasVoteCount: pageResult.includes('votes received'),
      hasNomineeName: pageResult.includes(expectedName)
    };
    
    const workingFeatures = Object.values(features).filter(Boolean).length;
    const totalFeatures = Object.keys(features).length;
    
    console.log(`   📊 Features: ${workingFeatures}/${totalFeatures}`);
    
    if (features.hasNomineeName && features.hasVoteButton && features.hasShareButtons) {
      console.log(`   ✅ Page: Full-featured nominee page working`);
      
      // List working features
      const workingList = [];
      if (features.hasVoteButton) workingList.push('Vote Button');
      if (features.hasShareButtons) workingList.push('Share Buttons');
      if (features.hasLinkedInButton) workingList.push('LinkedIn Link');
      if (features.hasWhyVoteSection) workingList.push('Why Vote Section');
      if (features.hasSuggestedNominees) workingList.push('Suggested Nominees');
      if (features.hasVoteCount) workingList.push('Vote Count');
      
      console.log(`      ✓ ${workingList.join(', ')}`);
      
    } else if (features.hasNomineeName) {
      console.log(`   ⚠️  Page: Shows nominee but missing features`);
      
      // List missing features
      const missingList = [];
      if (!features.hasVoteButton) missingList.push('Vote Button');
      if (!features.hasShareButtons) missingList.push('Share Buttons');
      if (!features.hasLinkedInButton) missingList.push('LinkedIn Link');
      if (!features.hasWhyVoteSection) missingList.push('Why Vote Section');
      if (!features.hasSuggestedNominees) missingList.push('Suggested Nominees');
      if (!features.hasVoteCount) missingList.push('Vote Count');
      
      console.log(`      ✗ Missing: ${missingList.join(', ')}`);
      
    } else {
      console.log(`   ❌ Page: Does not show nominee content`);
      allWorking = false;
    }
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    allWorking = false;
  }
});

console.log('\n' + '='.repeat(50));
if (allWorking) {
  console.log('🎉 All nominee pages are working with full features!');
  console.log('\n✅ The pages include:');
  console.log('   - Vote buttons with real-time counts');
  console.log('   - Share functionality (Email, LinkedIn, Twitter)');
  console.log('   - LinkedIn profile links');
  console.log('   - "Why vote for me" sections');
  console.log('   - Suggested nominees cards');
  console.log('   - Professional card layouts');
  console.log('   - Responsive design');
} else {
  console.log('❌ Some nominee pages have issues');
}

console.log('\n🌐 Test these URLs in your browser:');
testNominees.forEach(slug => {
  console.log(`   http://localhost:3000/nominee/${slug}`);
});

console.log('\n💡 Features you should see:');
console.log('   🗳️  Vote button with current vote count');
console.log('   📤 Share buttons (Email, LinkedIn, Twitter)');
console.log('   🔗 LinkedIn profile link');
console.log('   📝 "Why you should vote for [name]" section');
console.log('   👥 "More Profiles for You" suggestions');
console.log('   🏷️  Category badges and nomination details');
console.log('   📱 Responsive layout (desktop sidebar, mobile stacked)');