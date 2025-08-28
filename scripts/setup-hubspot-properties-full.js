#!/usr/bin/env node

/**
 * Setup Full HubSpot Properties
 * Creates all properties needed for the complete WSA 2026 sync system
 */

require('dotenv').config({ path: '.env.local' });

async function setupFullHubSpotProperties() {
  console.log('🔧 Setting up Full HubSpot Properties for WSA 2026...');
  
  const token = process.env.HUBSPOT_TOKEN;
  
  if (!token) {
    console.error('❌ HUBSPOT_TOKEN not found');
    return;
  }
  
  try {
    // Contact Properties
    console.log('\n📋 Creating Contact Properties...');
    
    const contactProperties = [
      {
        name: 'wsa_year',
        label: 'WSA Year',
        type: 'number',
        fieldType: 'number',
        groupName: 'contactinformation',
        description: 'World Staffing Awards year (2026)'
      },
      {
        name: 'wsa_role',
        label: 'WSA Role',
        type: 'enumeration',
        fieldType: 'checkbox',
        groupName: 'contactinformation',
        description: 'Role(s) in World Staffing Awards 2026',
        options: [
          { label: 'Nominator', value: 'Nominator' },
          { label: 'Voter', value: 'Voter' },
          { label: 'Nominee (Person)', value: 'Nominee_Person' }
        ]
      },
      {
        name: 'wsa_nominated_display_name',
        label: 'WSA Nominated Display Name',
        type: 'string',
        fieldType: 'text',
        groupName: 'contactinformation',
        description: 'Display name of the person/company this contact nominated'
      },
      {
        name: 'wsa_nominator_status',
        label: 'WSA Nominator Status',
        type: 'enumeration',
        fieldType: 'select',
        groupName: 'contactinformation',
        description: 'Status of nomination submitted by this contact',
        options: [
          { label: 'Submitted', value: 'submitted' },
          { label: 'Approved', value: 'approved' },
          { label: 'Rejected', value: 'rejected' }
        ]
      },
      {
        name: 'wsa_voted_for_display_name',
        label: 'WSA Voted For Display Name',
        type: 'string',
        fieldType: 'text',
        groupName: 'contactinformation',
        description: 'Display name of the person/company this contact voted for'
      },
      {
        name: 'wsa_voted_subcategory_id',
        label: 'WSA Voted Subcategory ID',
        type: 'string',
        fieldType: 'text',
        groupName: 'contactinformation',
        description: 'Subcategory ID this contact voted in'
      },
      {
        name: 'wsa_vote_timestamp',
        label: 'WSA Vote Timestamp',
        type: 'datetime',
        fieldType: 'date',
        groupName: 'contactinformation',
        description: 'When this contact cast their vote'
      },
      {
        name: 'wsa_categories',
        label: 'WSA Categories',
        type: 'enumeration',
        fieldType: 'checkbox',
        groupName: 'contactinformation',
        description: 'Categories this nominee is nominated in',
        options: [
          { label: 'Top Recruiter', value: 'top-recruiter' },
          { label: 'Rising Star', value: 'rising-star' },
          { label: 'Executive Leader', value: 'executive-leader' },
          { label: 'AI Platform', value: 'ai-platform' },
          { label: 'Staffing Firm', value: 'staffing-firm' }
        ]
      },
      {
        name: 'wsa_headshot_url',
        label: 'WSA Headshot URL',
        type: 'string',
        fieldType: 'text',
        groupName: 'contactinformation',
        description: 'URL to headshot image for person nominees'
      },
      {
        name: 'wsa_why_me',
        label: 'WSA Why Vote For Me',
        type: 'string',
        fieldType: 'textarea',
        groupName: 'contactinformation',
        description: 'Why people should vote for this person nominee'
      },
      {
        name: 'wsa_live_url',
        label: 'WSA Live URL',
        type: 'string',
        fieldType: 'text',
        groupName: 'contactinformation',
        description: 'Live URL for approved nominees'
      }
    ];
    
    for (const prop of contactProperties) {
      await createProperty('contacts', prop, token);
    }
    
    // Company Properties
    console.log('\n🏢 Creating Company Properties...');
    
    const companyProperties = [
      {
        name: 'wsa_year',
        label: 'WSA Year',
        type: 'number',
        fieldType: 'number',
        groupName: 'companyinformation',
        description: 'World Staffing Awards year (2026)'
      },
      {
        name: 'wsa_role',
        label: 'WSA Role',
        type: 'enumeration',
        fieldType: 'select',
        groupName: 'companyinformation',
        description: 'Role in World Staffing Awards 2026',
        options: [
          { label: 'Nominee (Company)', value: 'Nominee_Company' }
        ]
      },
      {
        name: 'wsa_categories',
        label: 'WSA Categories',
        type: 'enumeration',
        fieldType: 'checkbox',
        groupName: 'companyinformation',
        description: 'Categories this company is nominated in',
        options: [
          { label: 'AI Platform', value: 'ai-platform' },
          { label: 'Staffing Firm', value: 'staffing-firm' },
          { label: 'Technology Solution', value: 'technology-solution' }
        ]
      },
      {
        name: 'wsa_logo_url',
        label: 'WSA Logo URL',
        type: 'string',
        fieldType: 'text',
        groupName: 'companyinformation',
        description: 'URL to logo image for company nominees'
      },
      {
        name: 'wsa_why_us',
        label: 'WSA Why Vote For Us',
        type: 'string',
        fieldType: 'textarea',
        groupName: 'companyinformation',
        description: 'Why people should vote for this company'
      },
      {
        name: 'wsa_live_url',
        label: 'WSA Live URL',
        type: 'string',
        fieldType: 'text',
        groupName: 'companyinformation',
        description: 'Live URL for approved company nominees'
      }
    ];
    
    for (const prop of companyProperties) {
      await createProperty('companies', prop, token);
    }
    
    // Ticket Properties (will fail without permissions)
    console.log('\n🎫 Creating Ticket Properties...');
    
    const ticketProperties = [
      {
        name: 'wsa_year',
        label: 'WSA Year',
        type: 'number',
        fieldType: 'number',
        groupName: 'ticket_information',
        description: 'World Staffing Awards year (2026)'
      },
      {
        name: 'wsa_type',
        label: 'WSA Type',
        type: 'enumeration',
        fieldType: 'select',
        groupName: 'ticket_information',
        description: 'Type of nomination (person or company)',
        options: [
          { label: 'Person', value: 'person' },
          { label: 'Company', value: 'company' }
        ]
      },
      {
        name: 'wsa_category_group',
        label: 'WSA Category Group',
        type: 'string',
        fieldType: 'text',
        groupName: 'ticket_information',
        description: 'Category group for the nomination'
      },
      {
        name: 'wsa_subcategory_id',
        label: 'WSA Subcategory ID',
        type: 'string',
        fieldType: 'text',
        groupName: 'ticket_information',
        description: 'Specific subcategory ID for the nomination'
      },
      {
        name: 'wsa_nominee_display_name',
        label: 'WSA Nominee Display Name',
        type: 'string',
        fieldType: 'text',
        groupName: 'ticket_information',
        description: 'Display name of the nominee'
      },
      {
        name: 'wsa_nominee_linkedin_url',
        label: 'WSA Nominee LinkedIn URL',
        type: 'string',
        fieldType: 'text',
        groupName: 'ticket_information',
        description: 'LinkedIn profile URL of the nominee'
      },
      {
        name: 'wsa_image_url',
        label: 'WSA Image URL',
        type: 'string',
        fieldType: 'text',
        groupName: 'ticket_information',
        description: 'URL to nominee image (headshot or logo)'
      },
      {
        name: 'wsa_nominator_email',
        label: 'WSA Nominator Email',
        type: 'string',
        fieldType: 'text',
        groupName: 'ticket_information',
        description: 'Email address of the nominator'
      },
      {
        name: 'wsa_live_url',
        label: 'WSA Live URL',
        type: 'string',
        fieldType: 'text',
        groupName: 'ticket_information',
        description: 'Live URL set when nomination is approved'
      },
      {
        name: 'wsa_approval_timestamp',
        label: 'WSA Approval Timestamp',
        type: 'datetime',
        fieldType: 'date',
        groupName: 'ticket_information',
        description: 'When the nomination was approved'
      }
    ];
    
    for (const prop of ticketProperties) {
      await createProperty('tickets', prop, token);
    }
    
    console.log('\n✅ All properties setup completed!');
    console.log('\n🎯 Next Steps:');
    console.log('1. Add ticket scopes to your HubSpot Private App if ticket properties failed');
    console.log('2. Create the "WSA 2026 Nominations" pipeline in HubSpot');
    console.log('3. Update your .env.local with correct pipeline and stage IDs');
    console.log('4. Test the sync system');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

async function createProperty(objectType, prop, token) {
  try {
    const response = await fetch(`https://api.hubapi.com/crm/v3/properties/${objectType}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(prop)
    });
    
    if (response.ok) {
      console.log(`  ✅ Created ${objectType} property: ${prop.name}`);
    } else {
      const error = await response.text();
      if (error.includes('already exists')) {
        console.log(`  ⚠️  ${objectType} property already exists: ${prop.name}`);
      } else if (error.includes('permissions')) {
        console.log(`  ⚠️  No permissions for ${objectType} property: ${prop.name}`);
      } else {
        console.error(`  ❌ Failed to create ${objectType} property ${prop.name}:`, error);
      }
    }
  } catch (error) {
    console.error(`  ❌ Error creating ${objectType} property ${prop.name}:`, error.message);
  }
}

setupFullHubSpotProperties();