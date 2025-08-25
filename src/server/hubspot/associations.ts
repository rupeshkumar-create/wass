import { hubspotClient } from './client';

/**
 * Association management utilities
 */

export type ObjectType = 'contacts' | 'companies' | 'tickets' | 'deals' | 'line_items' | 'products' | 'quotes';

export interface AssociationLabel {
  category: 'HUBSPOT_DEFINED' | 'USER_DEFINED' | 'INTEGRATOR_DEFINED';
  typeId: number;
}

/**
 * Create association between two objects with a label
 */
export async function createAssociation(
  fromObjectType: ObjectType,
  fromObjectId: string,
  toObjectType: ObjectType,
  toObjectId: string,
  associationLabel: string,
  idempotencyKey?: string
): Promise<void> {
  
  try {
    // For standard associations, we can use the simpler endpoint
    await hubspotClient.hubFetch(
      `/crm/v4/objects/${fromObjectType}/${fromObjectId}/associations/${toObjectType}/${toObjectId}`,
      {
        method: 'PUT',
        body: [
          {
            associationCategory: 'USER_DEFINED',
            associationTypeId: await getAssociationTypeId(fromObjectType, toObjectType, associationLabel),
          },
        ],
        idempotencyKey: idempotencyKey || hubspotClient.generateIdempotencyKey(),
      }
    );
  } catch (error) {
    console.error(`Failed to create association ${fromObjectType}:${fromObjectId} -> ${toObjectType}:${toObjectId}:`, error);
    
    // Fallback to basic association without label
    try {
      await hubspotClient.hubFetch(
        `/crm/v4/objects/${fromObjectType}/${fromObjectId}/associations/${toObjectType}/${toObjectId}`,
        {
          method: 'PUT',
          body: [
            {
              associationCategory: 'HUBSPOT_DEFINED',
              associationTypeId: getDefaultAssociationTypeId(fromObjectType, toObjectType),
            },
          ],
          idempotencyKey: idempotencyKey || hubspotClient.generateIdempotencyKey(),
        }
      );
    } catch (fallbackError) {
      console.error('Fallback association also failed:', fallbackError);
      throw fallbackError;
    }
  }
}

/**
 * Associate ticket with nominator contact
 */
export async function associateTicketWithNominator(
  ticketId: string,
  nominatorContactId: string,
  idempotencyKey?: string
): Promise<void> {
  await createAssociation(
    'tickets',
    ticketId,
    'contacts',
    nominatorContactId,
    'Nominator 2026',
    idempotencyKey
  );
}

/**
 * Associate ticket with nominee (contact or company)
 */
export async function associateTicketWithNominee(
  ticketId: string,
  nomineeId: string,
  nomineeType: 'contact' | 'company',
  idempotencyKey?: string
): Promise<void> {
  const objectType = nomineeType === 'contact' ? 'contacts' : 'companies';
  
  await createAssociation(
    'tickets',
    ticketId,
    objectType,
    nomineeId,
    'Nominee 2026',
    idempotencyKey
  );
}

/**
 * Associate voter with nominee
 */
export async function associateVoterWithNominee(
  voterContactId: string,
  nomineeId: string,
  nomineeType: 'contact' | 'company',
  idempotencyKey?: string
): Promise<void> {
  const objectType = nomineeType === 'contact' ? 'contacts' : 'companies';
  
  await createAssociation(
    'contacts',
    voterContactId,
    objectType,
    nomineeId,
    'Voted for 2026',
    idempotencyKey
  );
}

/**
 * Get association type ID for custom labels
 * This is a simplified version - in practice, you might need to create custom association types
 */
async function getAssociationTypeId(
  fromObjectType: ObjectType,
  toObjectType: ObjectType,
  label: string
): Promise<number> {
  // For now, return default association type IDs
  // In a full implementation, you would:
  // 1. Check if custom association type exists
  // 2. Create it if it doesn't exist
  // 3. Return the type ID
  
  return getDefaultAssociationTypeId(fromObjectType, toObjectType);
}

/**
 * Get default association type IDs
 */
function getDefaultAssociationTypeId(fromObjectType: ObjectType, toObjectType: ObjectType): number {
  // Standard HubSpot association type IDs
  const associationTypes: Record<string, number> = {
    'tickets-contacts': 16, // Ticket to Contact
    'contacts-tickets': 15, // Contact to Ticket
    'tickets-companies': 26, // Ticket to Company
    'companies-tickets': 25, // Company to Ticket
    'contacts-companies': 2, // Contact to Company
    'companies-contacts': 1, // Company to Contact
  };

  const key = `${fromObjectType}-${toObjectType}`;
  return associationTypes[key] || 1; // Default to basic association
}

/**
 * Remove association between objects
 */
export async function removeAssociation(
  fromObjectType: ObjectType,
  fromObjectId: string,
  toObjectType: ObjectType,
  toObjectId: string,
  idempotencyKey?: string
): Promise<void> {
  
  try {
    await hubspotClient.hubFetch(
      `/crm/v4/objects/${fromObjectType}/${fromObjectId}/associations/${toObjectType}/${toObjectId}`,
      {
        method: 'DELETE',
        idempotencyKey: idempotencyKey || hubspotClient.generateIdempotencyKey(),
      }
    );
  } catch (error) {
    console.error(`Failed to remove association ${fromObjectType}:${fromObjectId} -> ${toObjectType}:${toObjectId}:`, error);
    throw error;
  }
}

/**
 * Get all associations for an object
 */
export async function getAssociations(
  objectType: ObjectType,
  objectId: string,
  toObjectType: ObjectType
): Promise<any[]> {
  
  try {
    const response = await hubspotClient.hubFetch(
      `/crm/v4/objects/${objectType}/${objectId}/associations/${toObjectType}`,
      {
        method: 'GET',
      }
    );

    return response.results || [];
  } catch (error) {
    console.error(`Failed to get associations for ${objectType}:${objectId}:`, error);
    return [];
  }
}

/**
 * Batch create associations
 */
export async function batchCreateAssociations(
  associations: Array<{
    fromObjectType: ObjectType;
    fromObjectId: string;
    toObjectType: ObjectType;
    toObjectId: string;
    label?: string;
  }>,
  idempotencyKey?: string
): Promise<void> {
  
  // Process associations in batches to avoid rate limits
  const batchSize = 10;
  
  for (let i = 0; i < associations.length; i += batchSize) {
    const batch = associations.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(assoc =>
        createAssociation(
          assoc.fromObjectType,
          assoc.fromObjectId,
          assoc.toObjectType,
          assoc.toObjectId,
          assoc.label || 'WSA 2026',
          idempotencyKey
        )
      )
    );
    
    // Small delay between batches
    if (i + batchSize < associations.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}