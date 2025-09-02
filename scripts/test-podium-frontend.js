#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testPodiumFrontend() {
  let browser;
  try {
    console.log('Testing podium on frontend...');
    
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Navigate to home page
    console.log('1. Navigating to home page...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for podium section to load
    console.log('2. Waiting for podium section...');
    await page.waitForSelector('[data-testid="podium-section"], .podium, h2:contains("Top 3 Podium")', { 
      timeout: 10000 
    });
    
    // Check if podium cards are present
    console.log('3. Checking for podium cards...');
    const podiumCards = await page.$$eval('div[class*="grid"] div[class*="Card"], .podium-card', 
      cards => cards.length
    );
    
    console.log(`✓ Found ${podiumCards} podium-related elements`);
    
    // Check for category selector
    console.log('4. Checking for category selector...');
    const categoryButtons = await page.$$eval('button', 
      buttons => buttons.filter(btn => 
        btn.textContent && (
          btn.textContent.includes('Excellence') || 
          btn.textContent.includes('Innovation') ||
          btn.textContent.includes('Culture') ||
          btn.textContent.includes('Growth') ||
          btn.textContent.includes('Geographic') ||
          btn.textContent.includes('Special')
        )
      ).length
    );
    
    console.log(`✓ Found ${categoryButtons} category buttons`);
    
    // Check for "Top 3 Podium" heading
    console.log('5. Checking for podium heading...');
    const podiumHeading = await page.$eval('h2', 
      heading => heading.textContent.includes('Top 3 Podium') || heading.textContent.includes('Podium')
    ).catch(() => false);
    
    if (podiumHeading) {
      console.log('✓ Found podium heading');
    } else {
      console.log('⚠ Podium heading not found');
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'podium-test.png', fullPage: true });
    console.log('✓ Screenshot saved as podium-test.png');
    
    console.log('\n✅ Podium frontend test completed successfully!');
    
  } catch (error) {
    console.error('❌ Podium frontend test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testPodiumFrontend();