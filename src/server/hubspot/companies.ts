import { hubspotClient } from './client';
import { searchCompanyByDomainOrName, extractDomain } from './search';

/**
 * Company management with proper upsert semantics
 * Upserts by domain (preferred) or name (fallback)
 */

export interface CompanyUpsertResult {
  id: string;
  created: boolean;
  properties: Record<string, any>;
}

/**
 * Upsert company by domain or name
 * - Search by domain first (if available), then by name
 * - If exists: PATCH with non-empty fields only
 * - If not exists: POST create new company
 */
export async function upsertCompanyByDomainOrName(
  properties: Record<string, any>
): Promise<CompanyUpsertResult> {
  const name = properties.name;
  if (!name) {
    throw new Error('Company name is required for upsert');
  }

  // Extract domain from website if not provided
  let domain = properties.domain;
  if (!domain && properties.website) {
    domain = extractDomain(properties.website);
    if (domain) {
      properties.domain = domain;
    }
  }

  const idempotencyKey = hubspotClient.generateIdempotencyKey();

  try {
    // Search for existing company
    const existingCompany = await searchCompanyByDomainOrName({ domain, name });

    if (existingCompany) {
      // Update existing company
      console.log(`Updating existing company: ${name} (${domain || 'no domain'})`);
      
      // Prepare update properties (only non-empty values)
      const updateProps = { ...properties };
      
      // Remove empty/undefined values to avoid overwriting existing data
      Object.keys(updateProps).forEach(key => {
        if (updateProps[key] === undefined || updateProps[key] === null || updateProps[key] === '') {
          delete updateProps[key];
        }
      });

      const response = await hubspotClient.hubFetch(`/crm/v3/objects/companies/${existingCompany.id}`, {
        method: 'PATCH',
        body: { properties: updateProps },
        idempotencyKey,
      });

      return {
        id: existingCompany.id,
        created: false,
        properties: response.properties,
      };
    } else {
      // Create new company
      console.log(`Creating new company: ${name} (${domain || 'no domain'})`);
      
      const response = await hubspotClient.hubFetch('/crm/v3/objects/companies', {
        method: 'POST',
        body: { properties },
        idempotencyKey,
      });

      return {
        id: response.id,
        created: true,
        properties: response.properties,
      };
    }
  } catch (error) {
    console.error(`Failed to upsert company ${name}:`, error);
    throw error;
  }
}

/**
 * Create or update company (legacy wrapper)
 */
export async function createOrUpdateCompany(properties: Record<string, any>): Promise<CompanyUpsertResult> {
  return upsertCompanyByDomainOrName(properties);
}

/**
 * Update company with live URL (for approval flow)
 */
export async function updateCompanyLiveUrl(companyId: string, liveUrl: string): Promise<void> {
  const idempotencyKey = hubspotClient.generateIdempotencyKey();

  try {
    await hubspotClient.hubFetch(`/crm/v3/objects/companies/${companyId}`, {
      method: 'PATCH',
      body: {
        properties: {
          wsa_live_url: liveUrl,
        },
      },
      idempotencyKey,
    });

    console.log(`Updated company ${companyId} with live URL`);
  } catch (error) {
    console.error(`Failed to update company ${companyId} live URL:`, error);
    throw error;
  }
}

/**
 * Search company by LinkedIn URL (alternative search method)
 */
export async function searchCompanyByLinkedIn(linkedinUrl: string): Promise<CompanyUpsertResult | null> {
  try {
    const linkedinKey = process.env.HUBSPOT_COMPANY_LINKEDIN_KEY!;
    
    const response = await hubspotClient.hubFetch('/crm/v3/objects/companies/search', {
      method: 'POST',
      body: {
        filterGroups: [{
          filters: [{
            propertyName: linkedinKey,
            operator: 'EQ',
            value: linkedinUrl
          }]
        }],
        properties: [
          'name',
          'domain',
          'website',
          linkedinKey,
          'wsa_year',
          'wsa_role',
          'wsa_categories',
          'wsa_logo_url',
          'wsa_why_us',
          'wsa_live_url'
        ]
      }
    });

    const company = response.results?.[0];
    return company ? {
      id: company.id,
      created: false,
      properties: company.properties
    } : null;
  } catch (error) {
    console.error('Failed to search company by LinkedIn:', error);
    return null;
  }
}

/**
 * Batch upsert companies
 */
export async function batchUpsertCompanies(
  companiesData: Array<{ properties: Record<string, any> }>
): Promise<CompanyUpsertResult[]> {
  const results: CompanyUpsertResult[] = [];

  // Process in batches to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < companiesData.length; i += batchSize) {
    const batch = companiesData.slice(i, i + batchSize);
    
    const batchPromises = batch.map(({ properties }) =>
      upsertCompanyByDomainOrName(properties)
    );

    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error(`Failed to upsert company ${batch[index].properties.name}:`, result.reason);
      }
    });

    // Add delay between batches
    if (i + batchSize < companiesData.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}