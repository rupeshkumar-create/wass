#!/usr/bin/env node

/**
 * Setup Comprehensive HubSpot Properties
 * Creates all properties needed for complete nominator, nominee, and voter sync
 */

require('dotenv').config({ path: '.env.local' });

async function setupComprehensiveProperties() {
  console.log('🔧 Setting up Comprehensive HubSpot Properties...');
  
  const token = process.env.HUBSPOT_TOKEN;
  
  if (!token) {
    console.error('❌ HUBSPOT_TOKEN not found');
    return;
  }
  
  try {
    // Additional Contact Properties for comprehensive sync
    console.log('\n📋 Creating additional Contact Properties...');
    
    const additionalContactProperties = [
      {
        name: 'wsa_nomination_category',
        label: 'WSA Nomination Category',
        type: 'string',
        fieldType: 'text',
        groupName: 'contactinformation',
        description: 'Category this contact nominated someone in'
      },
      {
        name: 'wsa_nomination_timestamp',
        label: 'WSA Nomination Timestamp',
        type: 'datetime',
        fieldType: 'date',
        groupName: 'contactinformation',
        description: 'When this contact submitted their nomination'
      },
      {
        name: 'wsa_voting_engagement',
        label: 'WSA Voting Engagement',
        type: 'string',
        fieldType: 'text',
        groupName: 'contactinformation',
        description: 'Level of engagement in WSA voting'
      },
      {
        name: 'wsa_nominee_country',
        label: 'WSA Nominee Country',
        type: 'string',
        fieldType: 'text',
        groupName: 'contactinformation',
        description: 'Country of the nominee'
      },
      {
        name: 'wsa_why_vote_for_me',
        label: 'WSA Why Vote For Me',
        type: 'string',
        fieldType: 'textarea',
        groupName: 'contactinformation',
        description: 'Why people should vote for this nominee'
      },
      {
        name: 'wsa_why_nominated',
        label: 'WSA Why Nominated',
        type: 'string',
        fieldType: 'textarea',
        groupName: 'contactinformation',
        description: 'Reason why this person was nominated'
      },
      {
        name: 'wsa_company_name',
        label: 'WSA Company Name',
        type: 'string',
        fieldType: 'text',
        groupName: 'contactinformation',
        description: 'Company name associated with the nomination'
      },
      {
        name: 'wsa_company_website',
        label: 'WSA Company Website',
        type: 'string',
        fieldType: 'text',
        groupName: 'contactinformation',
        description: 'Company website associated with the nomination'
      },
      {
        name: 'wsa_nominator_name',
        label: 'WSA Nominator Name',
        type: 'string',
        fieldType: 'text',
        groupName: 'contactinformation',
        description: 'Name of the person who nominated this contact'
      },
      {
        name: 'wsa_nominator_email',
        label: 'WSA Nominator Email',
        type: 'string',
        fieldType: 'text',
        groupName: 'contactinformation',
        description: 'Email of the person who nominated this contact'
      }
    ];
    
    for (const prop of additionalContactProperties) {
      await createProperty('contacts', prop, token);
    }
    
    // Additional Company Properties
    console.log('\n🏢 Creating additional Company Properties...');
    
    const additionalCompanyProperties = [
      {
        name: 'wsa_nomination_category',
        label: 'WSA Nomination Category',
        type: 'string',
        fieldType: 'text',
        groupName: 'companyinformation',
        description: 'Category this company was nominated in'
      },
      {
        name: 'wsa_nominee_country',
        label: 'WSA Nominee Country',
        type: 'string',
        fieldType: 'text',
        groupName: 'companyinformation',
        description: 'Country where this company is based'
      },
      {
        name: 'wsa_why_vote_for_me',
        label: 'WSA Why Vote For Us',
        type: 'string',
        fieldType: 'textarea',
        groupName: 'companyinformation',
        description: 'Why people should vote for this company'
      },
      {
        name: 'wsa_why_nominated',
        label: 'WSA Why Nominated',
        type: 'string',
        fieldType: 'textarea',
        groupName: 'companyinformation',
        description: 'Reason why this company was nominated'
      },
      {
        name: 'wsa_nominator_name',
        label: 'WSA Nominator Name',
        type: 'string',
        fieldType: 'text',
        groupName: 'companyinformation',
        description: 'Name of the person who nominated this company'
      },
      {
        name: 'wsa_nominator_email',
        label: 'WSA Nominator Email',
        type: 'string',
        fieldType: 'text',
        groupName: 'companyinformation',
        description: 'Email of the person who nominated this company'
      }
    ];
    
    for (const prop of additionalCompanyProperties) {
      await createProperty('companies', prop, token);
    }
    
    // Additional Ticket Properties
    console.log('\n🎫 Creating additional Ticket Properties...');
    
    const additionalTicketProperties = [
      {
        name: 'wsa_nominee_country',
        label: 'WSA Nominee Country',
        type: 'string',
        fieldType: 'text',
        groupName: 'ticket_information',
        description: 'Country of the nominee'
      },
      {
        name: 'wsa_company_name',
        label: 'WSA Company Name',
        type: 'string',
        fieldType: 'text',
        groupName: 'ticket_information',
        description: 'Company name associated with the nomination'
      },
      {
        name: 'wsa_company_website',
        label: 'WSA Company Website',
        type: 'string',
        fieldType: 'text',
        groupName: 'ticket_information',
        description: 'Company website associated with the nomination'
      },
      {
        name: 'wsa_nominator_name',
        label: 'WSA Nominator Name',
        type: 'string',
        fieldType: 'text',
        groupName: 'ticket_information',
        description: 'Name of the nominator'
      },
      {
        name: 'wsa_nominator_company',
        label: 'WSA Nominator Company',
        type: 'string',
        fieldType: 'text',
        groupName: 'ticket_information',
        description: 'Company of the nominator'
      },
      {
        name: 'wsa_nominator_linkedin',
        label: 'WSA Nominator LinkedIn',
        type: 'string',
        fieldType: 'text',
        groupName: 'ticket_information',
        description: 'LinkedIn profile of the nominator'
      },
      {
        name: 'wsa_nomination_id',
        label: 'WSA Nomination ID',
        type: 'string',
        fieldType: 'text',
        groupName: 'ticket_information',
        description: 'Internal nomination ID'
      },
      {
        name: 'wsa_unique_key',
        label: 'WSA Unique Key',
        type: 'string',
        fieldType: 'text',
        groupName: 'ticket_information',
        description: 'Unique key for the nomination'
      }
    ];
    
    for (const prop of additionalTicketProperties) {
      await createProperty('tickets', prop, token);
    }
    
    console.log('\n✅ All comprehensive properties created successfully!');
    console.log('\n🎯 Next Steps:');
    console.log('1. Add ticket scopes to your HubSpot Private App');
    console.log('2. Create the "WSA 2026 Nominations" pipeline');
    console.log('3. Test the comprehensive sync');
    
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
      } else {
        console.error(`  ❌ Failed to create ${objectType} property ${prop.name}:`, error);
      }
    }
  } catch (error) {
    console.error(`  ❌ Error creating ${objectType} property ${prop.name}:`, error.message);
  }
}

setupComprehensiveProperties();