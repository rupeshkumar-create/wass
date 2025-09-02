/**
 * Comprehensive HubSpot Sync
 * Handles syncing of all nominators, nominees, and voters with complete details
 */

import { hubspotClient } from './client';
import { 
  createOrUpdateContact, 
  createOrUpdateCompany,
  searchContactByEmail,
  searchCompanyByDomain 
} from './contacts';
import { createTicket, updateTicketStage } from './tickets';
import { createAssociation } from './associations';
import { 
  nominatorContactProps,
  voterContactProps,
  personNomineeContactProps,
  companyNomineeProps,
  ticketPropsDraft,
  ticketPropsApproved,
  extractDomain
} from './map';
import { Nomination, Vote, Voter, Nominator } from '@/lib/data-types';

/**
 * Comprehensive sync for nomination submission
 * Creates/updates: Nominator, Nominee (person/company), Ticket, Associations
 */
export async function syncNominationComplete(nomination: Nomination): Promise<{
  success: boolean;
  nominatorContactId?: string;
  nomineeContactId?: string;
  nomineeCompanyId?: string;
  ticketId?: string;
  error?: string;
}> {
  try {
    console.log(`Starting comprehensive nomination sync for: ${nomination.nominee.name}`);

    // 1. Sync Nominator Contact
    console.log('1️⃣ Syncing nominator contact...');
    const nominatorResult = await syncNominatorContact(nomination.nominator, {
      nominatedDisplayName: nomination.nominee.name,
      status: nomination.status,
      category: nomination.category
    });

    if (!nominatorResult.success) {
      throw new Error(`Failed to sync nominator: ${nominatorResult.error}`);
    }

    // 2. Sync Nominee (Person or Company)
    console.log('2️⃣ Syncing nominee...');
    let nomineeResult;
    
    if (nomination.type === 'person') {
      nomineeResult = await syncPersonNominee(nomination);
    } else {
      nomineeResult = await syncCompanyNominee(nomination);
    }

    if (!nomineeResult.success) {
      throw new Error(`Failed to sync nominee: ${nomineeResult.error}`);
    }

    // 3. Create Nomination Ticket
    console.log('3️⃣ Creating nomination ticket...');
    const ticketResult = await createNominationTicket(nomination);

    if (!ticketResult.success) {
      throw new Error(`Failed to create ticket: ${ticketResult.error}`);
    }

    // 4. Create Associations
    console.log('4️⃣ Creating associations...');
    await createNominationAssociations({
      nominatorContactId: nominatorResult.contactId!,
      nomineeContactId: nomineeResult.contactId,
      nomineeCompanyId: nomineeResult.companyId,
      ticketId: ticketResult.ticketId!,
      nomination
    });

    console.log('✅ Comprehensive nomination sync completed successfully');

    return {
      success: true,
      nominatorContactId: nominatorResult.contactId,
      nomineeContactId: nomineeResult.contactId,
      nomineeCompanyId: nomineeResult.companyId,
      ticketId: ticketResult.ticketId
    };

  } catch (error) {
    console.error('❌ Comprehensive nomination sync failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Comprehensive sync for vote
 * Creates/updates: Voter contact, Associates with nominee
 */
export async function syncVoteComplete(vote: Vote, nomination: Nomination): Promise<{
  success: boolean;
  voterContactId?: string;
  error?: string;
}> {
  try {
    console.log(`Starting comprehensive vote sync for voter: ${vote.voter.email}`);

    // 1. Sync Voter Contact
    console.log('1️⃣ Syncing voter contact...');
    const voterResult = await syncVoterContact(vote.voter, {
      votedForDisplayName: nomination.nominee.name,
      subcategoryId: nomination.category,
      voteTimestamp: vote.createdAt
    });

    if (!voterResult.success) {
      throw new Error(`Failed to sync voter: ${voterResult.error}`);
    }

    // 2. Find nominee contact/company for association
    console.log('2️⃣ Finding nominee for association...');
    let nomineeContactId: string | undefined;
    let nomineeCompanyId: string | undefined;

    if (nomination.type === 'person') {
      // Search for person nominee by LinkedIn or email
      const personEmail = (nomination.nominee as any).email || 
        `${(nomination.nominee as any).firstName?.toLowerCase()}.${(nomination.nominee as any).lastName?.toLowerCase()}@nominee.wsa-2026.com`;
      
      const searchResult = await searchContactByEmail(personEmail);
      if (searchResult.length > 0) {
        nomineeContactId = searchResult[0].id;
      }
    } else {
      // Search for company nominee
      const domain = extractDomain((nomination.nominee as any).website);
      if (domain) {
        const searchResult = await searchCompanyByDomain(domain);
        if (searchResult.length > 0) {
          nomineeCompanyId = searchResult[0].id;
        }
      }
    }

    // 3. Create associations
    console.log('3️⃣ Creating voter associations...');
    if (nomineeContactId) {
      await createAssociation('contact', voterResult.contactId!, 'contact', nomineeContactId, 'voter_to_nominee');
    }
    if (nomineeCompanyId) {
      await createAssociation('contact', voterResult.contactId!, 'company', nomineeCompanyId, 'voter_to_nominee');
    }

    console.log('✅ Comprehensive vote sync completed successfully');

    return {
      success: true,
      voterContactId: voterResult.contactId
    };

  } catch (error) {
    console.error('❌ Comprehensive vote sync failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Sync nominator contact with complete details
 */
async function syncNominatorContact(nominator: Nominator, extras: {
  nominatedDisplayName: string;
  status: string;
  category: string;
}): Promise<{ success: boolean; contactId?: string; error?: string }> {
  try {
    const contactProps = nominatorContactProps({
      email: nominator.email,
      name: nominator.name,
      company: nominator.company,
      linkedin: nominator.linkedin,
      nominatedDisplayName: extras.nominatedDisplayName,
      status: extras.status as any
    });

    // Add category information
    const enhancedProps = {
      ...contactProps,
      wsa_nomination_category: extras.category,
      wsa_nomination_timestamp: new Date().toISOString()
    };

    const result = await createOrUpdateContact(enhancedProps);
    
    return {
      success: true,
      contactId: result.id
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Sync voter contact with complete details
 */
async function syncVoterContact(voter: Voter, extras: {
  votedForDisplayName: string;
  subcategoryId: string;
  voteTimestamp: string;
}): Promise<{ success: boolean; contactId?: string; error?: string }> {
  try {
    const contactProps = voterContactProps({
      email: voter.email,
      firstName: voter.firstName,
      lastName: voter.lastName,
      company: voter.company,
      linkedin: voter.linkedin,
      votedForDisplayName: extras.votedForDisplayName,
      subcategoryId: extras.subcategoryId
    });

    // Add enhanced voting details
    const enhancedProps = {
      ...contactProps,
      wsa_vote_timestamp: extras.voteTimestamp,
      wsa_voting_engagement: 'Active Voter'
    };

    const result = await createOrUpdateContact(enhancedProps);
    
    return {
      success: true,
      contactId: result.id
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Sync person nominee with complete details
 */
async function syncPersonNominee(nomination: Nomination): Promise<{
  success: boolean;
  contactId?: string;
  error?: string;
}> {
  try {
    const nominee = nomination.nominee as any;
    
    const contactProps = personNomineeContactProps({
      email: nominee.email || `${nominee.firstName?.toLowerCase()}.${nominee.lastName?.toLowerCase()}@nominee.wsa-2026.com`,
      name: nominee.name,
      firstName: nominee.firstName || nominee.name.split(' ')[0],
      lastName: nominee.lastName || nominee.name.split(' ').slice(1).join(' '),
      title: nominee.title,
      linkedin: nominee.linkedin,
      status: nomination.status,
      liveUrl: nomination.liveUrl
    });

    // Add comprehensive nominee details
    const enhancedProps = {
      ...contactProps,
      wsa_nomination_category: nomination.category,
      wsa_nominee_country: nominee.country,
      wsa_why_vote_for_me: nomination.whyVoteForMe,
      wsa_why_nominated: (nomination as any).whyNominated,
      wsa_company_name: (nomination as any).company?.name,
      wsa_company_website: (nomination as any).company?.website,
      wsa_nominator_name: nomination.nominator.name,
      wsa_nominator_email: nomination.nominator.email
    };

    const result = await createOrUpdateContact(enhancedProps);
    
    return {
      success: true,
      contactId: result.id
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Sync company nominee with complete details
 */
async function syncCompanyNominee(nomination: Nomination): Promise<{
  success: boolean;
  contactId?: string;
  companyId?: string;
  error?: string;
}> {
  try {
    const nominee = nomination.nominee as any;
    
    const companyProps = companyNomineeProps({
      name: nominee.name,
      website: nominee.website,
      linkedin: nominee.linkedin,
      status: nomination.status,
      liveUrl: nomination.liveUrl
    });

    // Add comprehensive company details
    const enhancedProps = {
      ...companyProps,
      wsa_nomination_category: nomination.category,
      wsa_nominee_country: nominee.country,
      wsa_why_vote_for_me: nomination.whyVoteForMe,
      wsa_why_nominated: (nomination as any).whyNominated,
      wsa_nominator_name: nomination.nominator.name,
      wsa_nominator_email: nomination.nominator.email
    };

    const result = await createOrUpdateCompany(enhancedProps);
    
    return {
      success: true,
      companyId: result.id
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Create nomination ticket with complete details
 */
async function createNominationTicket(nomination: Nomination): Promise<{
  success: boolean;
  ticketId?: string;
  error?: string;
}> {
  try {
    const ticketProps = ticketPropsDraft({
      type: nomination.type,
      categoryGroupId: nomination.category.split('-')[0],
      subcategoryId: nomination.category,
      nomineeDisplayName: nomination.nominee.name,
      nomineeLinkedin: nomination.nominee.linkedin,
      imageUrl: nomination.imageUrl || undefined,
      nominatorEmail: nomination.nominator.email,
      content: buildTicketContent(nomination)
    });

    // Add comprehensive ticket details
    const enhancedProps = {
      ...ticketProps,
      wsa_nominee_country: (nomination.nominee as any).country,
      wsa_company_name: (nomination as any).company?.name || nomination.nominee.name,
      wsa_company_website: (nomination as any).company?.website || (nomination.nominee as any).website,
      wsa_nominator_name: nomination.nominator.name,
      wsa_nominator_company: nomination.nominator.company,
      wsa_nominator_linkedin: nomination.nominator.linkedin,
      wsa_nomination_id: nomination.id,
      wsa_unique_key: nomination.uniqueKey
    };

    const result = await createTicket(enhancedProps);
    
    return {
      success: true,
      ticketId: result.id
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Create all necessary associations
 */
async function createNominationAssociations(params: {
  nominatorContactId: string;
  nomineeContactId?: string;
  nomineeCompanyId?: string;
  ticketId: string;
  nomination: Nomination;
}): Promise<void> {
  try {
    // Nominator to Ticket
    await createAssociation('contact', params.nominatorContactId, 'ticket', params.ticketId, 'nominator_to_ticket');

    // Nominee to Ticket
    if (params.nomineeContactId) {
      await createAssociation('contact', params.nomineeContactId, 'ticket', params.ticketId, 'nominee_to_ticket');
    }
    if (params.nomineeCompanyId) {
      await createAssociation('company', params.nomineeCompanyId, 'ticket', params.ticketId, 'nominee_to_ticket');
    }

    // Nominator to Nominee
    if (params.nomineeContactId) {
      await createAssociation('contact', params.nominatorContactId, 'contact', params.nomineeContactId, 'nominator_to_nominee');
    }
    if (params.nomineeCompanyId) {
      await createAssociation('contact', params.nominatorContactId, 'company', params.nomineeCompanyId, 'nominator_to_nominee');
    }

    console.log('✅ All associations created successfully');
  } catch (error) {
    console.error('⚠️ Some associations may have failed:', error);
    // Don't throw - associations are nice to have but not critical
  }
}

/**
 * Build comprehensive ticket content
 */
function buildTicketContent(nomination: Nomination): string {
  const sections = [
    '# WSA 2026 Nomination Details',
    '',
    `**Category:** ${nomination.category}`,
    `**Type:** ${nomination.type === 'person' ? 'Individual' : 'Company'}`,
    `**Status:** ${nomination.status}`,
    '',
    '## Nominee Information',
    `**Name:** ${nomination.nominee.name}`,
    `**LinkedIn:** ${nomination.nominee.linkedin}`,
    `**Country:** ${(nomination.nominee as any).country}`,
  ];

  if (nomination.type === 'person') {
    const person = nomination.nominee as any;
    sections.push(`**Title:** ${person.title || 'Not specified'}`);
    sections.push(`**Company:** ${(nomination as any).company?.name}`);
    sections.push(`**Company Website:** ${(nomination as any).company?.website}`);
  } else {
    const company = nomination.nominee as any;
    sections.push(`**Website:** ${company.website}`);
  }

  sections.push(
    '',
    '## Nominator Information',
    `**Name:** ${nomination.nominator.name}`,
    `**Email:** ${nomination.nominator.email}`,
    `**Company:** ${nomination.nominator.company}`,
    `**LinkedIn:** ${nomination.nominator.linkedin}`,
    '',
    '## Nomination Details',
    `**Why Nominated:**`,
    (nomination as any).whyNominated || 'Not provided',
    ''
  );

  if (nomination.whyVoteForMe) {
    sections.push(
      '**Why Vote for Them:**',
      nomination.whyVoteForMe,
      ''
    );
  }

  sections.push(
    '## Technical Details',
    `**Nomination ID:** ${nomination.id}`,
    `**Unique Key:** ${nomination.uniqueKey}`,
    `**Live URL:** ${nomination.liveUrl}`,
    `**Created:** ${nomination.createdAt}`,
    '',
    '---',
    '*This ticket was automatically created by the WSA 2026 nomination system.*'
  );

  return sections.join('\n');
}

/**
 * Batch sync all existing nominations
 */
export async function batchSyncAllNominations(nominations: Nomination[]): Promise<{
  successful: number;
  failed: number;
  total: number;
  errors: string[];
}> {
  console.log(`Starting batch sync for ${nominations.length} nominations...`);
  
  const results = await Promise.allSettled(
    nominations.map(nomination => syncNominationComplete(nomination))
  );

  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;
  const errors = results
    .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
    .map(r => r.status === 'rejected' ? r.reason.message : (r.value as any).error);

  console.log(`Batch sync completed: ${successful} successful, ${failed} failed`);
  
  return { successful, failed, total: nominations.length, errors };
}