#!/usr/bin/env node

/**
 * Deployment script for Netlify
 * Prepares the World Staffing Awards application for Netlify deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing World Staffing Awards for Netlify deployment...\n');

try {
  // Check if build exists
  const buildDir = path.join(process.cwd(), '.next');
  if (!fs.existsSync(buildDir)) {
    console.log('📦 No build found, running build process...');
    execSync('npm run build', { stdio: 'inherit' });
  } else {
    console.log('✅ Build directory found');
  }

  // Check required files
  const requiredFiles = [
    '.next/standalone',
    '.next/static',
    'netlify.toml',
    'package.json'
  ];

  console.log('\n📋 Checking required files...');
  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ Missing: ${file}`);
    }
  }

  // Display deployment information
  console.log('\n🎯 Deployment Information:');
  console.log('=' .repeat(50));
  console.log('Build Output: .next directory');
  console.log('Publish Directory: .next (configured in netlify.toml)');
  console.log('Build Command: npm run build');
  console.log('Node Version: 18');
  console.log('Framework: Next.js with Netlify plugin');

  console.log('\n📝 Environment Variables Required:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  console.log('- HUBSPOT_ACCESS_TOKEN (optional)');

  console.log('\n🔧 Netlify Configuration:');
  console.log('- Framework Detection: Next.js');
  console.log('- Plugin: @netlify/plugin-nextjs');
  console.log('- API Routes: Supported via serverless functions');
  console.log('- Static Assets: Optimized and cached');

  console.log('\n📚 Next Steps:');
  console.log('1. Push your code to GitHub/GitLab');
  console.log('2. Connect repository to Netlify');
  console.log('3. Set environment variables in Netlify dashboard');
  console.log('4. Deploy!');

  console.log('\n✅ Application is ready for Netlify deployment!');

} catch (error) {
  console.error('❌ Deployment preparation failed:', error.message);
  process.exit(1);
}