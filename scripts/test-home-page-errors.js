#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testHomePageErrors() {
  let browser;
  try {
    console.log('Testing home page for errors...');
    
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Listen for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
      errors.push(`Page Error: ${error.message}`);
    });
    
    // Navigate to home page
    console.log('1. Navigating to home page...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait a bit for any async operations
    await page.waitForTimeout(3000);
    
    // Check for errors
    if (errors.length > 0) {
      console.log('❌ Found errors:');
      errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ No console errors found');
    }
    
    // Check if PublicPodium section exists
    console.log('2. Checking for podium section...');
    const podiumExists = await page.evaluate(() => {
      // Look for podium-related text or elements
      const text = document.body.innerText;
      return text.includes('Top 3 Podium') || 
             text.includes('Podium') ||
             document.querySelector('[class*="podium"]') !== null ||
             document.querySelector('h2:contains("Top 3 Podium")') !== null;
    });
    
    if (podiumExists) {
      console.log('✅ Podium section found');
    } else {
      console.log('❌ Podium section not found');
    }
    
    // Check for specific elements
    console.log('3. Checking page elements...');
    const elements = await page.evaluate(() => {
      return {
        hasStatsSection: document.body.innerText.includes('Total Nominations') || document.body.innerText.includes('Stats'),
        hasCategories: document.body.innerText.includes('Excellence') || document.body.innerText.includes('Innovation'),
        hasTimeline: document.body.innerText.includes('Timeline') || document.body.innerText.includes('Awards Timeline'),
        hasCTA: document.body.innerText.includes('Ready to') || document.body.innerText.includes('Start Voting'),
        bodyText: document.body.innerText.substring(0, 500) // First 500 chars for debugging
      };
    });
    
    console.log('Page elements:', elements);
    
    // Take a screenshot
    await page.screenshot({ path: 'home-page-test.png', fullPage: true });
    console.log('✅ Screenshot saved as home-page-test.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testHomePageErrors();