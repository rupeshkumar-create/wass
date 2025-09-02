const puppeteer = require('puppeteer');

async function debugFrontend() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    console.log('BROWSER CONSOLE:', msg.type(), msg.text());
  });
  
  // Listen for page errors
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });
  
  // Listen for failed requests
  page.on('requestfailed', request => {
    console.log('FAILED REQUEST:', request.url(), request.failure().errorText);
  });
  
  try {
    console.log('Navigating to http://localhost:3002...');
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle0', timeout: 30000 });
    
    console.log('Page loaded successfully');
    
    // Wait a bit to see if there are any runtime errors
    await page.waitForTimeout(3000);
    
    // Try to navigate to admin page
    console.log('Navigating to admin page...');
    await page.goto('http://localhost:3002/admin', { waitUntil: 'networkidle0', timeout: 30000 });
    
    console.log('Admin page loaded');
    
    // Wait for any errors to surface
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('Error during navigation:', error.message);
  }
  
  await browser.close();
}

debugFrontend().catch(console.error);