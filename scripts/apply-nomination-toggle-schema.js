const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySchema() {
  try {
    const schemaPath = path.join(__dirname, '..', 'NOMINATION_TOGGLE_SCHEMA.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📋 Applying nomination toggle schema...');
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('🔄 Executing:', statement.substring(0, 50) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        
        if (error) {
          console.error('❌ Error executing statement:', error);
          console.error('Statement:', statement);
        } else {
          console.log('✅ Statement executed successfully');
        }
      }
    }
    
    console.log('🎉 Schema application completed');
    
    // Verify the settings exist
    const { data: settings, error: fetchError } = await supabase
      .from('system_settings')
      .select('*');
      
    if (fetchError) {
      console.error('❌ Error fetching settings:', fetchError);
      return;
    }
    
    console.log('📋 Current settings:');
    settings.forEach(setting => {
      console.log(`  ${setting.setting_key}: ${setting.setting_value}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

applySchema();