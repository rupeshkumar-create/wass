#!/usr/bin/env node

/**
 * CREATE TEST DATA FOR FRONTEND
 * This script creates test data that you can use to test the frontend manually
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestDataForFrontend() {
  console.log('📝 CREATING TEST DATA FOR FRONTEND TESTING\n');
  
  try {
    // Create nominators
    console.log('👤 Creating nominators...');
    const nominators = [
      {
        email: 'john.doe@techcorp.com',
        firstname: 'John',
        lastname: 'Doe',
        company: 'TechCorp Inc',
        job_title: 'CEO',
        linkedin: 'https://linkedin.com/in/johndoe',
        country: 'USA'
      },
      {
        email: 'jane.smith@innovate.com',
        firstname: 'Jane',
        lastname: 'Smith',
        company: 'Innovate Solutions',
        job_title: 'CTO',
        linkedin: 'https://linkedin.com/in/janesmith',
        country: 'UK'
      }
    ];
    
    const nominatorIds = [];
    for (const nominator of nominators) {
      const { data, error } = await supabase
        .from('nominators')
        .insert(nominator)
        .select()
        .single();
        
      if (error) throw new Error(`Failed to create nominator: ${error.message}`);
      nominatorIds.push(data.id);
      console.log(`✅ Created nominator: ${data.firstname} ${data.lastname}`);
    }
    
    // Create nominees
    console.log('\n🏆 Creating nominees...');
    const nominees = [
      {
        type: 'person',
        firstname: 'Alice',
        lastname: 'Johnson',
        person_email: 'alice.johnson@example.com',
        person_linkedin: 'https://linkedin.com/in/alicejohnson',
        jobtitle: 'Senior Recruiter',
        person_company: 'Talent Solutions',
        person_country: 'USA',
        headshot_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
        why_me: 'I have successfully placed over 500 candidates in tech roles with a 95% retention rate.',
        live_url: 'https://talentsolutions.com/alice'
      },
      {
        type: 'company',
        company_name: 'Global Staffing Pro',
        company_website: 'https://globalstaffingpro.com',
        company_linkedin: 'https://linkedin.com/company/globalstaffingpro',
        company_country: 'Canada',
        company_size: '500-1000',
        company_industry: 'Staffing & Recruiting',
        logo_url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
        why_us: 'We have revolutionized the staffing industry with AI-powered matching technology.',
        live_url: 'https://globalstaffingpro.com'
      },
      {
        type: 'person',
        firstname: 'Bob',
        lastname: 'Wilson',
        person_email: 'bob.wilson@example.com',
        person_linkedin: 'https://linkedin.com/in/bobwilson',
        jobtitle: 'Talent Acquisition Manager',
        person_company: 'Future Tech',
        person_country: 'Australia',
        headshot_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        why_me: 'I specialize in finding rare tech talent and have built a network of 10,000+ professionals.',
        live_url: 'https://futuretech.com/bob'
      },
      {
        type: 'person',
        firstname: 'Carol',
        lastname: 'Davis',
        person_email: 'carol.davis@example.com',
        person_linkedin: 'https://linkedin.com/in/caroldavis',
        jobtitle: 'Recruitment Director',
        person_company: 'Staff Solutions',
        person_country: 'USA',
        headshot_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
        why_me: 'I have built successful recruitment teams from scratch and increased hiring efficiency by 300%.',
        live_url: 'https://staffsolutions.com/carol'
      }
    ];
    
    const nomineeIds = [];
    for (const nominee of nominees) {
      const { data, error } = await supabase
        .from('nominees')
        .insert(nominee)
        .select()
        .single();
        
      if (error) throw new Error(`Failed to create nominee: ${error.message}`);
      nomineeIds.push(data.id);
      
      const displayName = nominee.type === 'person' 
        ? `${nominee.firstname} ${nominee.lastname}`
        : nominee.company_name;
      console.log(`✅ Created ${nominee.type} nominee: ${displayName}`);
    }
    
    // Create nominations with different states
    console.log('\n📋 Creating nominations...');
    const nominations = [
      {
        nominator_id: nominatorIds[0],
        nominee_id: nomineeIds[0],
        category_group_id: 'individual-awards',
        subcategory_id: 'top-recruiter',
        state: 'submitted'
      },
      {
        nominator_id: nominatorIds[1],
        nominee_id: nomineeIds[1],
        category_group_id: 'company-awards',
        subcategory_id: 'best-staffing-firm',
        state: 'approved'
      },
      {
        nominator_id: nominatorIds[0],
        nominee_id: nomineeIds[2],
        category_group_id: 'individual-awards',
        subcategory_id: 'talent-acquisition-leader',
        state: 'approved'
      },
      {
        nominator_id: nominatorIds[1],
        nominee_id: nomineeIds[3],
        category_group_id: 'individual-awards',
        subcategory_id: 'recruitment-innovation-award',
        state: 'rejected'
      }
    ];
    
    for (const nomination of nominations) {
      const { data, error } = await supabase
        .from('nominations')
        .insert(nomination)
        .select()
        .single();
        
      if (error) throw new Error(`Failed to create nomination: ${error.message}`);
      console.log(`✅ Created nomination: ${nomination.subcategory_id} (${nomination.state})`);
    }
    
    console.log('\n🎉 TEST DATA CREATED SUCCESSFULLY!');
    console.log('\n📊 Summary:');
    console.log(`   • ${nominatorIds.length} nominators created`);
    console.log(`   • ${nomineeIds.length} nominees created`);
    console.log(`   • ${nominations.length} nominations created`);
    console.log('   • Mix of person and company nominees');
    console.log('   • Different states: submitted, approved, rejected');
    console.log('   • Real-looking images from Unsplash');
    
    console.log('\n🌐 NOW YOU CAN TEST THE FRONTEND:');
    console.log('   1. Open: http://localhost:3000/admin');
    console.log('   2. Use passcode: admin123 or wsa2026');
    console.log('   3. You should see 4 nominations with different states');
    console.log('   4. Test filtering, approval, rejection');
    console.log('   5. Check public view: http://localhost:3000/nominees');
    
    console.log('\n✅ Frontend JavaScript errors should now be resolved!');
    
  } catch (error) {
    console.error('❌ Failed to create test data:', error);
  }
}

createTestDataForFrontend().catch(console.error);