#!/usr/bin/env node

/**
 * COMPREHENSIVE SYSTEM DIAGNOSIS
 * Tests every component, API endpoint, database connection, and integration
 * to identify the root cause of internal server errors
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 COMPREHENSIVE SYSTEM DIAGNOSIS STARTING...\n');

// Track all test results
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

function logTest(name, success, details = '') {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${name}`);
  if (details) console.log(`   ${details}`);
  
  if (success) {
    testResults.passed++;
  } else {
    testResults.failed++;
    testResults.errors.push({ name, details });
  }
}

// 1. ENVIRONMENT VARIABLES TEST
async function testEnvironmentVariables() {
  console.log('\n📋 TESTING ENVIRONMENT VARIABLES');
  
  logTest('SUPABASE_URL exists', !!SUPABASE_URL, SUPABASE_URL ? `URL: ${SUPABASE_URL}` : 'Missing NEXT_PUBLIC_SUPABASE_URL');
  logTest('SUPABASE_ANON_KEY exists', !!SUPABASE_ANON_KEY, SUPABASE_ANON_KEY ? 'Key present' : 'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  logTest('SUPABASE_SERVICE_KEY exists', !!SUPABASE_SERVICE_KEY, SUPABASE_SERVICE_KEY ? 'Service key present' : 'Missing SUPABASE_SERVICE_ROLE_KEY');
}

// 2. SUPABASE CONNECTION TEST
async function testSupabaseConnection() {
  console.log('\n🔌 TESTING SUPABASE CONNECTION');
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await supabase.from('nominations').select('count', { count: 'exact', head: true });
    
    if (error) {
      logTest('Supabase connection', false, `Error: ${error.message}`);
      return false;
    } else {
      logTest('Supabase connection', true, `Connected successfully`);
      return true;
    }
  } catch (err) {
    logTest('Supabase connection', false, `Exception: ${err.message}`);
    return false;
  }
}

// 3. DATABASE SCHEMA VALIDATION
async function testDatabaseSchema() {
  console.log('\n🗄️ TESTING DATABASE SCHEMA');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  // Test each table exists and has expected columns (IMPROVED SCHEMA)
  const expectedTables = {
    nominations: [
      'id', 'created_at', 'updated_at', 'state', 'category_group_id', 'subcategory_id',
      'nominator_id', 'nominee_id', 'votes', 'admin_notes', 'rejection_reason'
    ],
    votes: [
      'id', 'created_at', 'nomination_id', 'voter_id', 'subcategory_id', 'vote_timestamp'
    ],
    nominators: [
      'id', 'email', 'firstname', 'lastname', 'company', 'job_title', 'linkedin', 'country'
    ],
    nominees: [
      'id', 'type', 'firstname', 'lastname', 'person_email', 'company_name', 'headshot_url', 'logo_url'
    ],
    voters: [
      'id', 'email', 'firstname', 'lastname', 'linkedin', 'company', 'job_title', 'country'
    ]
  };
  
  for (const [tableName, expectedColumns] of Object.entries(expectedTables)) {
    try {
      // Test table exists by querying it
      const { data, error } = await supabase.from(tableName).select('*').limit(1);
      
      if (error) {
        logTest(`Table ${tableName} exists`, false, `Error: ${error.message}`);
        continue;
      }
      
      logTest(`Table ${tableName} exists`, true);
      
      // Test a few key columns by trying to select them
      const keyColumns = expectedColumns.slice(0, 5); // Test first 5 columns
      const { data: columnTest, error: columnError } = await supabase
        .from(tableName)
        .select(keyColumns.join(','))
        .limit(1);
        
      if (columnError) {
        logTest(`Table ${tableName} columns`, false, `Missing columns: ${columnError.message}`);
      } else {
        logTest(`Table ${tableName} columns`, true, `Key columns present`);
      }
      
    } catch (err) {
      logTest(`Table ${tableName}`, false, `Exception: ${err.message}`);
    }
  }
}

// 4. API ENDPOINTS TEST
async function testAPIEndpoints() {
  console.log('\n🌐 TESTING API ENDPOINTS');
  
  const baseUrl = 'http://localhost:3000';
  const endpoints = [
    { path: '/api/nominations', method: 'GET', description: 'Get nominations' },
    { path: '/api/admin/nominations', method: 'GET', description: 'Admin nominations' },
    { path: '/api/stats', method: 'GET', description: 'Statistics' },
    { path: '/api/votes', method: 'GET', description: 'Get votes' },
    { path: '/api/nominees', method: 'GET', description: 'Get nominees' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const success = response.status < 500; // Accept 4xx but not 5xx errors
      logTest(`${endpoint.method} ${endpoint.path}`, success, 
        `Status: ${response.status} ${response.statusText}`);
        
      if (!success) {
        try {
          const errorText = await response.text();
          console.log(`   Error details: ${errorText.substring(0, 200)}...`);
        } catch (e) {
          console.log(`   Could not read error details`);
        }
      }
      
    } catch (err) {
      logTest(`${endpoint.method} ${endpoint.path}`, false, `Network error: ${err.message}`);
    }
  }
}

// 5. COMPONENT DEPENDENCIES TEST
async function testComponentDependencies() {
  console.log('\n🧩 TESTING COMPONENT DEPENDENCIES');
  
  const fs = require('fs');
  const path = require('path');
  
  // Test critical files exist
  const criticalFiles = [
    'src/app/admin/page.tsx',
    'src/app/api/admin/nominations/route.ts',
    'src/lib/supabase/service.ts',
    'src/components/admin/EditNominationDialog.tsx',
    'src/server/supabase/schema.ts'
  ];
  
  for (const filePath of criticalFiles) {
    const exists = fs.existsSync(filePath);
    logTest(`File exists: ${filePath}`, exists);
    
    if (exists) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const hasContent = content.length > 100; // Basic content check
        logTest(`File has content: ${filePath}`, hasContent, `${content.length} characters`);
      } catch (err) {
        logTest(`File readable: ${filePath}`, false, err.message);
      }
    }
  }
}

// 6. SPECIFIC ADMIN PANEL TEST
async function testAdminPanelSpecifically() {
  console.log('\n👨‍💼 TESTING ADMIN PANEL SPECIFICALLY');
  
  try {
    // Test admin API endpoint with detailed error catching
    const response = await fetch('http://localhost:3000/api/admin/nominations', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    logTest('Admin API response', response.ok, `Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   Full error response: ${errorText}`);
      
      // Try to parse as JSON to get more details
      try {
        const errorJson = JSON.parse(errorText);
        console.log(`   Parsed error:`, errorJson);
      } catch (e) {
        console.log(`   Raw error text: ${errorText.substring(0, 500)}`);
      }
    } else {
      const data = await response.json();
      const isValidFormat = data && typeof data === 'object' && 'success' in data && 'data' in data && Array.isArray(data.data);
      logTest('Admin API returns data', isValidFormat, `Returned ${isValidFormat ? `${data.data.length} items in correct format` : 'invalid format'} items`);
    }
    
  } catch (err) {
    logTest('Admin API call', false, `Network error: ${err.message}`);
  }
}

// 7. DATABASE OPERATIONS TEST
async function testDatabaseOperations() {
  console.log('\n💾 TESTING DATABASE OPERATIONS');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  try {
    // Test basic read operation (IMPROVED SCHEMA)
    const { data: readData, error: readError } = await supabase
      .from('nominations')
      .select('id, state, category_group_id')
      .limit(5);
      
    logTest('Database read operation', !readError, readError ? readError.message : `Read ${readData?.length || 0} records`);
    
    // Test count operation
    const { count, error: countError } = await supabase
      .from('nominations')
      .select('*', { count: 'exact', head: true });
      
    logTest('Database count operation', !countError, countError ? countError.message : `Total records: ${count}`);
    
    // Test votes table (IMPROVED SCHEMA)
    const { data: votesData, error: votesError } = await supabase
      .from('votes')
      .select('id, nomination_id, voter_id')
      .limit(5);
      
    logTest('Votes table read', !votesError, votesError ? votesError.message : `Read ${votesData?.length || 0} votes`);
    
  } catch (err) {
    logTest('Database operations', false, `Exception: ${err.message}`);
  }
}

// 8. STORAGE TEST
async function testStorageOperations() {
  console.log('\n📁 TESTING STORAGE OPERATIONS');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  try {
    // Test storage bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    logTest('Storage buckets accessible', !bucketsError, bucketsError ? bucketsError.message : `Found ${buckets?.length || 0} buckets`);
    
    if (buckets && buckets.length > 0) {
      // Test specific bucket (likely 'headshots' or similar)
      const headshotBucket = buckets.find(b => b.name.includes('headshot') || b.name.includes('image'));
      if (headshotBucket) {
        const { data: files, error: filesError } = await supabase.storage
          .from(headshotBucket.name)
          .list('', { limit: 5 });
          
        logTest(`Storage bucket ${headshotBucket.name}`, !filesError, 
          filesError ? filesError.message : `Contains ${files?.length || 0} files`);
      }
    }
    
  } catch (err) {
    logTest('Storage operations', false, `Exception: ${err.message}`);
  }
}

// 9. INTEGRATION TESTS
async function testIntegrations() {
  console.log('\n🔗 TESTING INTEGRATIONS');
  
  // Test HubSpot integration if configured
  const hubspotToken = process.env.HUBSPOT_ACCESS_TOKEN;
  logTest('HubSpot token configured', !!hubspotToken, hubspotToken ? 'Token present' : 'No HUBSPOT_ACCESS_TOKEN');
  
  if (hubspotToken) {
    try {
      const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
        headers: {
          'Authorization': `Bearer ${hubspotToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      logTest('HubSpot API connection', response.ok, `Status: ${response.status}`);
    } catch (err) {
      logTest('HubSpot API connection', false, `Error: ${err.message}`);
    }
  }
}

// MAIN EXECUTION
async function runComprehensiveDiagnosis() {
  console.log('Starting comprehensive system diagnosis...\n');
  
  await testEnvironmentVariables();
  await testSupabaseConnection();
  await testDatabaseSchema();
  await testComponentDependencies();
  await testDatabaseOperations();
  await testStorageOperations();
  await testIntegrations();
  await testAdminPanelSpecifically();
  await testAPIEndpoints();
  
  // SUMMARY
  console.log('\n' + '='.repeat(60));
  console.log('📊 DIAGNOSIS SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Tests Passed: ${testResults.passed}`);
  console.log(`❌ Tests Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES FOUND:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.name}`);
      console.log(`   ${error.details}`);
    });
    
    console.log('\n💡 RECOMMENDED ACTIONS:');
    
    // Analyze errors and provide specific recommendations
    const errorMessages = testResults.errors.map(e => e.details.toLowerCase());
    
    if (errorMessages.some(msg => msg.includes('missing') && msg.includes('column'))) {
      console.log('• Run database schema migration to add missing columns');
    }
    
    if (errorMessages.some(msg => msg.includes('connection') || msg.includes('network'))) {
      console.log('• Check network connectivity and Supabase credentials');
    }
    
    if (errorMessages.some(msg => msg.includes('500') || msg.includes('internal server'))) {
      console.log('• Check server logs for detailed error information');
      console.log('• Verify all environment variables are correctly set');
    }
    
    if (errorMessages.some(msg => msg.includes('file') || msg.includes('component'))) {
      console.log('• Verify all required files exist and are properly formatted');
    }
  } else {
    console.log('\n🎉 All tests passed! System appears to be functioning correctly.');
  }
  
  console.log('\n' + '='.repeat(60));
}

// Run the diagnosis
runComprehensiveDiagnosis().catch(console.error);