#!/usr/bin/env node

/**
 * Manually sync specific nominee to Loops
 * Run this after applying the database schema update
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncSpecificNomineeToLoops() {
  try {
    const email = 'kibenaf740@besaies.com';
    console.log(`🔄 Syncing nominee to Loops: ${email}`);
    
    // 1. Get nominee from database
    const { data: nominees, error: nomineesError } = await supabase
      .from('nominees')
      .select('*')
      .eq('person_email', email)
      .single();
    
    if (nomineesError) {
      console.error('❌ Error fetching nominee:', nomineesError);
      return;
    }
    
    if (!nominees) {
      console.log('❌ Nominee not found');
      return;
    }
    
    console.log('✅ Found nominee:', nominees.firstname, nominees.lastname);
    
    // 2. Get nomination details
    const { data: nominations, error: nominationsError } = await supabase
      .from('nominations')
      .select(`
        *,
        nominators (*)
      `)
      .eq('nominee_id', nominees.id)
      .single();
    
    if (nominationsError) {
      console.error('❌ Error fetching nomination:', nominationsError);
      return;
    }
    
    console.log('✅ Found nomination with nominator');
    
    // 3. Sync nominee to Loops
    console.log('\n🔄 Syncing nominee to Loops...');
    const loopsApiKey = process.env.LOOPS_API_KEY;
    
    if (!loopsApiKey) {
      console.log('❌ LOOPS_API_KEY not found');
      return;
    }
    
    // Create/update nominee in Loops
    const nomineeData = {
      email: nominees.person_email,
      firstName: nominees.firstname || '',
      lastName: nominees.lastname || '',
      userGroup: 'nominees',
      source: 'WSA2026',
      // Custom properties
      nomineeType: nominees.type,
      jobTitle: nominees.jobtitle || '',
      linkedin: nominees.person_linkedin || '',
      category: nominations.subcategory_id || '',
      nominationState: nominations.state || 'submitted'
    };
    
    try {
      const nomineeResponse = await fetch('https://app.loops.so/api/v1/contacts/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${loopsApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nomineeData)
      });
      
      if (nomineeResponse.ok) {
        const nomineeResult = await nomineeResponse.json();
        console.log('✅ Nominee synced to Loops:', nomineeResult.id);
        
        // Update database with Loops contact ID
        const { error: updateError } = await supabase
          .from('nominees')
          .update({
            loops_contact_id: nomineeResult.id,
            loops_synced_at: new Date().toISOString()
          })
          .eq('id', nominees.id);
        
        if (updateError) {
          console.error('❌ Error updating nominee with Loops ID:', updateError);
        } else {
          console.log('✅ Updated nominee with Loops contact ID');
        }
      } else {
        const errorText = await nomineeResponse.text();
        console.log('❌ Error syncing nominee to Loops:', nomineeResponse.status, errorText);
      }
    } catch (error) {
      console.error('❌ Error calling Loops API for nominee:', error.message);
    }
    
    // 4. Sync nominator to Loops
    if (nominations.nominators) {
      console.log('\n👤 Syncing nominator to Loops...');
      const nominator = nominations.nominators;
      
      const nominatorData = {
        email: nominator.email,
        firstName: nominator.firstname || '',
        lastName: nominator.lastname || '',
        userGroup: 'nominators',
        source: 'WSA2026',
        // Custom properties
        company: nominator.company || '',
        jobTitle: nominator.job_title || '',
        linkedin: nominator.linkedin || '',
        nominatedPerson: `${nominees.firstname} ${nominees.lastname}`.trim(),
        nominationCategory: nominations.subcategory_id || ''
      };
      
      try {
        const nominatorResponse = await fetch('https://app.loops.so/api/v1/contacts/create', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${loopsApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(nominatorData)
        });
        
        if (nominatorResponse.ok) {
          const nominatorResult = await nominatorResponse.json();
          console.log('✅ Nominator synced to Loops:', nominatorResult.id);
          
          // Update database with Loops contact ID
          const { error: updateError } = await supabase
            .from('nominators')
            .update({
              loops_contact_id: nominatorResult.id,
              loops_synced_at: new Date().toISOString()
            })
            .eq('id', nominator.id);
          
          if (updateError) {
            console.error('❌ Error updating nominator with Loops ID:', updateError);
          } else {
            console.log('✅ Updated nominator with Loops contact ID');
          }
        } else {
          const errorText = await nominatorResponse.text();
          console.log('❌ Error syncing nominator to Loops:', nominatorResponse.status, errorText);
        }
      } catch (error) {
        console.error('❌ Error calling Loops API for nominator:', error.message);
      }
    }
    
    console.log('\n🎉 Sync complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

syncSpecificNomineeToLoops();