import { hubspotClient } from './client';
import { searchContactByEmail } from './search';
import { mergeRoles } from './map';

/**
 * Contact management with proper upsert semantics
 * Implements role union and non-destructive updates
 */

export interface ContactUpsertResult {
  id: string;
  created: boolean;
  properties: Record<string, any>;
}

/**
 * Upsert contact by email with role merging
 * - If exists: PATCH with merged roles and non-empty fields only
 * - If not exists: POST create new contact
 */
export async function upsertContactByEmail(
  properties: Record<string, any>,
  mergeRole?: string
): Promise<ContactUpsertResult> {
  const email = properties.email;
  if (!email) {
    throw new Error('Email is required for contact upsert');
  }

  const idempotencyKey = hubspotClient.generateIdempotencyKey();

  try {
    // Search for existing contact
    const existingContact = await searchContactByEmail(email);

    if (existingContact) {
      // Update existing contact
      console.log(`Updating existing contact: ${email}`);
      
      // Prepare update properties (only non-empty values)
      const updateProps = { ...properties };
      
      // Handle role merging
      if (mergeRole || properties.wsa_role) {
        const roleToMerge = mergeRole || properties.wsa_role;
        const existingRoles = existingContact.properties.wsa_role;
        const mergedRoles = mergeRoles(existingRoles, roleToMerge);
        updateProps.wsa_role = mergedRoles;
      }

      // Always ensure lifecycle stage is set to lead for WSA contacts
      updateProps.lifecyclestage = 'lead';

      // Remove empty/undefined values to avoid overwriting existing data
      Object.keys(updateProps).forEach(key => {
        if (updateProps[key] === undefined || updateProps[key] === null || updateProps[key] === '') {
          delete updateProps[key];
        }
      });

      // But keep lifecyclestage even if it was empty
      updateProps.lifecyclestage = 'lead';

      const response = await hubspotClient.hubFetch(`/crm/v3/objects/contacts/${existingContact.id}`, {
        method: 'PATCH',
        body: { properties: updateProps },
        idempotencyKey,
      });

      return {
        id: existingContact.id,
        created: false,
        properties: response.properties,
      };
    } else {
      // Create new contact
      console.log(`Creating new contact: ${email}`);
      
      const response = await hubspotClient.hubFetch('/crm/v3/objects/contacts', {
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
    console.error(`Failed to upsert contact ${email}:`, error);
    throw error;
  }
}

/**
 * Create or update contact (legacy wrapper)
 */
export async function createOrUpdateContact(properties: Record<string, any>): Promise<ContactUpsertResult> {
  return upsertContactByEmail(properties);
}

/**
 * Update contact with live URL (for approval flow)
 */
export async function updateContactLiveUrl(contactId: string, liveUrl: string): Promise<void> {
  const idempotencyKey = hubspotClient.generateIdempotencyKey();

  try {
    await hubspotClient.hubFetch(`/crm/v3/objects/contacts/${contactId}`, {
      method: 'PATCH',
      body: {
        properties: {
          wsa_live_url: liveUrl,
        },
      },
      idempotencyKey,
    });

    console.log(`Updated contact ${contactId} with live URL`);
  } catch (error) {
    console.error(`Failed to update contact ${contactId} live URL:`, error);
    throw error;
  }
}

/**
 * Update nominator status (for approval flow)
 */
export async function updateNominatorStatus(
  email: string, 
  status: 'submitted' | 'approved' | 'rejected',
  liveUrl?: string
): Promise<void> {
  const existingContact = await searchContactByEmail(email);
  if (!existingContact) {
    console.warn(`Nominator contact not found for email: ${email}`);
    return;
  }

  const idempotencyKey = hubspotClient.generateIdempotencyKey();
  const updateProps: Record<string, any> = {
    wsa_nominator_status: status,
  };

  if (liveUrl) {
    updateProps.wsa_live_url = liveUrl;
  }

  try {
    await hubspotClient.hubFetch(`/crm/v3/objects/contacts/${existingContact.id}`, {
      method: 'PATCH',
      body: { properties: updateProps },
      idempotencyKey,
    });

    console.log(`Updated nominator ${email} status to ${status}`);
  } catch (error) {
    console.error(`Failed to update nominator ${email} status:`, error);
    throw error;
  }
}

/**
 * Batch upsert contacts
 */
export async function batchUpsertContacts(
  contactsData: Array<{ properties: Record<string, any>; mergeRole?: string }>
): Promise<ContactUpsertResult[]> {
  const results: ContactUpsertResult[] = [];

  // Process in batches to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < contactsData.length; i += batchSize) {
    const batch = contactsData.slice(i, i + batchSize);
    
    const batchPromises = batch.map(({ properties, mergeRole }) =>
      upsertContactByEmail(properties, mergeRole)
    );

    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error(`Failed to upsert contact ${batch[index].properties.email}:`, result.reason);
      }
    });

    // Add delay between batches
    if (i + batchSize < contactsData.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}