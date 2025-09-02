#!/usr/bin/env node

/**
 * Build script for Netlify deployment
 * Handles static export and environment setup
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building World Staffing Awards for Netlify deployment...\n');

try {
  // Check if environment variables are set
  console.log('📋 Checking environment configuration...');
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn('⚠️  Warning: Missing environment variables:', missingVars.join(', '));
    console.log('   Make sure to set these in your Netlify environment settings.');
  } else {
    console.log('✅ Environment variables configured');
  }

  // Install dependencies
  console.log('\n📦 Installing dependencies...');
  execSync('npm ci', { stdio: 'inherit' });

  // Build the application
  console.log('\n🔨 Building Next.js application...');
  execSync('npm run build', { stdio: 'inherit' });

  // Check if build was successful
  const outDir = path.join(process.cwd(), 'out');
  if (fs.existsSync(outDir)) {
    console.log('✅ Build completed successfully!');
    console.log(`📁 Static files generated in: ${outDir}`);
    
    // List some key files
    const indexPath = path.join(outDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      console.log('✅ Homepage generated');
    }
    
    const nominatePath = path.join(outDir, 'nominate', 'index.html');
    if (fs.existsSync(nominatePath)) {
      console.log('✅ Nomination page generated');
    }
    
    const directoryPath = path.join(outDir, 'directory', 'index.html');
    if (fs.existsSync(directoryPath)) {
      console.log('✅ Directory page generated');
    }
    
  } else {
    throw new Error('Build output directory not found');
  }

  console.log('\n🎉 Build ready for Netlify deployment!');
  console.log('\nNext steps:');
  console.log('1. Upload the project to GitHub/GitLab');
  console.log('2. Connect your repository to Netlify');
  console.log('3. Set environment variables in Netlify dashboard');
  console.log('4. Deploy!');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}