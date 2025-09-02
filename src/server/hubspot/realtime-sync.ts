import { hubspotClient } from './client';
import { upsertContactByEmail } from './contacts';
import { upsertCompanyByDomainOrName } from './companies';

/**
 * Real-time HubSpot Sync for World Staffing Awards 2026
 * 
 * Sync Flow:
 * 1. Nominator submits → Sync nominator to HubSpot with tag "nominator"
 * 2. Admin approves → Sync nominee to HubSpot with tag "nominee" 
 * 3. User votes → Sync voter to HubSpot with tag "voter"
 */

export interface NominatorData {
  firstname: string;
  lastname: string;
  email: string;
  linkedin?: string;
  company?: string;
  jobTitle?: string;
  phone?: string;
  country?: string;
}

export interface NomineeData {
  firstname?: string;
  lastname?: string;
  email?: string;
  linkedin?: string;
  jobtitle?: string;
  company?: string;
  phone?: string;
  country?: string;
  type: 'person' | 'company';
  companyName?: string;
  companyWebsite?: string;
  companyLinkedin?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyCountry?: string;
  companyIndustry?: string;
  companySize?: string;
  subcategoryId: string;
  nominationId: string;
}

export interface VoterData {
  firstname: string;
  lastname: string;
  email: string;
  linkedin?: string;
  company?: string;
  jobTitle?: string;
  phone?: string;
  country?: string;
  votedFor: string;
  subcategoryId: string;
}

/**
 * Sync nominator to HubSpot when nomination is submitted
 * Tags: "nominator", "wsa-2026"
 */
export async function syncNominatorToHubSpot(data: NominatorData): Promise<{
  success: boolean;
  contactId?: string;
  error?: string;
}> {
  try {
    console.log(`🔄 Syncing nominator to HubSpot: ${data.email}`);

    // Prepare HubSpot contact properties
    const properties: Record<string, any> = {
      email: data.email.toLowerCase(),
      firstname: data.firstname,
      lastname: data.lastname,
      lifecyclestage: 'lead',
      
      // Custom WSA properties
      wsa_role: 'Nominator',
      wsa_year: '2026',
      wsa_source: 'World Staffing Awards',
      wsa_nominator_status: 'submitted',
      wsa_submission_date: new Date().toISOString(),
    };

    // Add optional fields if provided
    if (data.linkedin) {
      const linkedinKey = process.env.HUBSPOT_CONTACT_LINKEDIN_KEY || 'linkedin';
      properties[linkedinKey] = data.linkedin;
      properties.wsa_linkedin = data.linkedin;
    }
    
    if (data.company) {
      properties.company = data.company;
      properties.wsa_company = data.company;
    }
    
    if (data.jobTitle) {
      properties.jobtitle = data.jobTitle;
      properties.wsa_job_title = data.jobTitle;
    }
    
    if (data.phone) {
      properties.phone = data.phone;
      properties.wsa_phone = data.phone;
    }
    
    if (data.country) {
      properties.country = data.country;
      properties.wsa_country = data.country;
    }

    // Upsert contact with nominator tag
    const result = await upsertContactByEmail(properties, 'Nominator');

    // Add HubSpot dropdown tag
    await addContactTags(result.id, 'Nominator');

    console.log(`✅ Nominator synced successfully: ${data.email} (Contact ID: ${result.id})`);

    return {
      success: true,
      contactId: result.id,
    };
  } catch (error) {
    console.error(`❌ Failed to sync nominator ${data.email}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sync nominee to HubSpot when nomination is approved by admin
 * Tags: "nominee", "wsa-2026"
 */
export async function syncNomineeToHubSpot(data: NomineeData): Promise<{
  success: boolean;
  contactId?: string;
  error?: string;
}> {
  try {
    console.log(`🔄 Syncing nominee to HubSpot: ${data.email || data.companyName}`);

    if (data.type === 'person') {
      // Sync person nominee
      if (!data.email) {
        throw new Error('Email is required for person nominees');
      }

      const properties: Record<string, any> = {
        email: data.email.toLowerCase(),
        firstname: data.firstname || '',
        lastname: data.lastname || '',
        // Remove lifecyclestage for nominees - let HubSpot manage this
        
        // Custom WSA properties
        wsa_role: 'Nominee_Person',
        wsa_year: '2026',
        wsa_source: 'World Staffing Awards',
        wsa_nominee_type: 'person',
        wsa_nominee_status: 'approved',
        wsa_approval_date: new Date().toISOString(),
        wsa_category: data.subcategoryId,
        wsa_nomination_id: data.nominationId,
      };

      // Add optional fields
      if (data.linkedin) {
        const linkedinKey = process.env.HUBSPOT_CONTACT_LINKEDIN_KEY || 'linkedin';
        properties[linkedinKey] = data.linkedin;
        properties.wsa_linkedin = data.linkedin;
      }
      
      if (data.jobtitle) {
        properties.jobtitle = data.jobtitle;
        properties.wsa_job_title = data.jobtitle;
      }
      
      if (data.company) {
        properties.company = data.company;
        properties.wsa_company = data.company;
      }
      
      if (data.phone) {
        properties.phone = data.phone;
        properties.wsa_phone = data.phone;
      }
      
      if (data.country) {
        properties.country = data.country;
        properties.wsa_country = data.country;
      }

      const result = await upsertContactByEmail(properties, 'Nominee_Person');
      await addContactTags(result.id, 'Nominee_Person');

      console.log(`✅ Person nominee synced successfully: ${data.email} (Contact ID: ${result.id})`);

      return {
        success: true,
        contactId: result.id,
      };
    } else {
      // For company nominees, we'll create a contact with company info
      // Since HubSpot requires an email for contacts, we'll use a placeholder or company email
      const companyEmail = data.email || `contact@${data.companyName?.toLowerCase().replace(/\s+/g, '')}.com`;
      
      const properties: Record<string, any> = {
        email: companyEmail,
        firstname: 'Company',
        lastname: data.companyName || 'Nominee',
        // Remove lifecyclestage for nominees - let HubSpot manage this
        
        // Custom WSA properties
        wsa_role: 'Nominee_Company',
        wsa_year: '2026',
        wsa_source: 'World Staffing Awards',
        wsa_nominee_type: 'company',
        wsa_nominee_status: 'approved',
        wsa_approval_date: new Date().toISOString(),
        wsa_category: data.subcategoryId,
        wsa_nomination_id: data.nominationId,
        wsa_company_name: data.companyName,
      };

      if (data.companyWebsite) {
        properties.website = data.companyWebsite;
        properties.wsa_website = data.companyWebsite;
      }
      
      if (data.companyLinkedin) {
        // Store in WSA custom property instead of standard LinkedIn field
        properties.wsa_linkedin = data.companyLinkedin;
      }
      
      if (data.companyPhone) {
        properties.phone = data.companyPhone;
        properties.wsa_phone = data.companyPhone;
      }
      
      if (data.companyCountry) {
        properties.country = data.companyCountry;
        properties.wsa_country = data.companyCountry;
      }
      
      if (data.companyIndustry) {
        properties.wsa_industry = data.companyIndustry;
      }
      
      if (data.companySize) {
        properties.wsa_company_size = data.companySize;
      }

      const result = await upsertContactByEmail(properties, 'Nominee_Company');
      await addContactTags(result.id, 'Nominee_Company');

      // Also sync to HubSpot Companies with company tag
      if (data.companyName) {
        try {
          const companyProperties: Record<string, any> = {
            name: data.companyName,
            wsa_year: '2026',
            wsa_source: 'World Staffing Awards',
            wsa_nominee_type: 'company',
            wsa_nominee_status: 'approved',
            wsa_category: data.subcategoryId,
            wsa_nomination_id: data.nominationId,
            wsa_company_tag: 'Nominator 2026', // Company tag as specified
          };

          if (data.companyWebsite) {
            companyProperties.website = data.companyWebsite;
            companyProperties.domain = data.companyWebsite.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
          }
          
          if (data.companyPhone) {
            companyProperties.phone = data.companyPhone;
          }
          
          if (data.companyCountry) {
            companyProperties.country = data.companyCountry;
          }
          
          if (data.companyIndustry) {
            // Map to valid HubSpot industry values
            const industryMapping: Record<string, string> = {
              'Staffing & Recruiting': 'HUMAN_RESOURCES',
              'Human Resources': 'HUMAN_RESOURCES',
              'Technology': 'INFORMATION_TECHNOLOGY_AND_SERVICES',
              'Healthcare': 'HOSPITAL_HEALTH_CARE',
              'Finance': 'FINANCIAL_SERVICES',
              'Manufacturing': 'MACHINERY',
              'Consulting': 'MANAGEMENT_CONSULTING'
            };
            companyProperties.industry = industryMapping[data.companyIndustry] || 'HUMAN_RESOURCES';
          }
          
          if (data.companySize) {
            // Map company size to approximate employee count (HubSpot expects a number)
            const sizeMapping: Record<string, number> = {
              '1-10': 5,
              '11-50': 25, 
              '51-200': 100,
              '201-500': 300,
              '501-1000': 750,
              '1001-5000': 2500,
              '5001+': 7500
            };
            companyProperties.numberofemployees = sizeMapping[data.companySize] || 100;
          }

          const companyResult = await upsertCompanyByDomainOrName(companyProperties);
          console.log(`✅ Company nominee also synced to Companies: ${data.companyName} (Company ID: ${companyResult.id})`);
        } catch (companyError) {
          console.warn(`⚠️ Failed to sync company nominee to Companies object:`, companyError);
          // Don't fail the main sync if company sync fails
        }
      }

      console.log(`✅ Company nominee synced successfully: ${data.companyName} (Contact ID: ${result.id})`);

      return {
        success: true,
        contactId: result.id,
      };
    }
  } catch (error) {
    console.error(`❌ Failed to sync nominee:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sync voter to HubSpot when vote is cast
 * Tags: "WSA 2026 Voters", "wsa-2026"
 */
export async function syncVoterToHubSpot(data: VoterData): Promise<{
  success: boolean;
  contactId?: string;
  error?: string;
}> {
  try {
    console.log(`🔄 Syncing voter to HubSpot: ${data.email}`);

    const properties: Record<string, any> = {
      email: data.email.toLowerCase(),
      firstname: data.firstname,
      lastname: data.lastname,
      lifecyclestage: 'lead',
      
      // Custom WSA properties - FIXED TAGS
      wsa_role: 'Voter',
      wsa_year: '2026',
      wsa_source: 'World Staffing Awards',
      wsa_voter_status: 'active',
      wsa_last_vote_date: new Date().toISOString(),
      wsa_voted_for: data.votedFor,
      wsa_vote_category: data.subcategoryId,
      wsa_tags: 'WSA 2026 Voters', // Ensure tags field is set
      wsa_contact_tag: 'WSA 2026 Voters', // Ensure dropdown tag is set
    };

    // Add optional fields
    if (data.linkedin) {
      const linkedinKey = process.env.HUBSPOT_CONTACT_LINKEDIN_KEY || 'linkedin';
      properties[linkedinKey] = data.linkedin;
      properties.wsa_linkedin = data.linkedin;
    }
    
    if (data.company) {
      properties.company = data.company;
      properties.wsa_company = data.company;
    }
    
    if (data.jobTitle) {
      properties.jobtitle = data.jobTitle;
      properties.wsa_job_title = data.jobTitle;
    }
    
    if (data.phone) {
      properties.phone = data.phone;
      properties.wsa_phone = data.phone;
    }
    
    if (data.country) {
      properties.country = data.country;
      properties.wsa_country = data.country;
    }

    const result = await upsertContactByEmail(properties, 'Voter');
    
    // CRITICAL: Add the correct WSA 2026 Voters tag
    await addContactTags(result.id, 'Voter');

    // UPDATE DATABASE WITH SYNC INFO
    try {
      const { supabase } = await import('../../lib/supabase/server');

      // Update voter record with HubSpot sync info and WSA tags
      await supabase
        .from('voters')
        .update({
          hubspot_contact_id: result.id,
          hubspot_synced_at: new Date().toISOString(),
          wsa_tags: 'WSA 2026 Voters',
          wsa_contact_tag: 'WSA 2026 Voters',
          wsa_role: 'Voter',
          wsa_year: '2026',
          wsa_source: 'World Staffing Awards',
          wsa_voter_status: 'active',
          wsa_last_vote_date: new Date().toISOString(),
          wsa_voted_for: data.votedFor,
          wsa_vote_category: data.subcategoryId,
        })
        .eq('email', data.email.toLowerCase());

      console.log(`📊 Updated voter database record with HubSpot sync info and WSA tags`);
    } catch (dbError) {
      console.warn(`⚠️ Failed to update voter database record:`, dbError);
      // Don't fail the sync if database update fails
    }

    console.log(`✅ Voter synced successfully: ${data.email} (Contact ID: ${result.id})`);
    console.log(`🏷️ Voter tagged as "WSA 2026 Voters" in HubSpot and database`);

    return {
      success: true,
      contactId: result.id,
    };
  } catch (error) {
    console.error(`❌ Failed to sync voter ${data.email}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Add HubSpot tags to contact using the dropdown properties you created
 * Tags: WSA 2026 Voters, WSA 2026 Nominees, WSA2026 Nominator
 */
async function addContactTags(contactId: string, role: 'Nominator' | 'Nominee_Person' | 'Nominee_Company' | 'Voter'): Promise<void> {
  try {
    const properties: Record<string, any> = {};
    
    // Map roles to your HubSpot dropdown tags (matching exact values in HubSpot)
    switch (role) {
      case 'Nominator':
        properties.wsa_contact_tag = 'WSA 2026 Nominator';
        break;
      case 'Nominee_Person':
      case 'Nominee_Company':
        properties.wsa_contact_tag = 'WSA 2026 Nominees'; // Matching the actual HubSpot dropdown value
        break;
      case 'Voter':
        properties.wsa_contact_tag = 'WSA 2026 Voters';
        break;
    }

    // Also set a combined tags field for tracking
    properties.wsa_tags = properties.wsa_contact_tag;

    await hubspotClient.hubFetch(`/crm/v3/objects/contacts/${contactId}`, {
      method: 'PATCH',
      body: { properties },
      idempotencyKey: hubspotClient.generateIdempotencyKey(),
    });

    console.log(`🏷️ Tag added to contact ${contactId}: ${properties.wsa_contact_tag}`);
  } catch (error) {
    console.error(`❌ Failed to add tag to contact ${contactId}:`, error);
    // Don't throw - tagging failure shouldn't break the main sync
  }
}

/**
 * Batch sync multiple contacts
 */
export async function batchSyncToHubSpot(items: Array<{
  type: 'nominator' | 'nominee' | 'voter';
  data: NominatorData | NomineeData | VoterData;
}>): Promise<{
  success: boolean;
  results: Array<{ success: boolean; contactId?: string; error?: string }>;
  totalSynced: number;
}> {
  const results: Array<{ success: boolean; contactId?: string; error?: string }> = [];
  let totalSynced = 0;

  console.log(`🔄 Starting batch sync of ${items.length} items to HubSpot`);

  // Process in batches to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (item) => {
      switch (item.type) {
        case 'nominator':
          return await syncNominatorToHubSpot(item.data as NominatorData);
        case 'nominee':
          return await syncNomineeToHubSpot(item.data as NomineeData);
        case 'voter':
          return await syncVoterToHubSpot(item.data as VoterData);
        default:
          return { success: false, error: 'Unknown sync type' };
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
        if (result.value.success) totalSynced++;
      } else {
        results.push({ success: false, error: result.reason?.message || 'Unknown error' });
      }
    });

    // Add delay between batches to respect rate limits
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`✅ Batch sync completed: ${totalSynced}/${items.length} items synced successfully`);

  return {
    success: totalSynced > 0,
    results,
    totalSynced,
  };
}

/**
 * Test HubSpot connection and custom properties
 */
export async function testHubSpotRealTimeSync(): Promise<{
  success: boolean;
  accountInfo?: any;
  customProperties?: any;
  error?: string;
}> {
  try {
    // Test basic connection
    const accountInfo = await hubspotClient.hubFetch('/account-info/v3/details');
    
    // Test custom properties (optional - will create if needed)
    let customProperties;
    try {
      customProperties = await hubspotClient.hubFetch('/crm/v3/properties/contacts');
    } catch (error) {
      console.warn('Could not fetch custom properties:', error);
    }

    return {
      success: true,
      accountInfo,
      customProperties: customProperties?.results?.filter((p: any) => p.name.startsWith('wsa_')),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create required custom properties in HubSpot for both contacts and companies
 */
export async function setupHubSpotCustomProperties(): Promise<{
  success: boolean;
  created: string[];
  error?: string;
}> {
  const requiredProperties = [
    { name: 'wsa_role', label: 'WSA Role', type: 'enumeration', options: ['nominator', 'nominee', 'voter'] },
    { name: 'wsa_year', label: 'WSA Year', type: 'string' },
    { name: 'wsa_source', label: 'WSA Source', type: 'string' },
    { name: 'wsa_tags', label: 'WSA Tags', type: 'string' },
    { name: 'wsa_contact_tag', label: 'WSA Contact Tag', type: 'enumeration', options: ['WSA 2026 Nominator', 'WSA 2026 Nominees', 'WSA 2026 Voters'] },
    { name: 'wsa_linkedin', label: 'WSA LinkedIn', type: 'string' },
    { name: 'wsa_company', label: 'WSA Company', type: 'string' },
    { name: 'wsa_job_title', label: 'WSA Job Title', type: 'string' },
    { name: 'wsa_phone', label: 'WSA Phone', type: 'string' },
    { name: 'wsa_country', label: 'WSA Country', type: 'string' },
    { name: 'wsa_category', label: 'WSA Category', type: 'string' },
    { name: 'wsa_nomination_id', label: 'WSA Nomination ID', type: 'string' },
    { name: 'wsa_nominee_type', label: 'WSA Nominee Type', type: 'enumeration', options: ['person', 'company'] },
    { name: 'wsa_nominee_status', label: 'WSA Nominee Status', type: 'enumeration', options: ['submitted', 'approved', 'rejected'] },
    { name: 'wsa_nominator_status', label: 'WSA Nominator Status', type: 'enumeration', options: ['submitted', 'approved', 'rejected'] },
    { name: 'wsa_voter_status', label: 'WSA Voter Status', type: 'enumeration', options: ['active', 'inactive'] },
    { name: 'wsa_submission_date', label: 'WSA Submission Date', type: 'datetime' },
    { name: 'wsa_approval_date', label: 'WSA Approval Date', type: 'datetime' },
    { name: 'wsa_last_vote_date', label: 'WSA Last Vote Date', type: 'datetime' },
    { name: 'wsa_voted_for', label: 'WSA Voted For', type: 'string' },
    { name: 'wsa_vote_category', label: 'WSA Vote Category', type: 'string' },
    { name: 'wsa_company_name', label: 'WSA Company Name', type: 'string' },
    { name: 'wsa_website', label: 'WSA Website', type: 'string' },
    { name: 'wsa_industry', label: 'WSA Industry', type: 'string' },
    { name: 'wsa_company_size', label: 'WSA Company Size', type: 'string' },
  ];

  // Company properties for WSA Nomination Category and Nominator 2026 tag
  const companyProperties = [
    { name: 'wsa_year', label: 'WSA Year', type: 'string' },
    { name: 'wsa_source', label: 'WSA Source', type: 'string' },
    { name: 'wsa_nominee_type', label: 'WSA Nominee Type', type: 'enumeration', options: ['person', 'company'] },
    { name: 'wsa_nominee_status', label: 'WSA Nominee Status', type: 'enumeration', options: ['submitted', 'approved', 'rejected'] },
    { name: 'wsa_category', label: 'WSA Nomination Category', type: 'string' },
    { name: 'wsa_nomination_id', label: 'WSA Nomination ID', type: 'string' },
    { name: 'wsa_company_tag', label: 'WSA Company Tag', type: 'enumeration', options: ['Nominator 2026'] },
  ];

  const created: string[] = [];

  try {
    // Create contact properties
    for (const property of requiredProperties) {
      try {
        const propertyData: any = {
          name: property.name,
          label: property.label,
          type: property.type,
          fieldType: property.type === 'enumeration' ? 'select' : 'text',
          groupName: 'contactinformation',
        };

        if (property.options) {
          propertyData.options = property.options.map((option: string) => ({
            label: option,
            value: option,
          }));
        }

        await hubspotClient.hubFetch('/crm/v3/properties/contacts', {
          method: 'POST',
          body: propertyData,
        });

        created.push(`contact.${property.name}`);
        console.log(`✅ Created contact property: ${property.name}`);
      } catch (error: any) {
        if (error.status === 409) {
          console.log(`ℹ️ Contact property already exists: ${property.name}`);
        } else {
          console.warn(`⚠️ Failed to create contact property ${property.name}:`, error.message);
        }
      }
    }

    // Create company properties
    for (const property of companyProperties) {
      try {
        const propertyData: any = {
          name: property.name,
          label: property.label,
          type: property.type,
          fieldType: property.type === 'enumeration' ? 'select' : 'text',
          groupName: 'companyinformation',
        };

        if (property.options) {
          propertyData.options = property.options.map((option: string) => ({
            label: option,
            value: option,
          }));
        }

        await hubspotClient.hubFetch('/crm/v3/properties/companies', {
          method: 'POST',
          body: propertyData,
        });

        created.push(`company.${property.name}`);
        console.log(`✅ Created company property: ${property.name}`);
      } catch (error: any) {
        if (error.status === 409) {
          console.log(`ℹ️ Company property already exists: ${property.name}`);
        } else {
          console.warn(`⚠️ Failed to create company property ${property.name}:`, error.message);
        }
      }
    }

    return {
      success: true,
      created,
    };
  } catch (error) {
    return {
      success: false,
      created,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}