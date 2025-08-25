import { hubspotClient } from './client';

/**
 * Search utilities for finding existing HubSpot records
 */

export interface SearchFilter {
  propertyName: string;
  operator: 'EQ' | 'NEQ' | 'LT' | 'LTE' | 'GT' | 'GTE' | 'BETWEEN' | 'IN' | 'NOT_IN' | 'HAS_PROPERTY' | 'NOT_HAS_PROPERTY' | 'CONTAINS_TOKEN' | 'NOT_CONTAINS_TOKEN';
  value: string | number | boolean;
}

export interface SearchResult {
  total: number;
  results: Array<{
    id: string;
    properties: Record<string, any>;
    createdAt: string;
    updatedAt: string;
  }>;
}

/**
 * Search contacts by email
 */
export async function searchContactByEmail(email: string): Promise<SearchResult['results'][0] | null> {
  try {
    const response = await hubspotClient.hubFetch('/crm/v3/objects/contacts/search', {
      method: 'POST',
      body: {
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'email',
                operator: 'EQ',
                value: email,
              },
            ],
          },
        ],
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
          'wsa_live_url',
        ],
        limit: 1,
      },
    });

    return response.results?.[0] || null;
  } catch (error) {
    console.error('Failed to search contact by email:', error);
    return null;
  }
}

/**
 * Search companies by domain
 */
export async function searchCompanyByDomain(domain: string): Promise<SearchResult['results'][0] | null> {
  try {
    const response = await hubspotClient.hubFetch('/crm/v3/objects/companies/search', {
      method: 'POST',
      body: {
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'domain',
                operator: 'EQ',
                value: domain,
              },
            ],
          },
        ],
        properties: [
          'name',
          'domain',
          'website',
          process.env.HUBSPOT_COMPANY_LINKEDIN_KEY!,
          'wsa_year',
          'wsa_role',
          'wsa_live_url',
        ],
        limit: 1,
      },
    });

    return response.results?.[0] || null;
  } catch (error) {
    console.error('Failed to search company by domain:', error);
    return null;
  }
}

/**
 * Search companies by name (fallback when no domain)
 */
export async function searchCompanyByName(name: string): Promise<SearchResult['results'][0] | null> {
  try {
    const response = await hubspotClient.hubFetch('/crm/v3/objects/companies/search', {
      method: 'POST',
      body: {
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'name',
                operator: 'EQ',
                value: name,
              },
            ],
          },
        ],
        properties: [
          'name',
          'domain',
          'website',
          process.env.HUBSPOT_COMPANY_LINKEDIN_KEY!,
          'wsa_year',
          'wsa_role',
          'wsa_live_url',
        ],
        limit: 1,
      },
    });

    return response.results?.[0] || null;
  } catch (error) {
    console.error('Failed to search company by name:', error);
    return null;
  }
}

/**
 * Search tickets by custom property
 */
export async function searchTicketByNominee(
  nomineeDisplayName: string,
  subcategoryId: string
): Promise<SearchResult['results'][0] | null> {
  try {
    const response = await hubspotClient.hubFetch('/crm/v3/objects/tickets/search', {
      method: 'POST',
      body: {
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'wsa_nominee_display_name',
                operator: 'EQ',
                value: nomineeDisplayName,
              },
              {
                propertyName: 'wsa_subcategory_id',
                operator: 'EQ',
                value: subcategoryId,
              },
              {
                propertyName: 'wsa_year',
                operator: 'EQ',
                value: 2026,
              },
            ],
          },
        ],
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
          'wsa_approval_timestamp',
        ],
        limit: 1,
      },
    });

    return response.results?.[0] || null;
  } catch (error) {
    console.error('Failed to search ticket by nominee:', error);
    return null;
  }
}

/**
 * Generic search function
 */
export async function searchObjects(
  objectType: 'contacts' | 'companies' | 'tickets',
  filters: SearchFilter[],
  properties: string[] = [],
  limit: number = 10
): Promise<SearchResult> {
  try {
    const response = await hubspotClient.hubFetch(`/crm/v3/objects/${objectType}/search`, {
      method: 'POST',
      body: {
        filterGroups: [{ filters }],
        properties,
        limit,
      },
    });

    return {
      total: response.total || 0,
      results: response.results || [],
    };
  } catch (error) {
    console.error(`Failed to search ${objectType}:`, error);
    return { total: 0, results: [] };
  }
}