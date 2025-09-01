#!/usr/bin/env node

/**
 * Start development server with proper error handling
 */

require('dotenv').config({ path: '.env.local' });
const { spawn } = require('child_process');

async function startDevServer() {
  console.log('🚀 Starting World Staffing Awards Development Server\n');

  try {
    // Test basic connectivity first
    console.log('🔍 Testing environment...');
    
    const requiredEnvs = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'HUBSPOT_TOKEN',
      'LOOPS_API_KEY'
    ];

    let missingEnvs = [];
    for (const env of requiredEnvs) {
      if (!process.env[env]) {
        missingEnvs.push(env);
      }
    }

    if (missingEnvs.length > 0) {
      console.log('⚠️  Missing environment variables:', missingEnvs.join(', '));
      console.log('   The app will still start but some features may not work');
    } else {
      console.log('✅ All environment variables configured');
    }

    // Quick database connectivity test
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data, error } = await supabase.from('nominations').select('count').limit(1);
        
        if (error) {
          console.log('⚠️  Database connection issue:', error.message);
        } else {
          console.log('✅ Database connection working');
        }
      }
    } catch (dbError) {
      console.log('⚠️  Could not test database connection:', dbError.message);
    }

    console.log('\n🌐 Starting Next.js development server...');
    console.log('   URL: http://localhost:3000');
    console.log('   Admin: http://localhost:3000/admin');
    console.log('   Press Ctrl+C to stop\n');

    // Start the development server
    const devProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { ...process.env }
    });

    devProcess.on('error', (error) => {
      console.error('❌ Failed to start dev server:', error.message);
      process.exit(1);
    });

    devProcess.on('close', (code) => {
      if (code !== 0) {
        console.log(`\n⚠️  Dev server exited with code ${code}`);
      } else {
        console.log('\n👋 Dev server stopped');
      }
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down dev server...');
      devProcess.kill('SIGINT');
      setTimeout(() => {
        process.exit(0);
      }, 1000);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Shutting down dev server...');
      devProcess.kill('SIGTERM');
      setTimeout(() => {
        process.exit(0);
      }, 1000);
    });

  } catch (error) {
    console.error('\n❌ Failed to start:', error.message);
    process.exit(1);
  }
}

// Run the server
startDevServer();