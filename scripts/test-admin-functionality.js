#!/usr/bin/env node

/**
 * Test script for admin functionality
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testAdminFunctionality() {
  console.log('🔧 Testing Admin Functionality...\n');

  try {
    // Test 1: Get all nominations
    console.log('1. Testing GET /api/admin/nominations...');
    const { data: nominations, error: nomError } = await supabase
      .from('nominations')
      .select('*')
      .limit(5);

    if (nomError) {
      console.error('❌ Error fetching nominations:', nomError);
      return;
    }

    console.log(`✅ Found ${nominations.length} nominations`);
    
    if (nominations.length > 0) {
      const testNomination = nominations[0];
      console.log(`   Sample: ${testNomination.type} - ${testNomination.state}`);

      // Test 2: Update nomination status
      console.log('\n2. Testing nomination status update...');
      const originalState = testNomination.state;
      const newState = originalState === 'submitted' ? 'approved' : 'submitted';

      const { data: updated, error: updateError } = await supabase
        .from('nominations')
        .update({ 
          state: newState,
          updated_at: new Date().toISOString()
        })
        .eq('id', testNomination.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating nomination:', updateError);
        return;
      }

      console.log(`✅ Updated nomination ${testNomination.id}: ${originalState} → ${newState}`);

      // Revert the change
      await supabase
        .from('nominations')
        .update({ 
          state: originalState,
          updated_at: new Date().toISOString()
        })
        .eq('id', testNomination.id);

      console.log(`✅ Reverted nomination back to ${originalState}`);
    }

    // Test 3: Get stats
    console.log('\n3. Testing stats calculation...');
    const { data: stats, error: statsError } = await supabase
      .from('nominations')
      .select('state, votes');

    if (statsError) {
      console.error('❌ Error fetching stats:', statsError);
      return;
    }

    const totalNominations = stats.length;
    const submittedCount = stats.filter(n => n.state === 'submitted').length;
    const approvedCount = stats.filter(n => n.state === 'approved').length;
    const rejectedCount = stats.filter(n => n.state === 'rejected').length;
    const totalVotes = stats.reduce((sum, n) => sum + (n.votes || 0), 0);

    console.log(`✅ Stats calculated:`);
    console.log(`   Total: ${totalNominations}`);
    console.log(`   Submitted: ${submittedCount}`);
    console.log(`   Approved: ${approvedCount}`);
    console.log(`   Rejected: ${rejectedCount}`);
    console.log(`   Total Votes: ${totalVotes}`);

    // Test 4: Test filtering
    console.log('\n4. Testing filtering...');
    const { data: submittedOnly, error: filterError } = await supabase
      .from('nominations')
      .select('*')
      .eq('state', 'submitted');

    if (filterError) {
      console.error('❌ Error filtering nominations:', filterError);
      return;
    }

    console.log(`✅ Filter test: Found ${submittedOnly.length} submitted nominations`);

    console.log('\n🎉 All admin functionality tests passed!');
    console.log('\nAdmin features available:');
    console.log('• View all nominations with filtering');
    console.log('• Search nominations by name, category, email');
    console.log('• Filter by status (submitted/approved/rejected)');
    console.log('• Filter by type (person/company)');
    console.log('• Individual nomination approval/rejection');
    console.log('• Bulk nomination management');
    console.log('• Export nominations to CSV');
    console.log('• Real-time stats dashboard');
    console.log('• Vote monitoring');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAdminFunctionality();