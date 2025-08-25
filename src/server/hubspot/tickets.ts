import { hubspotClient } from './client';
import { searchTicketByNominee } from './search';

/**
 * Ticket management utilities for nomination tracking
 */

export interface TicketProperties {
  subject: string;
  content?: string;
  hs_pipeline: string;
  hs_pipeline_stage: string;
  wsa_year?: number;
  wsa_type?: 'person' | 'company';
  wsa_category_group?: string;
  wsa_subcategory_id?: string;
  wsa_nominee_display_name?: string;
  wsa_nominee_linkedin_url?: string;
  wsa_image_url?: string;
  wsa_nominator_email?: string;
  wsa_live_url?: string;
  wsa_approval_timestamp?: string;
  [key: string]: any;
}

/**
 * Create nomination ticket
 */
export async function createNominationTicket(
  properties: TicketProperties,
  idempotencyKey?: string
): Promise<{ id: string }> {
  
  // Validate required pipeline configuration
  if (!process.env.HUBSPOT_PIPELINE_ID) {
    throw new Error('HUBSPOT_PIPELINE_ID environment variable is required');
  }
  if (!process.env.HUBSPOT_STAGE_SUBMITTED) {
    throw new Error('HUBSPOT_STAGE_SUBMITTED environment variable is required');
  }

  const ticketProperties = {
    ...properties,
    hs_pipeline: process.env.HUBSPOT_PIPELINE_ID,
    hs_pipeline_stage: process.env.HUBSPOT_STAGE_SUBMITTED,
    wsa_year: 2026,
  };

  const response = await hubspotClient.hubFetch('/crm/v3/objects/tickets', {
    method: 'POST',
    body: { properties: ticketProperties },
    idempotencyKey: idempotencyKey || hubspotClient.generateIdempotencyKey(),
  });

  return { id: response.id };
}

/**
 * Update ticket to approved status
 */
export async function approveNominationTicket(
  ticketId: string,
  liveUrl: string,
  idempotencyKey?: string
): Promise<void> {
  
  if (!process.env.HUBSPOT_STAGE_APPROVED) {
    throw new Error('HUBSPOT_STAGE_APPROVED environment variable is required');
  }

  await hubspotClient.hubFetch(`/crm/v3/objects/tickets/${ticketId}`, {
    method: 'PATCH',
    body: {
      properties: {
        hs_pipeline_stage: process.env.HUBSPOT_STAGE_APPROVED,
        wsa_live_url: liveUrl,
        wsa_approval_timestamp: new Date().toISOString(),
      },
    },
    idempotencyKey: idempotencyKey || hubspotClient.generateIdempotencyKey(),
  });
}

/**
 * Update ticket to rejected status
 */
export async function rejectNominationTicket(
  ticketId: string,
  idempotencyKey?: string
): Promise<void> {
  
  if (!process.env.HUBSPOT_STAGE_REJECTED) {
    throw new Error('HUBSPOT_STAGE_REJECTED environment variable is required');
  }

  await hubspotClient.hubFetch(`/crm/v3/objects/tickets/${ticketId}`, {
    method: 'PATCH',
    body: {
      properties: {
        hs_pipeline_stage: process.env.HUBSPOT_STAGE_REJECTED,
      },
    },
    idempotencyKey: idempotencyKey || hubspotClient.generateIdempotencyKey(),
  });
}

/**
 * Find or create nomination ticket
 */
export async function upsertNominationTicket(
  nomineeDisplayName: string,
  subcategoryId: string,
  properties: TicketProperties,
  idempotencyKey?: string
): Promise<{ id: string; isNew: boolean }> {
  
  // Search for existing ticket
  const existingTicket = await searchTicketByNominee(nomineeDisplayName, subcategoryId);
  
  if (existingTicket) {
    // Update existing ticket
    await hubspotClient.hubFetch(`/crm/v3/objects/tickets/${existingTicket.id}`, {
      method: 'PATCH',
      body: { properties },
      idempotencyKey: idempotencyKey || hubspotClient.generateIdempotencyKey(),
    });

    return { id: existingTicket.id, isNew: false };
  } else {
    // Create new ticket
    const result = await createNominationTicket(properties, idempotencyKey);
    return { id: result.id, isNew: true };
  }
}

/**
 * Get ticket by ID
 */
export async function getTicketById(ticketId: string): Promise<any> {
  try {
    return await hubspotClient.hubFetch(`/crm/v3/objects/tickets/${ticketId}`, {
      method: 'GET',
    });
  } catch (error) {
    console.error('Failed to get ticket by ID:', error);
    return null;
  }
}

/**
 * Build ticket subject
 */
export function buildTicketSubject(subcategoryId: string, nomineeDisplayName: string): string {
  return `WSA 2026 – ${subcategoryId} – ${nomineeDisplayName}`;
}

/**
 * Build ticket content/description
 */
export function buildTicketContent(nomination: {
  type: 'person' | 'company';
  nominee: any;
  nominator: any;
  whyNominated: string;
  category: string;
}): string {
  const { type, nominee, nominator, whyNominated, category } = nomination;
  
  return `
**Nomination Details**

**Category:** ${category}
**Type:** ${type === 'person' ? 'Person' : 'Company'}
**Nominee:** ${nominee.name}
**LinkedIn:** ${nominee.linkedin}

**Nominated by:** ${nominator.name} (${nominator.email})
**Company:** ${nominator.company}

**Why nominated:**
${whyNominated}

${nominee.whyVoteForMe ? `**Why vote for them:**\n${nominee.whyVoteForMe}` : ''}

---
*This ticket was automatically created by the WSA 2026 nomination system.*
  `.trim();
}