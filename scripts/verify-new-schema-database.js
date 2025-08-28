#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verifyNewSchemaDatabase() {
  console.log('🔍 VERIFYING NEW SCHEMA IN DATABASE...\n');

  try {
    // 1. Check if new schema tables exist
    console.log('1. Checking new schema tables...');
    
    const tables = ['nominators', 'nominees', 'nominations', 'public_nominees'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`   ❌ ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ ${table}: Exists (${data?.length || 0} sample records)`);
          
          if (data && data.length > 0) {
            console.log(`      Sample fields: ${Object.keys(data[0]).join(', ')}`);
          }
        }
      } catch (err) {
        console.log(`   ❌ ${table}: Error - ${err.message}`);
      }
    }

    // 2. Check if old schema tables still exist
    console.log('\n2. Checking old schema tables...');
    
    const oldTables = ['nominations_old', 'nominations'];
    
    for (const table of oldTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`   ❌ ${table}: ${error.message}`);
        } else {
          console.log(`   ⚠️  ${table}: Still exists (${data?.length || 0} records)`);
          
          if (data && data.length > 0) {
            const fields = Object.keys(data[0]);
            console.log(`      Fields: ${fields.slice(0, 10).join(', ')}${fields.length > 10 ? '...' : ''}`);
            
            // Check if this looks like old schema
            const oldSchemaFields = ['firstname', 'lastname', 'jobtitle', 'personEmail'];
            const hasOldFields = oldSchemaFields.some(field => fields.includes(field));
            
            if (hasOldFields) {
              console.log(`      🚨 Contains old schema fields!`);
            }
          }
        }
      } catch (err) {
        console.log(`   ❌ ${table}: Error - ${err.message}`);
      }
    }

    // 3. Test public_nominees view specifically
    console.log('\n3. Testing public_nominees view...');
    
    try {
      const { data: publicNominees, error } = await supabase
        .from('public_nominees')
        .select('*')
        .limit(5);
      
      if (error) {
        console.log(`   ❌ public_nominees view error: ${error.message}`);
      } else {
        console.log(`   ✅ public_nominees view working (${publicNominees?.length || 0} records)`);
        
        if (publicNominees && publicNominees.length > 0) {
          const sample = publicNominees[0];
          console.log(`   📋 Sample record structure:`);
          console.log(`      nomination_id: ${sample.nomination_id}`);
          console.log(`      nominee_id: ${sample.nominee_id}`);
          console.log(`      display_name: ${sample.display_name}`);
          console.log(`      type: ${sample.type}`);
          console.log(`      subcategory_id: ${sample.subcategory_id}`);
          console.log(`      votes: ${sample.votes}`);
          console.log(`      All fields: ${Object.keys(sample).join(', ')}`);
        }
      }
    } catch (err) {
      console.log(`   ❌ public_nominees view error: ${err.message}`);
    }

    // 4. Check what the API is actually returning
    console.log('\n4. Testing API response...');
    
    try {
      const response = await fetch('http://localhost:3000/api/nominees?limit=1');
      
      if (response.ok) {
        const apiData = await response.json();
        console.log(`   ✅ API responding (${response.status})`);
        console.log(`   📊 API structure: success=${apiData.success}, count=${apiData.count}`);
        
        if (apiData.data && apiData.data.length > 0) {
          const sample = apiData.data[0];
          console.log(`   📋 API sample nominee:`);
          console.log(`      id: ${sample.id}`);
          console.log(`      nomineeId: ${sample.nomineeId}`);
          console.log(`      displayName: ${sample.nominee?.displayName || sample.displayName}`);
          console.log(`      type: ${sample.type}`);
          console.log(`      category: ${sample.category}`);
          
          // Check for old vs new schema indicators
          const hasOldFields = sample.firstname || sample.lastname || sample.jobtitle;
          const hasNewFields = sample.nomineeId && sample.nominee;
          
          console.log(`   🔍 Schema indicators:`);
          console.log(`      Has old fields: ${!!hasOldFields}`);
          console.log(`      Has new fields: ${!!hasNewFields}`);
          
          if (hasOldFields && !hasNewFields) {
            console.log(`   🚨 API is returning OLD SCHEMA data!`);
          } else if (hasNewFields) {
            console.log(`   ✅ API is returning NEW SCHEMA data!`);
          } else {
            console.log(`   ⚠️  API schema status unclear`);
          }
        }
      } else {
        console.log(`   ❌ API error: ${response.status}`);
      }
    } catch (err) {
      console.log(`   ❌ API test error: ${err.message}`);
    }

    // 5. Check individual nominee page
    console.log('\n5. Testing individual nominee page...');
    
    try {
      // Get a nominee ID from the API first
      const nomineesResponse = await fetch('http://localhost:3000/api/nominees?limit=1');
      const nomineesData = await nomineesResponse.json();
      
      if (nomineesData.data && nomineesData.data.length > 0) {
        const testNominee = nomineesData.data[0];
        const pageUrl = `/nominee/${testNominee.id}`;
        
        console.log(`   Testing page: ${pageUrl}`);
        
        const pageResponse = await fetch(`http://localhost:3000${pageUrl}`);
        
        if (pageResponse.ok) {
          console.log(`   ✅ Individual page loads (${pageResponse.status})`);
          
          const pageContent = await pageResponse.text();
          
          // Check what data is being rendered
          const checks = [
            { name: 'Contains nominee name', test: pageContent.includes(testNominee.nominee?.displayName || testNominee.displayName) },
            { name: 'Contains nomination ID', test: pageContent.includes(testNominee.id) },
            { name: 'Contains nominee ID', test: pageContent.includes(testNominee.nomineeId) },
            { name: 'Contains vote count', test: pageContent.includes(testNominee.votes?.toString()) },
            { name: 'Contains category', test: pageContent.includes(testNominee.category) }
          ];
          
          checks.forEach(check => {
            console.log(`   ${check.test ? '✅' : '❌'} ${check.name}`);
          });
          
        } else {
          console.log(`   ❌ Individual page error: ${pageResponse.status}`);
        }
      }
    } catch (err) {
      console.log(`   ❌ Individual page test error: ${err.message}`);
    }

    // 6. Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 NEW SCHEMA VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    
    console.log('\n🎯 CONCLUSIONS:');
    console.log('1. Check if public_nominees view exists and has data');
    console.log('2. Verify API is using the correct database query');
    console.log('3. Ensure old schema tables are not interfering');
    console.log('4. Confirm individual pages use new schema data');
    
    console.log('\n📋 NEXT STEPS:');
    console.log('- If old schema data is still being returned, check API routing');
    console.log('- Verify database migration completed successfully');
    console.log('- Ensure all components use new data structure');
    
  } catch (error) {
    console.error('❌ Schema verification failed:', error.message);
    process.exit(1);
  }
}

// Run the verification
verifyNewSchemaDatabase();