#!/usr/bin/env node

/**
 * Comprehensive System Test - Tests every component and connection
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 COMPREHENSIVE SYSTEM TEST\n');
console.log('Testing every component, API, and connection...\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

function logTest(name, status, message, details = null) {
  const symbols = { pass: '✅', fail: '❌', warn: '⚠️' };
  console.log(`${symbols[status]} ${name}: ${message}`);
  
  testResults.details.push({ name, status, message, details });
  testResults[status === 'pass' ? 'passed' : status === 'fail' ? 'failed' : 'warnings']++;
}

async function testEnvironmentVariables() {
  console.log('\n1. ENVIRONMENT VARIABLES TEST');
  console.log('================================');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      logTest(`Env Var ${varName}`, 'pass', 'Present');
    } else {
      logTest(`Env Var ${varName}`, 'fail', 'Missing');
    }
  }
}

async function testDatabaseConnection() {
  console.log('\n2. DATABASE CONNECTION TEST');
  console.log('============================');
  
  try {
    const { data, error } = await supabase
      .from('nominations')
      .select('count')
      .limit(1);
    
    if (error) {
      logTest('Database Connection', 'fail', `Connection failed: ${error.message}`);
      return false;
    }
    
    logTest('Database Connection', 'pass', 'Connected successfully');
    return true;
  } catch (error) {
    logTest('Database Connection', 'fail', `Connection error: ${error.message}`);
    return false;
  }
}

async function testDatabaseSchema() {
  console.log('\n3. DATABASE SCHEMA TEST');
  console.log('========================');
  
  const expectedTables = [
    'nominations',
    'nominators', 
    'voters'
  ];
  
  for (const table of expectedTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.code === 'PGRST116') {
          logTest(`Table ${table}`, 'fail', 'Table does not exist');
        } else {
          logTest(`Table ${table}`, 'warn', `Access issue: ${error.message}`);
        }
      } else {
        logTest(`Table ${table}`, 'pass', 'Table exists and accessible');
      }
    } catch (error) {
      logTest(`Table ${table}`, 'fail', `Error: ${error.message}`);
    }
  }
}

async function testAPIEndpoints() {
  console.log('\n4. API ENDPOINTS TEST');
  console.log('======================');
  
  const endpoints = [
    { path: '/api/admin/nominations', method: 'GET', name: 'Admin Nominations' },
    { path: '/api/stats', method: 'GET', name: 'Stats API' },
    { path: '/api/votes', method: 'GET', name: 'Votes API' },
    { path: '/api/nominations', method: 'GET', name: 'Public Nominations' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:3002${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        logTest(`API ${endpoint.name}`, 'pass', `Status ${response.status}, Data received`);
      } else {
        const errorText = await response.text();
        logTest(`API ${endpoint.name}`, 'fail', `Status ${response.status}: ${errorText.substring(0, 100)}`);
      }
    } catch (error) {
      logTest(`API ${endpoint.name}`, 'fail', `Network error: ${error.message}`);
    }
  }
}

async function testFileStructure() {
  console.log('\n5. FILE STRUCTURE TEST');
  console.log('=======================');
  
  const criticalFiles = [
    'src/app/admin/page.tsx',
    'src/app/api/admin/nominations/route.ts',
    'src/app/api/nomination/submit/route.ts',
    'src/app/api/uploads/image/route.ts',
    'src/components/form/Step6PersonHeadshot.tsx',
    'src/lib/supabase/storage.ts',
    'src/lib/zod/nomination.ts'
  ];
  
  for (const file of criticalFiles) {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      logTest(`File ${file}`, 'pass', `Exists (${stats.size} bytes)`);
    } else {
      logTest(`File ${file}`, 'fail', 'File missing');
    }
  }
}

async function testImageUploadFlow() {
  console.log('\n6. IMAGE UPLOAD FLOW TEST');
  console.log('==========================');
  
  try {
    // Test if upload endpoint exists
    const response = await fetch('http://localhost:3002/api/uploads/image', {
      method: 'POST',
      body: new FormData() // Empty form data to test endpoint
    });
    
    if (response.status === 400) {
      logTest('Image Upload Endpoint', 'pass', 'Endpoint exists and validates input');
    } else {
      logTest('Image Upload Endpoint', 'warn', `Unexpected status: ${response.status}`);
    }
  } catch (error) {
    logTest('Image Upload Endpoint', 'fail', `Network error: ${error.message}`);
  }
  
  // Test storage configuration
  try {
    const storageFile = path.join(process.cwd(), 'src/lib/supabase/storage.ts');
    if (fs.existsSync(storageFile)) {
      const content = fs.readFileSync(storageFile, 'utf8');
      if (content.includes('uploadImage') && content.includes('generateStoragePath')) {
        logTest('Storage Functions', 'pass', 'Upload functions defined');
      } else {
        logTest('Storage Functions', 'fail', 'Missing upload functions');
      }
    } else {
      logTest('Storage Functions', 'fail', 'Storage file missing');
    }
  } catch (error) {
    logTest('Storage Functions', 'fail', `Error reading storage file: ${error.message}`);
  }
}

async function testNominationSubmissionFlow() {
  console.log('\n7. NOMINATION SUBMISSION FLOW TEST');
  console.log('===================================');
  
  // Test validation schema
  try {
    const schemaFile = path.join(process.cwd(), 'src/lib/zod/nomination.ts');
    if (fs.existsSync(schemaFile)) {
      const content = fs.readFileSync(schemaFile, 'utf8');
      if (content.includes('NominationSubmitSchema')) {
        logTest('Validation Schema', 'pass', 'Schema defined');
      } else {
        logTest('Validation Schema', 'fail', 'Schema missing');
      }
    } else {
      logTest('Validation Schema', 'fail', 'Schema file missing');
    }
  } catch (error) {
    logTest('Validation Schema', 'fail', `Error: ${error.message}`);
  }
  
  // Test submission endpoint
  try {
    const response = await fetch('http://localhost:3002/api/nomination/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) // Empty data to test validation
    });
    
    if (response.status === 400) {
      logTest('Submission Validation', 'pass', 'Endpoint validates input');
    } else {
      logTest('Submission Validation', 'warn', `Unexpected status: ${response.status}`);
    }
  } catch (error) {
    logTest('Submission Validation', 'fail', `Network error: ${error.message}`);
  }
}

async function testAdminPanelComponents() {
  console.log('\n8. ADMIN PANEL COMPONENTS TEST');
  console.log('===============================');
  
  try {
    const adminFile = path.join(process.cwd(), 'src/app/admin/page.tsx');
    if (fs.existsSync(adminFile)) {
      const content = fs.readFileSync(adminFile, 'utf8');
      
      const requiredComponents = [
        'useState',
        'useEffect', 
        'fetchData',
        'handleLogin',
        'handleUpdateStatus'
      ];
      
      for (const component of requiredComponents) {
        if (content.includes(component)) {
          logTest(`Admin Component ${component}`, 'pass', 'Present');
        } else {
          logTest(`Admin Component ${component}`, 'fail', 'Missing');
        }
      }
    } else {
      logTest('Admin Page File', 'fail', 'File missing');
    }
  } catch (error) {
    logTest('Admin Components', 'fail', `Error: ${error.message}`);
  }
}

async function testDataFlow() {
  console.log('\n9. DATA FLOW TEST');
  console.log('==================');
  
  try {
    // Test if we can fetch and transform data
    const { data: nominations, error } = await supabase
      .from('nominations')
      .select(`
        id,
        type,
        state,
        subcategory_id,
        firstname,
        lastname,
        company_name,
        headshot_url,
        logo_url,
        votes,
        created_at
      `)
      .limit(5);
    
    if (error) {
      logTest('Data Fetch', 'fail', `Database error: ${error.message}`);
      return;
    }
    
    logTest('Data Fetch', 'pass', `Retrieved ${nominations.length} records`);
    
    // Test data transformation
    const transformed = nominations.map(nom => ({
      id: nom.id,
      displayName: nom.type === 'person' 
        ? `${nom.firstname || ''} ${nom.lastname || ''}`.trim()
        : nom.company_name || '',
      imageUrl: nom.type === 'person' ? nom.headshot_url : nom.logo_url,
      state: nom.state,
      votes: nom.votes || 0
    }));
    
    logTest('Data Transformation', 'pass', 'Data transformed successfully');
    
    // Check for missing images
    const missingImages = transformed.filter(t => !t.imageUrl).length;
    if (missingImages > 0) {
      logTest('Image Data', 'warn', `${missingImages} nominations missing images`);
    } else {
      logTest('Image Data', 'pass', 'All nominations have images');
    }
    
  } catch (error) {
    logTest('Data Flow', 'fail', `Error: ${error.message}`);
  }
}

async function testBuildProcess() {
  console.log('\n10. BUILD PROCESS TEST');
  console.log('=======================');
  
  try {
    const { execSync } = require('child_process');
    
    // Test TypeScript compilation
    try {
      execSync('npx tsc --noEmit', { cwd: process.cwd(), stdio: 'pipe' });
      logTest('TypeScript Check', 'pass', 'No type errors');
    } catch (error) {
      logTest('TypeScript Check', 'fail', 'Type errors found');
    }
    
    // Test Next.js build (quick check)
    try {
      execSync('npm run build', { cwd: process.cwd(), stdio: 'pipe', timeout: 30000 });
      logTest('Next.js Build', 'pass', 'Build successful');
    } catch (error) {
      logTest('Next.js Build', 'fail', 'Build failed');
    }
    
  } catch (error) {
    logTest('Build Process', 'fail', `Error: ${error.message}`);
  }
}

async function generateReport() {
  console.log('\n' + '='.repeat(50));
  console.log('COMPREHENSIVE TEST REPORT');
  console.log('='.repeat(50));
  
  console.log(`\n📊 SUMMARY:`);
  console.log(`   ✅ Passed: ${testResults.passed}`);
  console.log(`   ❌ Failed: ${testResults.failed}`);
  console.log(`   ⚠️  Warnings: ${testResults.warnings}`);
  console.log(`   📋 Total Tests: ${testResults.details.length}`);
  
  const successRate = ((testResults.passed / testResults.details.length) * 100).toFixed(1);
  console.log(`   🎯 Success Rate: ${successRate}%`);
  
  if (testResults.failed > 0) {
    console.log(`\n❌ CRITICAL ISSUES:`);
    testResults.details
      .filter(t => t.status === 'fail')
      .forEach(t => console.log(`   • ${t.name}: ${t.message}`));
  }
  
  if (testResults.warnings > 0) {
    console.log(`\n⚠️  WARNINGS:`);
    testResults.details
      .filter(t => t.status === 'warn')
      .forEach(t => console.log(`   • ${t.name}: ${t.message}`));
  }
  
  console.log(`\n🔧 RECOMMENDATIONS:`);
  
  if (testResults.failed > 0) {
    console.log(`   1. Fix all critical issues before proceeding`);
    console.log(`   2. Check server logs for detailed error messages`);
    console.log(`   3. Verify all environment variables are set`);
    console.log(`   4. Ensure database schema is up to date`);
  }
  
  if (testResults.warnings > 0) {
    console.log(`   5. Address warnings to improve system reliability`);
    console.log(`   6. Consider adding missing images for better UX`);
  }
  
  console.log(`   7. Run individual component tests for detailed debugging`);
  console.log(`   8. Check browser console for client-side errors`);
  
  // Save detailed report
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      passed: testResults.passed,
      failed: testResults.failed,
      warnings: testResults.warnings,
      total: testResults.details.length,
      successRate: successRate
    },
    details: testResults.details
  };
  
  fs.writeFileSync(
    path.join(process.cwd(), 'test-report.json'),
    JSON.stringify(reportData, null, 2)
  );
  
  console.log(`\n📄 Detailed report saved to: test-report.json`);
}

async function runAllTests() {
  try {
    await testEnvironmentVariables();
    await testDatabaseConnection();
    await testDatabaseSchema();
    await testAPIEndpoints();
    await testFileStructure();
    await testImageUploadFlow();
    await testNominationSubmissionFlow();
    await testAdminPanelComponents();
    await testDataFlow();
    await testBuildProcess();
    
    await generateReport();
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run all tests
runAllTests();