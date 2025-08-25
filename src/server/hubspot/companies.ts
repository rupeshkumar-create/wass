import { hubspotClient } from './client';
import { searchCompanyByDomain, searchCompanyByName } from './search';

/**
 * Company management utilities
 */

export interface CompanyProperties {
  name: string;
  domain?: string;
  website?: string;
  linkedin?: string;
  wsa_year?: number;
  wsa_role?: string;
  wsa_live_url?: string;
  [key: string]: any;
}

/**
 * Extract domain from website URL
 */
function extractDomain(website: string): string | null {
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    return url.hostname.replace('www.', '');
  } catch {
    return null;
  }
}

/**
 * Upsert company by domain or name
 */
export async function upsertCompany(
  properties: CompanyProperties,
  idempotencyKey?: string
): Promise<{ id: string; isNew: boolean }> {
  const { name, website, domain: providedDomain } = properties;
  
  if (!name) {
    throw new Error('Company name is required');
  }

  // Determine domain for search
  let searchDomain = providedDomain;
  if (!searchDomain && website) {
    searchDomain = extractDomain(website);
  }

  let existingCompany = null;

  // Try to find existing company by domain first
  if (searchDomain) {
    existingCompany = await searchCompanyByDomain(searchDomain);
  }

  // If not found by domain, try by name
  if (!existingCompany) {
    existingCompany = await searchCompanyByName(name);
  }

  if (existingCompany) {
    // Update existing company
    const updateProperties = { ...properties };
    
    // Set LinkedIn at the configured property key
    if (properties.linkedin) {
      updateProperties[process.env.HUBSPOT_COMPANY_LINKEDIN_KEY!] = properties.linkedin;
      delete updateProperties.linkedin;
    }

    // Merge roles (don't overwrite existing)
    if (properties.wsa_role && existingCompany.properties.wsa_role) {
      const existingRoles = existingCompany.properties.wsa_role.split(';').filter(Boolean);
      const newRole = properties.wsa_role;
      
      if (!existingRoles.includes(newRole)) {
        updateProperties.wsa_role = [...existingRoles, newRole].join(';');
      } else {
        // Role already exists, don't update it
        delete updateProperties.wsa_role;
      }
    }

    await hubspotClient.hubFetch(`/crm/v3/objects/companies/${existingCompany.id}`, {
      method: 'PATCH',
      body: { properties: updateProperties },
      idempotencyKey: idempotencyKey || hubspotClient.generateIdempotencyKey(),
    });

    return { id: existingCompany.id, isNew: false };
  } else {
    // Create new company
    const createProperties = { ...properties };
    
    // Set domain if we extracted it
    if (searchDomain && !createProperties.domain) {
      createProperties.domain = searchDomain;
    }

    // Set LinkedIn at the configured property key
    if (properties.linkedin) {
      createProperties[process.env.HUBSPOT_COMPANY_LINKEDIN_KEY!] = properties.linkedin;
      delete createProperties.linkedin;
    }

    // Always set year for new companies
    createProperties.wsa_year = 2026;

    const response = await hubspotClient.hubFetch('/crm/v3/objects/companies', {
      method: 'POST',
      body: { properties: createProperties },
      idempotencyKey: idempotencyKey || hubspotClient.generateIdempotencyKey(),
    });

    return { id: response.id, isNew: true };
  }
}

/**
 * Create or update company nominee
 */
export async function upsertCompanyNominee(nominee: {
  name: string;
  website?: string;
  linkedin: string;
  status?: 'submitted' | 'approved' | 'rejected';
  liveUrl?: string;
}): Promise<{ id: string; isNew: boolean }> {
  return await upsertCompany({
    name: nominee.name,
    website: nominee.website,
    linkedin: nominee.linkedin,
    wsa_year: 2026,
    wsa_role: 'Nominee_Company',
    wsa_live_url: nominee.liveUrl,
  });
}

/**
 * Update company with live URL (for approved nominees)
 */
export async function updateCompanyLiveUrl(
  companyId: string,
  liveUrl: string
): Promise<void> {
  await hubspotClient.hubFetch(`/crm/v3/objects/companies/${companyId}`, {
    method: 'PATCH',
    body: {
      properties: {
        wsa_live_url: liveUrl,
      },
    },
    idempotencyKey: hubspotClient.generateIdempotencyKey(),
  });
}

/**
 * Get company by ID
 */
export async function getCompanyById(companyId: string): Promise<any> {
  try {
    return await hubspotClient.hubFetch(`/crm/v3/objects/companies/${companyId}`, {
      method: 'GET',
    });
  } catch (error) {
    console.error('Failed to get company by ID:', error);
    return null;
  }
}

/**
 * Search for company nominee by LinkedIn URL
 */
export async function searchCompanyByLinkedIn(linkedinUrl: string): Promise<any> {
  try {
    const response = await hubspotClient.hubFetch('/crm/v3/objects/companies/search', {
      method: 'POST',
      body: {
        filterGroups: [
          {
            filters: [
              {
                propertyName: process.env.HUBSPOT_COMPANY_LINKEDIN_KEY!,
                operator: 'EQ',
                value: linkedinUrl,
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
    console.error('Failed to search company by LinkedIn:', error);
    return null;
  }
}