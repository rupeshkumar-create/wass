import { hubspotClient } from './client';

/**
 * Search functions for HubSpot objects
 */

export interface ContactSearchResult {
  id: string;
  properties: Record<string, any>;
}

export interface CompanySearchResult {
  id: string;
  properties: Record<string, any>;
}

/**
 * Search for contact by email (primary identifier)
 */
export async function searchContactByEmail(email: string): Promise<ContactSearchResult | null> {
  try {
    const response = await hubspotClient.hubFetch('/crm/v3/objects/contacts/search', {
      method: 'POST',
      body: {
        filterGroups: [{
          filters: [{
            propertyName: 'email',
            operator: 'EQ',
            value: email
          }]
        }],
        properties: [
          'email',
          'firstname',
          'lastname',
          'jobtitle',
          'company',
          process.env.HUBSPOT_CONTACT_LINKEDIN_KEY!,
          'wsa_year',
          'wsa_role',
          'wsa_nominated_display_name',
          'wsa_nominator_status',
          'wsa_voted_for_display_name',
          'wsa_voted_subcategory_id',
          'wsa_vote_timestamp',
          'wsa_categories',
          'wsa_headshot_url',
          'wsa_why_me',
          'wsa_live_url'
        ]
      }
    });

    return response.results?.[0] || null;
  } catch (error) {
    console.error('Failed to search contact by email:', error);
    return null;
  }
}

/**
 * Search for company by domain (preferred) or name (fallback)
 */
export async function searchCompanyByDomainOrName(params: {
  domain?: string;
  name: string;
}): Promise<CompanySearchResult | null> {
  try {
    // First try by domain if available
    if (params.domain) {
      const domainResult = await searchCompanyByDomain(params.domain);
      if (domainResult) return domainResult;
    }

    // Fallback to name search
    return await searchCompanyByName(params.name);
  } catch (error) {
    console.error('Failed to search company:', error);
    return null;
  }
}

/**
 * Search for company by domain
 */
export async function searchCompanyByDomain(domain: string): Promise<CompanySearchResult | null> {
  try {
    const response = await hubspotClient.hubFetch('/crm/v3/objects/companies/search', {
      method: 'POST',
      body: {
        filterGroups: [{
          filters: [{
            propertyName: 'domain',
            operator: 'EQ',
            value: domain
          }]
        }],
        properties: [
          'name',
          'domain',
          'website',
          process.env.HUBSPOT_COMPANY_LINKEDIN_KEY!,
          'wsa_year',
          'wsa_role',
          'wsa_categories',
          'wsa_logo_url',
          'wsa_why_us',
          'wsa_live_url'
        ]
      }
    });

    return response.results?.[0] || null;
  } catch (error) {
    console.error('Failed to search company by domain:', error);
    return null;
  }
}

/**
 * Search for company by name
 */
export async function searchCompanyByName(name: string): Promise<CompanySearchResult | null> {
  try {
    const response = await hubspotClient.hubFetch('/crm/v3/objects/companies/search', {
      method: 'POST',
      body: {
        filterGroups: [{
          filters: [{
            propertyName: 'name',
            operator: 'EQ',
            value: name
          }]
        }],
        properties: [
          'name',
          'domain',
          'website',
          process.env.HUBSPOT_COMPANY_LINKEDIN_KEY!,
          'wsa_year',
          'wsa_role',
          'wsa_categories',
          'wsa_logo_url',
          'wsa_why_us',
          'wsa_live_url'
        ]
      }
    });

    return response.results?.[0] || null;
  } catch (error) {
    console.error('Failed to search company by name:', error);
    return null;
  }
}

/**
 * Search for ticket by unique properties
 */
export async function searchTicketByNomination(params: {
  nominatorEmail: string;
  subcategoryId: string;
  nomineeDisplayName: string;
}): Promise<{ id: string; properties: Record<string, any> } | null> {
  try {
    const response = await hubspotClient.hubFetch('/crm/v3/objects/tickets/search', {
      method: 'POST',
      body: {
        filterGroups: [{
          filters: [
            {
              propertyName: 'wsa_nominator_email',
              operator: 'EQ',
              value: params.nominatorEmail
            },
            {
              propertyName: 'wsa_subcategory_id',
              operator: 'EQ',
              value: params.subcategoryId
            },
            {
              propertyName: 'wsa_nominee_display_name',
              operator: 'EQ',
              value: params.nomineeDisplayName
            }
          ]
        }],
        properties: [
          'subject',
          'content',
          'hs_pipeline',
          'hs_pipeline_stage',
          'wsa_year',
          'wsa_type',
          'wsa_category_group',
          'wsa_subcategory_id',
          'wsa_nominee_display_name',
          'wsa_nominee_linkedin_url',
          'wsa_image_url',
          'wsa_nominator_email',
          'wsa_live_url',
          'wsa_approval_timestamp'
        ]
      }
    });

    return response.results?.[0] || null;
  } catch (error) {
    console.error('Failed to search ticket:', error);
    return null;
  }
}

/**
 * Extract domain from website URL
 */
export function extractDomain(website: string): string | null {
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    return url.hostname.replace('www.', '');
  } catch {
    return null;
  }
}