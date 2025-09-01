#!/usr/bin/env node

/**
 * Debug Loops sync for specific nominee: kibenaf740@besaies.com
 * Check database, Loops API, and sync status
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugSpecificNomineeLoops() {
  try {
    const email = 'kibenaf740@besaies.com';
    console.log(`🔍 Debugging Loops sync for: ${email}`);
    
    // 1. Check if nominee exists in database
    console.log('\n📊 Checking database...');
    const { data: nominees, error: nomineesError } = await supabase
      .from('nominees')
      .select('*')
      .eq('person_email', email);
    
    if (nomineesError) {
      console.error('❌ Error fetching nominees:', nomineesError);
      return;
    }
    
    if (!nominees || nominees.length === 0) {
      console.log('❌ Nominee not found in database');
      return;
    }
    
    const nominee = nominees[0];
    console.log('✅ Found nominee in database:');
    console.log('- ID:', nominee.id);
    console.log('- Type:', nominee.type);
    console.log('- Name:', `${nominee.firstname || ''} ${nominee.lastname || ''}`.trim());
    console.log('- Email:', nominee.person_email);
    console.log('- LinkedIn:', nominee.person_linkedin);
    console.log('- Created At:', nominee.created_at);
    
    // 2. Check Loops API for this contact
    console.log('\n🔄 Checking Loops API...');
    const loopsApiKey = process.env.LOOPS_API_KEY;
    if (!loopsApiKey) {
      console.log('❌ LOOPS_API_KEY not found');
      return;
    }
    
    try {
      const response = await fetch(`https://app.loops.so/api/v1/contacts/find?email=${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Bearer ${loopsApiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const loopsResponse = await response.json();
        
        // Loops API returns an array
        if (Array.isArray(loopsResponse) && loopsResponse.length > 0) {
          const loopsContact = loopsResponse[0];
          console.log('✅ Found in Loops:');
          console.log('- Contact ID:', loopsContact.id);
          console.log('- Email:', loopsContact.email);
          console.log('- First Name:', loopsContact.firstName);
          console.log('- Last Name:', loopsContact.lastName);
          console.log('- User Group:', loopsContact.userGroup);
          console.log('- Source:', loopsContact.source);
          console.log('- Job Title:', loopsContact.jobTitle);
          console.log('- LinkedIn:', loopsContact.linkedin);
          console.log('- Category:', loopsContact.category);
          console.log('- Nomination State:', loopsContact.nominationState);
          
          // Check if user group is correct
          if (loopsContact.userGroup !== 'nominees') {
            console.log(`⚠️  User group is '${loopsContact.userGroup}', should be 'nominees'`);
          } else {
            console.log('✅ User group is correct: nominees');
          }
        } else {
          console.log('❌ Contact not found in Loops (empty response)');
        }
      } else if (response.status === 404) {
        console.log('❌ Contact not found in Loops');
      } else {
        const errorText = await response.text();
        console.log('❌ Loops API error:', response.status, errorText);
      }
    } catch (loopsError) {
      console.error('❌ Error calling Loops API:', loopsError.message);
    }
    
    // 3. Check nominator information
    console.log('\n👤 Checking nominator...');
    const { data: nominations, error: nominationsError } = await supabase
      .from('nominations')
      .select(`
        *,
        nominators (*)
      `)
      .eq('nominee_id', nominee.id);
    
    if (nominationsError) {
      console.error('❌ Error fetching nominations:', nominationsError);
    } else if (nominations && nominations.length > 0) {
      const nomination = nominations[0];
      console.log('✅ Found nomination:');
      console.log('- Nomination ID:', nomination.id);
      console.log('- State:', nomination.state);
      console.log('- Created At:', nomination.created_at);
      
      if (nomination.nominators) {
        const nominator = nomination.nominators;
        console.log('- Nominator Email:', nominator.email);
        console.log('- Nominator Name:', `${nominator.firstname} ${nominator.lastname}`);
        console.log('- Nominator Company:', nominator.company);
      } else {
        console.log('- Nominator: Not found in join');
      }
      
      // Check if nominator exists in Loops
      if (nomination.nominators && nomination.nominators.email) {
        console.log('\n👤 Checking nominator in Loops...');
        try {
          const nominatorEmail = nomination.nominators.email;
          const nominatorResponse = await fetch(`https://app.loops.so/api/v1/contacts/find?email=${encodeURIComponent(nominatorEmail)}`, {
            headers: {
              'Authorization': `Bearer ${loopsApiKey}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (nominatorResponse.ok) {
            const nominatorLoopsResponse = await nominatorResponse.json();
            
            if (Array.isArray(nominatorLoopsResponse) && nominatorLoopsResponse.length > 0) {
              const nominatorContact = nominatorLoopsResponse[0];
              console.log('✅ Nominator found in Loops:');
              console.log('- Contact ID:', nominatorContact.id);
              console.log('- Email:', nominatorContact.email);
              console.log('- User Group:', nominatorContact.userGroup);
              console.log('- First Name:', nominatorContact.firstName);
              console.log('- Last Name:', nominatorContact.lastName);
              
              if (nominatorContact.userGroup !== 'nominators') {
                console.log(`⚠️  Nominator user group is '${nominatorContact.userGroup}', should be 'nominators'`);
              } else {
                console.log('✅ Nominator user group is correct: nominators');
              }
            } else {
              console.log('❌ Nominator not found in Loops (empty response)');
            }
          } else if (nominatorResponse.status === 404) {
            console.log('❌ Nominator not found in Loops');
          } else {
            console.log('❌ Error checking nominator in Loops:', nominatorResponse.status);
          }
        } catch (error) {
          console.error('❌ Error checking nominator:', error.message);
        }
      }
    } else {
      console.log('❌ No nominations found for this nominee');
    }
    
    // 4. Suggest fixes
    console.log('\n🔧 Suggested fixes:');
    if (!nominee.loops_contact_id) {
      console.log('- Nominee needs to be synced to Loops');
    }
    if (!nominee.loops_synced_at) {
      console.log('- Loops sync timestamp is missing');
    }
    console.log('- Run manual sync for this nominee');
    console.log('- Check if Loops sync is enabled in environment variables');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugSpecificNomineeLoops();