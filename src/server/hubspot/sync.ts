import { 
  upsertNominatorContact, 
  upsertVoterContact, 
  upsertPersonNomineeContact,
  updateContactLiveUrl,
  updateNominatorStatus 
} from './contacts';
import { 
  upsertCompanyNominee, 
  updateCompanyLiveUrl,
  searchCompanyByLinkedIn 
} from './companies';
import { 
  createNominationTicket, 
  approveNominationTicket,
  rejectNominationTicket,
  buildTicketContent 
} from './tickets';
import { 
  associateTicketWithNominator, 
  associateTicketWithNominee,
  associateVoterWithNominee 
} from './associations';
import { searchContactByEmail } from './search';
import { validateEnvironmentVariables } from './map';
import { HubSpotClient } from './client';

/**
 * Main sync orchestration functions
 */

/**
 * Sync voter immediately after vote
 */
export async function syncVote(voteData: {
  voter: {
    email: string;
    firstName: string;
    lastName: string;
    company: string;
    linkedin: string;
  };
  nominee: {
    id: string;
    name: string;
    type: 'person' | 'company';
    linkedin: string;
    email?: string;
  };
  category: string;
  subcategoryId: string;
}): Promise<{ success: boolean; voterContactId?: string; error?: string }> {
  
  if (!HubSpotClient.isEnabled()) {
    console.log('HubSpot sync is disabled, skipping vote sync');
    return { success: true };
  }

  try {
    validateEnvironmentVariables();

    const { voter, nominee, subcategoryId } = voteData;

    // 1. Upsert voter contact
    const voterResult = await upsertVoterContact({
      email: voter.email,
      firstName: voter.firstName,
      lastName: voter.lastName,
      company: voter.company,
      linkedin: voter.linkedin,
      votedForDisplayName: nominee.name,
      subcategoryId,
    });

    console.log(`Voter contact ${voterResult.isNew ? 'created' : 'updated'}: ${voterResult.id}`);

    // 2. Find nominee in HubSpot
    let nomineeHubSpotId: string | null = null;
    let nomineeObjectType: 'contact' | 'company' = 'contact';

    if (nominee.type === 'person') {
      // Search for person nominee by email or LinkedIn
      if (nominee.email) {
        const contact = await searchContactByEmail(nominee.email);
        if (contact) {
          nomineeHubSpotId = contact.id;
          nomineeObjectType = 'contact';
        }
      }
    } else {
      // Search for company nominee by LinkedIn
      const company = await searchCompanyByLinkedIn(nominee.linkedin);
      if (company) {
        nomineeHubSpotId = company.id;
        nomineeObjectType = 'company';
      }
    }

    // 3. Create association if nominee found
    if (nomineeHubSpotId) {
      await associateVoterWithNominee(
        voterResult.id,
        nomineeHubSpotId,
        nomineeObjectType
      );
      console.log(`Associated voter ${voterResult.id} with nominee ${nomineeHubSpotId} (${nomineeObjectType})`);
    } else {
      console.warn(`Nominee not found in HubSpot for association: ${nominee.name}`);
    }

    return { success: true, voterContactId: voterResult.id };

  } catch (error) {
    console.error('Failed to sync vote:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Sync nomination on submit
 */
export async function syncNominationSubmit(nominationData: {
  nominator: {
    email: string;
    name: string;
    company: string;
    linkedin: string;
  };
  nominee: {
    name: string;
    type: 'person' | 'company';
    linkedin: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    title?: string;
    website?: string;
    whyVoteForMe?: string;
  };
  category: string;
  categoryGroupId: string;
  subcategoryId: string;
  whyNominated: string;
  imageUrl?: string;
}): Promise<{ 
  success: boolean; 
  nominatorContactId?: string;
  nomineeId?: string;
  ticketId?: string;
  error?: string;
}> {
  
  if (!HubSpotClient.isEnabled()) {
    console.log('HubSpot sync is disabled, skipping nomination submit sync');
    return { success: true };
  }

  try {
    validateEnvironmentVariables();

    const { nominator, nominee, categoryGroupId, subcategoryId, whyNominated, imageUrl } = nominationData;

    // 1. Upsert nominator contact
    const nominatorResult = await upsertNominatorContact({
      email: nominator.email,
      name: nominator.name,
      company: nominator.company,
      linkedin: nominator.linkedin,
      nominatedDisplayName: nominee.name,
      status: 'submitted',
    });

    console.log(`Nominator contact ${nominatorResult.isNew ? 'created' : 'updated'}: ${nominatorResult.id}`);

    // 2. Upsert nominee (contact or company)
    let nomineeResult: { id: string; isNew: boolean };
    let nomineeObjectType: 'contact' | 'company';

    if (nominee.type === 'person') {
      // Create person nominee as contact
      nomineeResult = await upsertPersonNomineeContact({
        email: nominee.email,
        name: nominee.name,
        firstName: nominee.firstName || nominee.name.split(' ')[0],
        lastName: nominee.lastName || nominee.name.split(' ').slice(1).join(' '),
        title: nominee.title,
        linkedin: nominee.linkedin,
        status: 'submitted',
      });
      nomineeObjectType = 'contact';
    } else {
      // Create company nominee
      nomineeResult = await upsertCompanyNominee({
        name: nominee.name,
        website: nominee.website,
        linkedin: nominee.linkedin,
        status: 'submitted',
      });
      nomineeObjectType = 'company';
    }

    console.log(`Nominee ${nomineeObjectType} ${nomineeResult.isNew ? 'created' : 'updated'}: ${nomineeResult.id}`);

    // 3. Create nomination ticket
    const ticketContent = buildTicketContent({
      type: nominee.type,
      nominee,
      nominator,
      whyNominated,
      category: subcategoryId,
      whyVoteForMe: nominee.whyVoteForMe,
    });

    const ticketResult = await createNominationTicket({
      subject: `WSA 2026 – ${subcategoryId} – ${nominee.name}`,
      content: ticketContent,
      hs_pipeline: process.env.HUBSPOT_PIPELINE_ID!,
      hs_pipeline_stage: process.env.HUBSPOT_STAGE_SUBMITTED!,
      wsa_year: 2026,
      wsa_type: nominee.type,
      wsa_category_group: categoryGroupId,
      wsa_subcategory_id: subcategoryId,
      wsa_nominee_display_name: nominee.name,
      wsa_nominee_linkedin_url: nominee.linkedin,
      wsa_image_url: imageUrl,
      wsa_nominator_email: nominator.email,
    });

    console.log(`Nomination ticket created: ${ticketResult.id}`);

    // 4. Create associations
    await Promise.all([
      associateTicketWithNominator(ticketResult.id, nominatorResult.id),
      associateTicketWithNominee(ticketResult.id, nomineeResult.id, nomineeObjectType),
    ]);

    console.log('Associations created successfully');

    return {
      success: true,
      nominatorContactId: nominatorResult.id,
      nomineeId: nomineeResult.id,
      ticketId: ticketResult.id,
    };

  } catch (error) {
    console.error('Failed to sync nomination submit:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Sync nomination approval
 */
export async function syncNominationApprove(approvalData: {
  nominee: {
    id: string;
    name: string;
    type: 'person' | 'company';
    email?: string;
    linkedin: string;
  };
  nominator: {
    email: string;
  };
  liveUrl: string;
  categoryGroupId: string;
  subcategoryId: string;
}): Promise<{ success: boolean; error?: string }> {
  
  if (!HubSpotClient.isEnabled()) {
    console.log('HubSpot sync is disabled, skipping nomination approve sync');
    return { success: true };
  }

  try {
    validateEnvironmentVariables();

    const { nominee, nominator, liveUrl, subcategoryId } = approvalData;

    // 1. Find and update ticket
    // Note: In a full implementation, you might want to store the ticket ID
    // For now, we'll search for it or create a new one if not found
    
    // 2. Find nominee in HubSpot and update with live URL
    if (nominee.type === 'person') {
      if (nominee.email) {
        const contact = await searchContactByEmail(nominee.email);
        if (contact) {
          await updateContactLiveUrl(contact.id, liveUrl);
          console.log(`Updated person nominee contact ${contact.id} with live URL`);
        }
      }
    } else {
      const company = await searchCompanyByLinkedIn(nominee.linkedin);
      if (company) {
        await updateCompanyLiveUrl(company.id, liveUrl);
        console.log(`Updated company nominee ${company.id} with live URL`);
      }
    }

    // 3. Update nominator contact status
    const nominatorContact = await searchContactByEmail(nominator.email);
    if (nominatorContact) {
      await updateNominatorStatus(nominatorContact.id, 'approved', liveUrl);
      console.log(`Updated nominator contact ${nominatorContact.id} status to approved`);
    }

    return { success: true };

  } catch (error) {
    console.error('Failed to sync nomination approval:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Sync nomination rejection
 */
export async function syncNominationReject(rejectionData: {
  nominee: {
    id: string;
    name: string;
    type: 'person' | 'company';
    email?: string;
    linkedin: string;
  };
  nominator: {
    email: string;
  };
  categoryGroupId: string;
  subcategoryId: string;
}): Promise<{ success: boolean; error?: string }> {
  
  if (!HubSpotClient.isEnabled()) {
    console.log('HubSpot sync is disabled, skipping nomination reject sync');
    return { success: true };
  }

  try {
    validateEnvironmentVariables();

    const { nominator } = rejectionData;

    // Update nominator contact status
    const nominatorContact = await searchContactByEmail(nominator.email);
    if (nominatorContact) {
      await updateNominatorStatus(nominatorContact.id, 'rejected');
      console.log(`Updated nominator contact ${nominatorContact.id} status to rejected`);
    }

    return { success: true };

  } catch (error) {
    console.error('Failed to sync nomination rejection:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Test HubSpot connection
 */
export async function testHubSpotConnection(): Promise<{ 
  success: boolean; 
  accountId?: string; 
  error?: string 
}> {
  
  if (!HubSpotClient.isEnabled()) {
    return { success: false, error: 'HubSpot sync is disabled' };
  }

  try {
    validateEnvironmentVariables();
    
    // Test with a simple API call
    const response = await fetch('https://api.hubapi.com/account-info/v3/details', {
      headers: {
        'Authorization': `Bearer ${process.env.HUBSPOT_TOKEN}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, accountId: data.portalId };
    } else {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}