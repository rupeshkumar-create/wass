import { hubspotClient } from './client';
import { searchTicketByNomination } from './search';

/**
 * Ticket management for nomination workflow
 * Handles creation and stage updates for nomination pipeline
 */

export interface TicketResult {
  id: string;
  created: boolean;
  properties: Record<string, any>;
}

/**
 * Create or update nomination ticket
 * Searches for existing ticket by unique nomination properties
 */
export async function createOrUpdateNominationTicket(
  properties: Record<string, any>
): Promise<TicketResult> {
  const nominatorEmail = properties.wsa_nominator_email;
  const subcategoryId = properties.wsa_subcategory_id;
  const nomineeDisplayName = properties.wsa_nominee_display_name;

  if (!nominatorEmail || !subcategoryId || !nomineeDisplayName) {
    throw new Error('Required ticket properties missing: nominator email, subcategory ID, and nominee display name');
  }

  // Validate required pipeline configuration
  if (!process.env.HUBSPOT_PIPELINE_ID) {
    throw new Error('HUBSPOT_PIPELINE_ID environment variable is required');
  }
  if (!process.env.HUBSPOT_STAGE_SUBMITTED) {
    throw new Error('HUBSPOT_STAGE_SUBMITTED environment variable is required');
  }

  const idempotencyKey = hubspotClient.generateIdempotencyKey();

  try {
    // Search for existing ticket
    const existingTicket = await searchTicketByNomination({
      nominatorEmail,
      subcategoryId,
      nomineeDisplayName,
    });

    if (existingTicket) {
      // Update existing ticket
      console.log(`Updating existing nomination ticket: ${nomineeDisplayName}`);
      
      // Prepare update properties (only non-empty values)
      const updateProps = { ...properties };
      
      // Remove empty/undefined values
      Object.keys(updateProps).forEach(key => {
        if (updateProps[key] === undefined || updateProps[key] === null || updateProps[key] === '') {
          delete updateProps[key];
        }
      });

      const response = await hubspotClient.hubFetch(`/crm/v3/objects/tickets/${existingTicket.id}`, {
        method: 'PATCH',
        body: { properties: updateProps },
        idempotencyKey,
      });

      return {
        id: existingTicket.id,
        created: false,
        properties: response.properties,
      };
    } else {
      // Create new ticket
      console.log(`Creating new nomination ticket: ${nomineeDisplayName}`);
      
      // Ensure pipeline properties are set
      const ticketProperties = {
        ...properties,
        hs_pipeline: process.env.HUBSPOT_PIPELINE_ID,
        hs_pipeline_stage: process.env.HUBSPOT_STAGE_SUBMITTED,
        wsa_year: 2026,
      };

      const response = await hubspotClient.hubFetch('/crm/v3/objects/tickets', {
        method: 'POST',
        body: { properties: ticketProperties },
        idempotencyKey,
      });

      return {
        id: response.id,
        created: true,
        properties: response.properties,
      };
    }
  } catch (error) {
    console.error(`Failed to create/update nomination ticket for ${nomineeDisplayName}:`, error);
    throw error;
  }
}

/**
 * Update ticket stage to approved
 */
export async function updateTicketToApproved(
  ticketId: string,
  liveUrl: string
): Promise<void> {
  
  if (!process.env.HUBSPOT_STAGE_APPROVED) {
    throw new Error('HUBSPOT_STAGE_APPROVED environment variable is required');
  }

  const idempotencyKey = hubspotClient.generateIdempotencyKey();

  try {
    await hubspotClient.hubFetch(`/crm/v3/objects/tickets/${ticketId}`, {
      method: 'PATCH',
      body: {
        properties: {
          hs_pipeline_stage: process.env.HUBSPOT_STAGE_APPROVED,
          wsa_live_url: liveUrl,
          wsa_approval_timestamp: new Date().toISOString(),
        },
      },
      idempotencyKey,
    });

    console.log(`Updated ticket ${ticketId} to approved stage`);
  } catch (error) {
    console.error(`Failed to update ticket ${ticketId} to approved:`, error);
    throw error;
  }
}

/**
 * Update ticket stage to rejected
 */
export async function updateTicketToRejected(ticketId: string): Promise<void> {
  
  if (!process.env.HUBSPOT_STAGE_REJECTED) {
    throw new Error('HUBSPOT_STAGE_REJECTED environment variable is required');
  }

  const idempotencyKey = hubspotClient.generateIdempotencyKey();

  try {
    await hubspotClient.hubFetch(`/crm/v3/objects/tickets/${ticketId}`, {
      method: 'PATCH',
      body: {
        properties: {
          hs_pipeline_stage: process.env.HUBSPOT_STAGE_REJECTED,
        },
      },
      idempotencyKey,
    });

    console.log(`Updated ticket ${ticketId} to rejected stage`);
  } catch (error) {
    console.error(`Failed to update ticket ${ticketId} to rejected:`, error);
    throw error;
  }
}

/**
 * Create ticket (legacy wrapper)
 */
export async function createTicket(properties: Record<string, any>): Promise<TicketResult> {
  return createOrUpdateNominationTicket(properties);
}

/**
 * Update ticket stage (legacy wrapper)
 */
export async function updateTicketStage(
  ticketId: string,
  stage: 'submitted' | 'approved' | 'rejected',
  liveUrl?: string
): Promise<void> {
  switch (stage) {
    case 'approved':
      if (!liveUrl) throw new Error('Live URL is required for approved stage');
      return updateTicketToApproved(ticketId, liveUrl);
    case 'rejected':
      return updateTicketToRejected(ticketId);
    default:
      throw new Error(`Unsupported ticket stage: ${stage}`);
  }
}

/**
 * Get ticket by ID
 */
export async function getTicketById(ticketId: string): Promise<any> {
  try {
    const response = await hubspotClient.hubFetch(`/crm/v3/objects/tickets/${ticketId}`, {
      method: 'GET',
    });

    return response;
  } catch (error) {
    console.error(`Failed to get ticket ${ticketId}:`, error);
    throw error;
  }
}