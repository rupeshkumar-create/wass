#!/usr/bin/env node

/**
 * Test script to verify Loops integration for nominees and nominators
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Testing Loops Integration Updates...\n');

// Test Loops service file
console.log('1. Testing Loops Service Updates:');
const loopsPath = path.join(__dirname, '../src/lib/loops.ts');
const loopsContent = fs.readFileSync(loopsPath, 'utf8');

// Check for new methods
const hasSyncNominee = loopsContent.includes('async syncNominee(');
const hasSyncNominator = loopsContent.includes('async syncNominator(');
const hasNominationEvent = loopsContent.includes('sendNominationEvent(');
const hasApprovedEvent = loopsContent.includes('sendNominationApprovedEvent(');
const hasAddToList = loopsContent.includes('async addToList(');
const hasListIds = loopsContent.includes('LIST_IDS = {');

console.log(`   ✅ syncNominee method: ${hasSyncNominee ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ syncNominator method: ${hasSyncNominator ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ sendNominationEvent method: ${hasNominationEvent ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ sendNominationApprovedEvent method: ${hasApprovedEvent ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ addToList method: ${hasAddToList ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ LIST_IDS configuration: ${hasListIds ? 'PASS' : 'FAIL'}`);

// Check for correct user groups and list IDs
const hasNomineesGroup = loopsContent.includes("userGroup: 'Nominees 2026'");
const hasNominatorGroup = loopsContent.includes("userGroup: 'Nominator 2026'");
const hasVoterGroup = loopsContent.includes("userGroup: 'Voter 2026'");
const hasVoterListId = loopsContent.includes('cmegxu1fc0gw70i1d7g35gqb0');
const hasNomineeListId = loopsContent.includes('cmegxubbj0jr60h33ahctgicr');
const hasNominatorListId = loopsContent.includes('cmegxuqag0jth0h334yy17csd');

console.log(`   ✅ Nominees 2026 user group: ${hasNomineesGroup ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ Nominator 2026 user group: ${hasNominatorGroup ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ Voter 2026 user group: ${hasVoterGroup ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ Voter list ID: ${hasVoterListId ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ Nominee list ID: ${hasNomineeListId ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ Nominator list ID: ${hasNominatorListId ? 'PASS' : 'FAIL'}`);

// Test nominations API integration
console.log('\n2. Testing Nominations API Integration:');
const nominationsPath = path.join(__dirname, '../src/app/api/nominations/route.ts');
const nominationsContent = fs.readFileSync(nominationsPath, 'utf8');

// Check for Loops import
const hasLoopsImport = nominationsContent.includes("import { loopsService } from \"@/lib/loops\"");
const hasNominatorSync = nominationsContent.includes('loopsService.syncNominator(');
const hasNomineeSync = nominationsContent.includes('loopsService.syncNominee(');
const hasNominationEventCall = nominationsContent.includes('loopsService.sendNominationEvent(');
const hasApprovedEventCall = nominationsContent.includes('loopsService.sendNominationApprovedEvent(');

console.log(`   ✅ Loops service import: ${hasLoopsImport ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ Nominator sync on submission: ${hasNominatorSync ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ Nominee sync on approval: ${hasNomineeSync ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ Nomination event on submission: ${hasNominationEventCall ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ Approval event on approval: ${hasApprovedEventCall ? 'PASS' : 'FAIL'}`);

// Test Loops test API updates
console.log('\n3. Testing Loops Test API Updates:');
const loopsTestPath = path.join(__dirname, '../src/app/api/dev/loops-test/route.ts');
const loopsTestContent = fs.readFileSync(loopsTestPath, 'utf8');

// Check for new test actions
const hasSyncNomineeTest = loopsTestContent.includes("case 'sync-nominee':");
const hasSyncNominatorTest = loopsTestContent.includes("case 'sync-nominator':");
const hasNominationEventTest = loopsTestContent.includes("case 'send-nomination-event':");
const hasApprovedEventTest = loopsTestContent.includes("case 'send-nomination-approved-event':");
const hasUserGroupsInfo = loopsTestContent.includes('userGroups:');
const hasListIdsInfo = loopsTestContent.includes('listIds:');
const hasAddToListTest = loopsTestContent.includes("case 'add-to-list':");
const hasTestAllListsTest = loopsTestContent.includes("case 'test-all-lists':");

console.log(`   ✅ sync-nominee test case: ${hasSyncNomineeTest ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ sync-nominator test case: ${hasSyncNominatorTest ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ send-nomination-event test case: ${hasNominationEventTest ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ send-nomination-approved-event test case: ${hasApprovedEventTest ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ User groups information: ${hasUserGroupsInfo ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ List IDs information: ${hasListIdsInfo ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ add-to-list test case: ${hasAddToListTest ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ test-all-lists test case: ${hasTestAllListsTest ? 'PASS' : 'FAIL'}`);

// Test for proper error handling
console.log('\n4. Testing Error Handling:');
const hasErrorHandling = loopsContent.includes('catch (error: any)') && 
                        loopsContent.includes("console.error('Failed to sync");
const hasNonBlockingSync = nominationsContent.includes('setTimeout(() => {') &&
                          nominationsContent.includes('.catch(error =>');

console.log(`   ✅ Proper error handling: ${hasErrorHandling ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ Non-blocking sync calls: ${hasNonBlockingSync ? 'PASS' : 'FAIL'}`);

// Test for email validation
console.log('\n5. Testing Email Validation:');
const hasEmailCheck = loopsContent.includes('if (!nominee.email)') ||
                     loopsContent.includes('Skip if no email provided');
const hasEmailSkipLog = loopsContent.includes('No email provided for nominee');

console.log(`   ✅ Email validation for nominees: ${hasEmailCheck ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ Email skip logging: ${hasEmailSkipLog ? 'PASS' : 'FAIL'}`);

// Summary
const loopsServicePassed = hasSyncNominee && hasSyncNominator && hasNominationEvent && 
                          hasApprovedEvent && hasNomineesGroup && hasNominatorGroup && hasVoterGroup &&
                          hasAddToList && hasListIds && hasVoterListId && hasNomineeListId && hasNominatorListId;
const nominationsApiPassed = hasLoopsImport && hasNominatorSync && hasNomineeSync && 
                            hasNominationEventCall && hasApprovedEventCall;
const testApiPassed = hasSyncNomineeTest && hasSyncNominatorTest && hasNominationEventTest && 
                     hasApprovedEventTest && hasUserGroupsInfo && hasListIdsInfo && 
                     hasAddToListTest && hasTestAllListsTest;
const errorHandlingPassed = hasErrorHandling && hasNonBlockingSync;
const emailValidationPassed = hasEmailCheck && hasEmailSkipLog;

console.log('\n📊 Test Results Summary:');
console.log(`   Loops Service Updates: ${loopsServicePassed ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Nominations API Integration: ${nominationsApiPassed ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Test API Updates: ${testApiPassed ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Error Handling: ${errorHandlingPassed ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Email Validation: ${emailValidationPassed ? '✅ PASS' : '❌ FAIL'}`);

const allTestsPassed = loopsServicePassed && nominationsApiPassed && testApiPassed && 
                      errorHandlingPassed && emailValidationPassed;

console.log(`\n🎯 Overall Result: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

if (allTestsPassed) {
  console.log('\n🎉 Loops integration successfully updated!');
  console.log('   • Nominees will be synced to "Nominees 2026" user group and added to list');
  console.log('   • Nominators will be synced to "Nominator 2026" user group and added to list');
  console.log('   • Voters continue to be synced to "Voter 2026" user group and added to list');
  console.log('   • Events are sent for nominations and approvals');
  console.log('   • Proper error handling and email validation implemented');
  console.log('\n📋 User Groups & Lists:');
  console.log('   • Nominees 2026: For approved nominees (List: cmegxubbj0jr60h33ahctgicr)');
  console.log('   • Nominator 2026: For people who submit nominations (List: cmegxuqag0jth0h334yy17csd)');
  console.log('   • Voter 2026: For people who vote (List: cmegxu1fc0gw70i1d7g35gqb0)');
  console.log('\n🔗 Automatic List Management:');
  console.log('   • Contacts are automatically added to appropriate lists');
  console.log('   • List membership is managed alongside user group assignment');
  console.log('   • All three lists are configured with proper IDs');
} else {
  console.log('\n⚠️  Some issues may still exist. Please review the failed tests above.');
}

process.exit(allTestsPassed ? 0 : 1);