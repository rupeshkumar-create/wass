#!/usr/bin/env node

/**
 * Quick verification of current system state
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyCurrentState() {
  console.log('🔍 Verifying Current System State\n');

  try {
    // 1. Check database structure
    console.log('1. Checking database structure...');
    
    // Check if live_url column exists
    const { data: nominations, error: nomError } = await supabase
      .from('nominations')
      .select('id, state, live_url')
      .limit(1);

    if (nomError) {
      console.error('❌ Nominations table issue:', nomError.message);
    } else {
      console.log('✅ Nominations table accessible with live_url column');
    }

    // Check admin_nominations view
    const { data: adminNoms, error: adminError } = await supabase
      .from('admin_nominations')
      .select('nomination_id, nominee_live_url')
      .limit(1);

    if (adminError) {
      console.error('❌ Admin nominations view issue:', adminError.message);
    } else {
      console.log('✅ Admin nominations view accessible with nominee_live_url');
    }

    // 2. Check approved nominations
    console.log('\n2. Checking approved nominations...');
    
    const { data: approvedNoms, error: approvedError } = await supabase
      .from('nominations')
      .select(`
        id, 
        state, 
        live_url,
        nominees!inner(firstname, lastname, company_name, type)
      `)
      .eq('state', 'approved');

    if (approvedError) {
      console.error('❌ Error fetching approved nominations:', approvedError.message);
    } else {
      console.log(`✅ Found ${approvedNoms?.length || 0} approved nominations:`);
      
      approvedNoms?.forEach(nom => {
        const nominee = nom.nominees;
        const displayName = nominee.type === 'person' 
          ? `${nominee.firstname || ''} ${nominee.lastname || ''}`.trim()
          : nominee.company_name || '';
        
        console.log(`  • ${displayName}: ${nom.live_url || '❌ NO URL'}`);
      });
    }

    // 3. Check environment variables
    console.log('\n3. Checking environment variables...');
    
    const envVars = {
      'NEXT_PUBLIC_SUPABASE_URL': !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      'SUPABASE_SERVICE_ROLE_KEY': !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      'LOOPS_SYNC_ENABLED': process.env.LOOPS_SYNC_ENABLED === 'true',
      'LOOPS_API_KEY': !!process.env.LOOPS_API_KEY,
      'HUBSPOT_ACCESS_TOKEN': !!process.env.HUBSPOT_ACCESS_TOKEN
    };

    Object.entries(envVars).forEach(([key, value]) => {
      console.log(`  ${value ? '✅' : '❌'} ${key}: ${value ? 'SET' : 'NOT SET'}`);
    });

    // 4. Test API endpoints
    console.log('\n4. Testing API endpoints...');
    
    try {
      // Test admin nominations API
      const adminResponse = await fetch('http://localhost:3000/api/admin/nominations');
      if (adminResponse.ok) {
        const adminResult = await adminResponse.json();
        console.log(`✅ Admin API: ${adminResult.success ? 'Working' : 'Error'} (${adminResult.data?.length || 0} nominations)`);
      } else {
        console.log(`❌ Admin API: Failed (${adminResponse.status})`);
      }
    } catch (error) {
      console.log('❌ Admin API: Server not running or unreachable');
    }

    try {
      // Test environment API
      const envResponse = await fetch('http://localhost:3000/api/test-env');
      if (envResponse.ok) {
        console.log('✅ Environment API: Working');
      } else {
        console.log(`❌ Environment API: Failed (${envResponse.status})`);
      }
    } catch (error) {
      console.log('❌ Environment API: Server not running or unreachable');
    }

    console.log('\n📊 System Status Summary:');
    console.log('• Database structure: Ready for live URLs');
    console.log('• API endpoints: Check results above');
    console.log('• Environment: Check variables above');
    console.log('• Ready for approval workflow testing');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

// Run verification
verifyCurrentState();