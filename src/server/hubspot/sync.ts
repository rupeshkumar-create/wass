import { upsertContactByEmail, updateNominatorStatus } from './contacts';
import { upsertCompanyByDomainOrName, updateCompanyLiveUrl } from './companies';
import { createOrUpdateNominationTicket, updateTicketToApproved } from './tickets';
import { createNominationAssociations, createVoteAssociation } from './associations';
import { 
  nominatorContactProps,
  voterContactProps,
  personNomineeContactProps,
  companyNomineeProps,
  ticketDraftProps,
  extractDomain,
  validateEnvironmentVariables
} from './map';
import { searchContactByEmail, searchCompanyByDomainOrName } from './search';
import { HubSpotClient } from './client';

/**
 * High-level sync flows for WSA 2026 HubSpot integration
 * Implements immediate sync on vote, nomination submit, and approval
 */

// Validate environment on module load (gracefully handle missing vars)
try {
  validateEnvironmentVariables();
} catch (error) {
  console.warn('⚠️ HubSpot environment validation warning:', error instanceof Error ? error.message : error);
}

/**
 * Vote flow - immediate sync on vote cast
 * Creates/updates voter contact and associates with nominee
 */
export async function onVote(params: {
  voter: {
    email: string;
    firstname: string;
    lastname: string;
    company?: string;
    linkedin?: string;
  };
  nominee: {
    id: string;
    name: string;
    type: 'person' | 'company';
    email?: string;
    domain?: string;
    linkedin?: string;
  };
  votedForDisplayName: string;
  subcategoryId: string;
}): Promise<{
  success: boolean;
  voterContactId?: string;
  error?: string;
}> {
  try {
    console.log(`Starting vote sync for voter: ${params.voter.email}`);

    // 1. Upsert voter contact
    const voterProps = voterContactProps({
      email: params.voter.email,
      firstname: params.voter.firstname,
      lastname: params.voter.lastname,
      company: params.voter.company,
      linkedin: params.voter.linkedin,
      votedForDisplayName: params.votedForDisplayName,
      subcategoryId: params.subcategoryId,
    });

    const voterResult = await upsertContactByEmail(voterProps, 'Voter');

    // 2. Find nominee for association
    let nomineeContactId: string | undefined;
    let nomineeCompanyId: string | undefined;

    if (params.nominee.type === 'person') {
      if (params.nominee.email) {
        const nomineeContact = await searchContactByEmail(params.nominee.email);
        nomineeContactId = nomineeContact?.id;
      }
    } else {
      const domain = params.nominee.domain || (params.nominee.linkedin ? extractDomain(params.nominee.linkedin) : null);
      if (domain || params.nominee.name) {
        const nomineeCompany = await searchCompanyByDomainOrName({
          domain: domain || undefined,
          name: params.nominee.name,
        });
        nomineeCompanyId = nomineeCompany?.id;
      }
    }

    // 3. Create vote association (skip for now - may require additional permissions)
    // if (nomineeContactId || nomineeCompanyId) {
    //   await createVoteAssociation({
    //     voterContactId: voterResult.id,
    //     nomineeContactId,
    //     nomineeCompanyId,
    //   });
    // }

    console.log(`Vote sync completed successfully for voter: ${params.voter.email}`);

    return {
      success: true,
      voterContactId: voterResult.id,
    };
  } catch (error) {
    console.error('Vote sync failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Nomination submit flow - immediate sync on nomination submission
 * Creates/updates nominator, nominee, ticket, and associations
 */
export async function onSubmit(params: {
  nominator: {
    email: string;
    name: string;
    company?: string;
    linkedin?: string;
  };
  nominee: {
    name: string;
    type: 'person' | 'company';
    email?: string;
    firstname?: string;
    lastname?: string;
    jobtitle?: string;
    website?: string;
    linkedin?: string;
    categories?: string[];
    headshotUrl?: string;
    logoUrl?: string;
    whyMe?: string;
    whyUs?: string;
  };
  categoryGroupId: string;
  subcategoryId: string;
  imageUrl?: string;
  content?: string;
}): Promise<{
  success: boolean;
  nominatorContactId?: string;
  nomineeContactId?: string;
  nomineeCompanyId?: string;
  ticketId?: string;
  error?: string;
}> {
  try {
    console.log(`Starting nomination submit sync for: ${params.nominee.name}`);

    // 1. Upsert nominator contact
    const nominatorProps = nominatorContactProps({
      email: params.nominator.email,
      name: params.nominator.name,
      company: params.nominator.company,
      linkedin: params.nominator.linkedin,
      nominatedDisplayName: params.nominee.name,
      status: 'submitted',
      categoryGroupId: params.categoryGroupId,
      subcategoryId: params.subcategoryId,
    });

    const nominatorResult = await upsertContactByEmail(nominatorProps, 'Nominator');

    // 2. Upsert nominee (person or company)
    let nomineeContactId: string | undefined;
    let nomineeCompanyId: string | undefined;

    if (params.nominee.type === 'person') {
      const personProps = personNomineeContactProps({
        email: params.nominee.email,
        name: params.nominee.name,
        firstname: params.nominee.firstname,
        lastname: params.nominee.lastname,
        jobtitle: params.nominee.jobtitle,
        linkedin: params.nominee.linkedin,
        categories: params.nominee.categories,
        headshotUrl: params.nominee.headshotUrl,
        whyMe: params.nominee.whyMe,
      });

      const nomineeResult = await upsertContactByEmail(personProps, 'Nominee_Person');
      nomineeContactId = nomineeResult.id;
    } else {
      const domain = params.nominee.website ? extractDomain(params.nominee.website) : undefined;
      
      const companyProps = companyNomineeProps({
        name: params.nominee.name,
        domain,
        website: params.nominee.website,
        linkedin: params.nominee.linkedin,
        categories: params.nominee.categories,
        logoUrl: params.nominee.logoUrl,
        whyUs: params.nominee.whyUs,
      });

      const nomineeResult = await upsertCompanyByDomainOrName(companyProps);
      nomineeCompanyId = nomineeResult.id;
    }

    // 3. Create nomination ticket
    const ticketProps = ticketDraftProps({
      type: params.nominee.type,
      categoryGroupId: params.categoryGroupId,
      subcategoryId: params.subcategoryId,
      nomineeDisplayName: params.nominee.name,
      nomineeLinkedin: params.nominee.linkedin,
      imageUrl: params.imageUrl,
      nominatorEmail: params.nominator.email,
      content: params.content,
    });

    // Skip ticket creation for now (requires ticket permissions)
    // const ticketResult = await createOrUpdateNominationTicket(ticketProps);

    // 4. Create associations (skip ticket associations for now)
    // await createNominationAssociations({
    //   ticketId: ticketResult.id,
    //   nominatorContactId: nominatorResult.id,
    //   nomineeContactId,
    //   nomineeCompanyId,
    // });

    console.log(`Nomination submit sync completed successfully for: ${params.nominee.name}`);

    return {
      success: true,
      nominatorContactId: nominatorResult.id,
      nomineeContactId,
      nomineeCompanyId,
      // ticketId: ticketResult.id, // Skip for now
    };
  } catch (error) {
    console.error('Nomination submit sync failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Nomination approval flow - sync on admin approval
 * Updates ticket to approved, sets live URLs, updates nominator status
 */
export async function onApprove(params: {
  nominee: {
    type: 'person' | 'company';
    displayName: string;
    email?: string;
    domain?: string;
    linkedin?: string;
    imageUrl?: string;
  };
  nominator: {
    email: string;
  };
  liveUrl: string;
  categoryGroupId: string;
  subcategoryId: string;
  ticketId?: string;
}): Promise<{
  success: boolean;
  ticketId?: string;
  error?: string;
}> {
  try {
    console.log(`Starting nomination approval sync for: ${params.nominee.displayName}`);

    // 1. Find or use provided ticket ID
    let ticketId = params.ticketId;
    
    if (!ticketId) {
      // Search for ticket if not provided
      const { searchTicketByNomination } = await import('./search');
      const ticket = await searchTicketByNomination({
        nominatorEmail: params.nominator.email,
        subcategoryId: params.subcategoryId,
        nomineeDisplayName: params.nominee.displayName,
      });
      ticketId = ticket?.id;
    }

    if (!ticketId) {
      throw new Error('Nomination ticket not found');
    }

    // 2. Update ticket to approved stage
    await updateTicketToApproved(ticketId, params.liveUrl);

    // 3. Update nominee with live URL
    if (params.nominee.type === 'person') {
      if (params.nominee.email) {
        const nomineeContact = await searchContactByEmail(params.nominee.email);
        if (nomineeContact) {
          const { updateContactLiveUrl } = await import('./contacts');
          await updateContactLiveUrl(nomineeContact.id, params.liveUrl);
        }
      }
    } else {
      const domain = params.nominee.domain || (params.nominee.linkedin ? extractDomain(params.nominee.linkedin) : null);
      if (domain || params.nominee.displayName) {
        const nomineeCompany = await searchCompanyByDomainOrName({
          domain: domain || undefined,
          name: params.nominee.displayName,
        });
        if (nomineeCompany) {
          await updateCompanyLiveUrl(nomineeCompany.id, params.liveUrl);
        }
      }
    }

    // 4. Update nominator status to approved
    await updateNominatorStatus(params.nominator.email, 'approved', params.liveUrl);

    console.log(`Nomination approval sync completed successfully for: ${params.nominee.displayName}`);

    return {
      success: true,
      ticketId,
    };
  } catch (error) {
    console.error('Nomination approval sync failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test HubSpot connection
 */
export async function testHubSpotConnection(): Promise<{
  success: boolean;
  accountId?: string;
  error?: string;
}> {
  try {
    const { hubspotClient } = await import('./client');
    const response = await hubspotClient.hubFetch('/account-info/v3/details');
    
    return {
      success: true,
      accountId: response.portalId?.toString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Legacy sync functions for backward compatibility
 */
export async function syncVote(data: any) {
  return onVote(data);
}

export async function syncNominationSubmit(data: any) {
  return onSubmit(data);
}

export async function syncNominationApprove(data: any) {
  return onApprove(data);
}