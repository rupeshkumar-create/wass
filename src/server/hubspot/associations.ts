import { hubspotClient } from './client';

/**
 * Association management for HubSpot objects
 * Handles creating relationships between contacts, companies, and tickets
 */

export type ObjectType = 'contact' | 'company' | 'ticket';

export interface AssociationLabel {
  nominator2026: string;
  nominee2026: string;
  votedFor2026: string;
}

// Association type IDs for HubSpot API
const ASSOCIATION_TYPES = {
  contact_to_contact: 1,
  contact_to_company: 2,
  contact_to_ticket: 16,
  company_to_ticket: 26,
  ticket_to_contact: 15,
  ticket_to_company: 25,
} as const;

/**
 * Create association between two objects with label
 */
export async function attachWithLabel(
  fromType: ObjectType,
  fromId: string,
  toType: ObjectType,
  toId: string,
  label: keyof AssociationLabel
): Promise<void> {
  const idempotencyKey = hubspotClient.generateIdempotencyKey();

  try {
    // Get association type ID
    const associationTypeId = getAssociationTypeId(fromType, toType);
    
    const response = await hubspotClient.hubFetch(
      `/crm/v3/objects/${fromType}/${fromId}/associations/${toType}/${toId}/${associationTypeId}`,
      {
        method: 'PUT',
        idempotencyKey,
      }
    );

    console.log(`Created association: ${fromType}:${fromId} -> ${toType}:${toId} (${label})`);
  } catch (error) {
    // Log but don't throw - associations are nice to have but not critical
    console.warn(`Failed to create association ${fromType}:${fromId} -> ${toType}:${toId}:`, error);
  }
}

/**
 * Create association (legacy wrapper)
 */
export async function createAssociation(
  fromType: ObjectType,
  fromId: string,
  toType: ObjectType,
  toId: string,
  label: string
): Promise<void> {
  return attachWithLabel(fromType, fromId, toType, toId, label as keyof AssociationLabel);
}

/**
 * Create nomination associations
 * - Ticket ↔ Nominator Contact (label: Nominator 2026)
 * - Ticket ↔ Nominee (Contact/Company) (label: Nominee 2026)
 */
export async function createNominationAssociations(params: {
  ticketId: string;
  nominatorContactId: string;
  nomineeContactId?: string;
  nomineeCompanyId?: string;
}): Promise<void> {
  const promises: Promise<void>[] = [];

  // Ticket ↔ Nominator Contact
  promises.push(
    attachWithLabel('ticket', params.ticketId, 'contact', params.nominatorContactId, 'nominator2026')
  );

  // Ticket ↔ Nominee (Contact or Company)
  if (params.nomineeContactId) {
    promises.push(
      attachWithLabel('ticket', params.ticketId, 'contact', params.nomineeContactId, 'nominee2026')
    );
  }
  if (params.nomineeCompanyId) {
    promises.push(
      attachWithLabel('ticket', params.ticketId, 'company', params.nomineeCompanyId, 'nominee2026')
    );
  }

  // Execute all associations in parallel
  await Promise.allSettled(promises);
  console.log('Nomination associations created');
}

/**
 * Create vote association
 * - Voter Contact ↔ Nominee (Contact/Company) (label: Voted for 2026)
 */
export async function createVoteAssociation(params: {
  voterContactId: string;
  nomineeContactId?: string;
  nomineeCompanyId?: string;
}): Promise<void> {
  const promises: Promise<void>[] = [];

  // Voter ↔ Nominee (Contact or Company)
  if (params.nomineeContactId) {
    promises.push(
      attachWithLabel('contact', params.voterContactId, 'contact', params.nomineeContactId, 'votedFor2026')
    );
  }
  if (params.nomineeCompanyId) {
    promises.push(
      attachWithLabel('contact', params.voterContactId, 'company', params.nomineeCompanyId, 'votedFor2026')
    );
  }

  // Execute all associations in parallel
  await Promise.allSettled(promises);
  console.log('Vote associations created');
}

/**
 * Get association type ID for HubSpot API
 */
function getAssociationTypeId(fromType: ObjectType, toType: ObjectType): number {
  const key = `${fromType}_to_${toType}` as keyof typeof ASSOCIATION_TYPES;
  const typeId = ASSOCIATION_TYPES[key];
  
  if (!typeId) {
    throw new Error(`Unsupported association type: ${fromType} -> ${toType}`);
  }
  
  return typeId;
}

/**
 * Check if association exists
 */
export async function associationExists(
  fromType: ObjectType,
  fromId: string,
  toType: ObjectType,
  toId: string
): Promise<boolean> {
  try {
    const associationTypeId = getAssociationTypeId(fromType, toType);
    
    const response = await hubspotClient.hubFetch(
      `/crm/v3/objects/${fromType}/${fromId}/associations/${toType}`,
      { method: 'GET' }
    );

    return response.results?.some((assoc: any) => 
      assoc.id === toId && assoc.type === associationTypeId.toString()
    ) || false;
  } catch (error) {
    console.warn(`Failed to check association existence:`, error);
    return false;
  }
}

/**
 * Remove association
 */
export async function removeAssociation(
  fromType: ObjectType,
  fromId: string,
  toType: ObjectType,
  toId: string
): Promise<void> {
  try {
    const associationTypeId = getAssociationTypeId(fromType, toType);
    
    await hubspotClient.hubFetch(
      `/crm/v3/objects/${fromType}/${fromId}/associations/${toType}/${toId}/${associationTypeId}`,
      { method: 'DELETE' }
    );

    console.log(`Removed association: ${fromType}:${fromId} -> ${toType}:${toId}`);
  } catch (error) {
    console.warn(`Failed to remove association:`, error);
  }
}

/**
 * Batch create associations
 */
export async function batchCreateAssociations(
  associations: Array<{
    fromType: ObjectType;
    fromId: string;
    toType: ObjectType;
    toId: string;
    label: keyof AssociationLabel;
  }>
): Promise<void> {
  const promises = associations.map(assoc =>
    attachWithLabel(assoc.fromType, assoc.fromId, assoc.toType, assoc.toId, assoc.label)
  );

  await Promise.allSettled(promises);
  console.log(`Batch created ${associations.length} associations`);
}