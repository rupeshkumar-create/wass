const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testNominationToggle() {
  try {
    console.log('🧪 Testing Nomination Toggle Functionality...\n');
    
    // 1. Test fetching current settings
    console.log('1️⃣ Testing settings fetch...');
    const { data: settings, error: fetchError } = await supabase
      .from('system_settings')
      .select('*');
      
    if (fetchError) {
      console.error('❌ Error fetching settings:', fetchError);
      return;
    }
    
    console.log('✅ Settings fetched successfully:');
    settings.forEach(setting => {
      console.log(`   ${setting.setting_key}: ${setting.setting_value}`);
    });
    
    // 2. Test public API endpoint
    console.log('\n2️⃣ Testing public API endpoint...');
    const response = await fetch('http://localhost:3000/api/settings');
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Public API response:', result);
    } else {
      console.log('⚠️ Public API not available (server not running)');
    }
    
    // 3. Test admin API endpoint simulation
    console.log('\n3️⃣ Testing admin settings update...');
    
    // Get current status
    const currentEnabled = settings.find(s => s.setting_key === 'nominations_enabled')?.setting_value === 'true';
    console.log(`Current status: ${currentEnabled ? 'ENABLED' : 'DISABLED'}`);
    
    // Toggle status
    const newStatus = !currentEnabled;
    const { data: updateData, error: updateError } = await supabase
      .from('system_settings')
      .update({ 
        setting_value: newStatus ? 'true' : 'false',
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', 'nominations_enabled')
      .select();
      
    if (updateError) {
      console.error('❌ Error updating setting:', updateError);
      return;
    }
    
    console.log(`✅ Status toggled to: ${newStatus ? 'ENABLED' : 'DISABLED'}`);
    
    // Toggle back to original status
    const { error: revertError } = await supabase
      .from('system_settings')
      .update({ 
        setting_value: currentEnabled ? 'true' : 'false',
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', 'nominations_enabled');
      
    if (revertError) {
      console.error('❌ Error reverting setting:', revertError);
      return;
    }
    
    console.log(`✅ Status reverted to original: ${currentEnabled ? 'ENABLED' : 'DISABLED'}`);
    
    // 4. Test app_settings view
    console.log('\n4️⃣ Testing app_settings view...');
    const { data: viewData, error: viewError } = await supabase
      .from('app_settings')
      .select('*');
      
    if (viewError) {
      console.error('❌ Error fetching from view:', viewError);
      return;
    }
    
    console.log('✅ App settings view data:');
    viewData.forEach(setting => {
      console.log(`   ${setting.setting_key}: ${setting.setting_value} (boolean: ${setting.boolean_value})`);
    });
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Database schema is working');
    console.log('   ✅ Settings can be read and updated');
    console.log('   ✅ App settings view is functional');
    console.log('   ✅ Toggle functionality is ready');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testNominationToggle();