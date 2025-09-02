const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function generateCredentials() {
  try {
    const password = 'WSA2026Admin!Secure';
    const hash = await bcrypt.hash(password, 12);
    
    const secrets = {
      sessionSecret: crypto.randomBytes(32).toString('hex'),
      cronSecret: crypto.randomBytes(16).toString('hex'),
      syncSecret: crypto.randomBytes(16).toString('hex')
    };
    
    console.log('=== ADMIN CREDENTIALS ===');
    console.log('Email: admin@worldstaffingawards.com');
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('');
    console.log('=== COPY THESE TO YOUR .env FILE ===');
    console.log('ADMIN_EMAILS=admin@worldstaffingawards.com');
    console.log(`ADMIN_PASSWORD_HASHES=${hash}`);
    console.log(`SERVER_SESSION_SECRET=${secrets.sessionSecret}`);
    console.log(`CRON_SECRET=${secrets.cronSecret}`);
    console.log(`SYNC_SECRET=${secrets.syncSecret}`);
    console.log('');
    console.log('=== ADDITIONAL REQUIRED VARIABLES ===');
    console.log('# Add these to your existing .env file:');
    console.log('# SUPABASE_URL=https://your-project.supabase.co');
    console.log('# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
    console.log('# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
    console.log('# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key');
    console.log('# HUBSPOT_ACCESS_TOKEN=your_hubspot_token');
    console.log('# LOOPS_API_KEY=your_loops_key');
    console.log('# NEXT_PUBLIC_APP_URL=https://your-domain.com');
    
  } catch (error) {
    console.error('Error generating credentials:', error);
  }
}

generateCredentials();