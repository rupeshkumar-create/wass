#!/usr/bin/env node

let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (error) {
  puppeteer = null;
}

async function testNomineeClientFetch() {
  console.log('🧪 Testing Nominee Client-Side Fetch...');
  console.log('=====================================');

  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Listen to console logs
    page.on('console', msg => {
      console.log(`🖥️  BROWSER: ${msg.text()}`);
    });
    
    // Listen to network requests
    page.on('response', response => {
      if (response.url().includes('/api/nominee/')) {
        console.log(`📡 API Response: ${response.status()} ${response.url()}`);
      }
    });
    
    // Navigate to nominee page
    console.log('\n1️⃣ Navigating to nominee page...');
    await page.goto('http://localhost:3000/nominee/ayush-raj', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Wait a bit for React to load
    await page.waitForTimeout(3000);
    
    // Check page content
    const content = await page.content();
    console.log('\n2️⃣ Checking page content...');
    
    if (content.includes('Loading nominee:')) {
      console.log('❌ Page is stuck in loading state');
    } else if (content.includes('Nominee: Ayush Raj')) {
      console.log('✅ Page loaded successfully with nominee data');
    } else if (content.includes('Error:')) {
      console.log('❌ Page shows error state');
    } else {
      console.log('⚠️  Unknown page state');
    }
    
    // Get the actual displayed text
    const displayedText = await page.evaluate(() => {
      return document.querySelector('h1')?.textContent || 'No h1 found';
    });
    console.log(`📄 Displayed H1: "${displayedText}"`);
    
    // Check if API was called
    const apiCalled = await page.evaluate(() => {
      return window.performance.getEntriesByName('http://localhost:3000/api/nominee/ayush-raj').length > 0;
    });
    console.log(`📡 API Called: ${apiCalled}`);
    
    // Wait longer to see if it eventually loads
    console.log('\n3️⃣ Waiting 5 more seconds to see if it loads...');
    await page.waitForTimeout(5000);
    
    const finalText = await page.evaluate(() => {
      return document.querySelector('h1')?.textContent || 'No h1 found';
    });
    console.log(`📄 Final H1: "${finalText}"`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Check if puppeteer is available
if (puppeteer) {
  testNomineeClientFetch();
} else {
  console.log('⚠️  Puppeteer not available, running simple curl test instead...');
  
  // Fallback to simple test
  const { execSync } = require('child_process');
  
  try {
    console.log('\n🧪 Testing API directly...');
    const apiResult = execSync('curl -s http://localhost:3000/api/nominee/ayush-raj', { encoding: 'utf8' });
    console.log('✅ API Response:', JSON.parse(apiResult).nominee?.name || 'No name found');
    
    console.log('\n🧪 Testing page HTML...');
    const pageResult = execSync('curl -s http://localhost:3000/nominee/ayush-raj', { encoding: 'utf8' });
    
    if (pageResult.includes('Loading nominee:')) {
      console.log('❌ Page shows loading state in SSR');
    } else if (pageResult.includes('Nominee:')) {
      console.log('✅ Page shows nominee data in SSR');
    } else {
      console.log('⚠️  Unknown page state in SSR');
    }
    
  } catch (error) {
    console.error('❌ Fallback test failed:', error.message);
  }
}