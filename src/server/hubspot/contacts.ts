import { hubspotClient } from './client';
import { searchContactByEmail } from './search';

/**
 * Contact management utilities
 */

export interface ContactProperties {
  email: string;
  firstname?: string;
  lastname?: string;
  jobtitle?: string;
  company?: string;
  linkedin?: string;
  wsa_year?: number;
  wsa_role?: string;
  wsa_nominated_display_name?: string;
  wsa_nominator_status?: string;
  wsa_voted_for_display_name?: string;
  wsa_voted_subcategory_id?: string;
  wsa_vote_timestamp?: string;
  wsa_live_url?: string;
  [key: string]: any;
}

/**
 * Upsert contact by email with role merging
 */
export async function upsertContactByEmail(
  properties: ContactProperties,
  idempotencyKey?: string
): Promise<{ id: string; isNew: boolean }> {
  const email = properties.email;
  
  if (!email) {
    throw new Error('Email is required for contact upsert');
  }

  // Search for existing contact
  const existingContact = await searchContactByEmail(email);
  
  if (existingContact) {
    // Update existing contact
    const updateProperties = { ...properties };
    
    // Merge roles (don't overwrite existing)
    if (properties.wsa_role && existingContact.properties.wsa_role) {
      const existingRoles = existingContact.properties.wsa_role.split(';').filter(Boolean);
      const newRole = properties.wsa_role;
      
      if (!existingRoles.includes(newRole)) {
        updateProperties.wsa_role = [...existingRoles, newRole].join(';');
      } else {
        // Role already exists, don't update it
        delete updateProperties.wsa_role;
      }
    }

    // Keep existing name if not provided
    if (!updateProperties.firstname && existingContact.properties.firstname) {
      delete updateProperties.firstname;
    }
    if (!updateProperties.lastname && existingContact.properties.lastname) {
      delete updateProperties.lastname;
    }

    // Set LinkedIn at the configured property key
    if (properties.linkedin) {
      updateProperties[process.env.HUBSPOT_CONTACT_LINKEDIN_KEY!] = properties.linkedin;
      delete updateProperties.linkedin;
    }

    await hubspotClient.hubFetch(`/crm/v3/objects/contacts/${existingContact.id}`, {
      method: 'PATCH',
      body: { properties: updateProperties },
      idempotencyKey: idempotencyKey || hubspotClient.generateIdempotencyKey(),
    });

    return { id: existingContact.id, isNew: false };
  } else {
    // Create new contact
    const createProperties = { ...properties };
    
    // Set LinkedIn at the configured property key
    if (properties.linkedin) {
      createProperties[process.env.HUBSPOT_CONTACT_LINKEDIN_KEY!] = properties.linkedin;
      delete createProperties.linkedin;
    }

    // Always set year for new contacts
    createProperties.wsa_year = 2026;

    const response = await hubspotClient.hubFetch('/crm/v3/objects/contacts', {
      method: 'POST',
      body: { properties: createProperties },
      idempotencyKey: idempotencyKey || hubspotClient.generateIdempotencyKey(),
    });

    return { id: response.id, isNew: true };
  }
}

/**
 * Create or update nominator contact
 */
export async function upsertNominatorContact(nominator: {
  email: string;
  name: string;
  company: string;
  linkedin: string;
  nominatedDisplayName?: string;
  status?: 'submitted' | 'approved' | 'rejected';
}): Promise<{ id: string; isNew: boolean }> {
  const [firstname, ...lastnameParts] = nominator.name.split(' ');
  const lastname = lastnameParts.join(' ');

  return await upsertContactByEmail({
    email: nominator.email,
    firstname,
    lastname,
    company: nominator.company,
    linkedin: nominator.linkedin,
    wsa_year: 2026,
    wsa_role: 'Nominator',
    wsa_nominated_display_name: nominator.nominatedDisplayName,
    wsa_nominator_status: nominator.status || 'submitted',
  });
}

/**
 * Create or update voter contact
 */
export async function upsertVoterContact(voter: {
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  linkedin: string;
  votedForDisplayName: string;
  subcategoryId: string;
}): Promise<{ id: string; isNew: boolean }> {
  return await upsertContactByEmail({
    email: voter.email,
    firstname: voter.firstName,
    lastname: voter.lastName,
    company: voter.company,
    linkedin: voter.linkedin,
    wsa_year: 2026,
    wsa_role: 'Voter',
    wsa_voted_for_display_name: voter.votedForDisplayName,
    wsa_voted_subcategory_id: voter.subcategoryId,
    wsa_vote_timestamp: new Date().toISOString(),
  });
}

/**
 * Create or update person nominee contact
 */
export async function upsertPersonNomineeContact(nominee: {
  email?: string;
  name: string;
  firstName: string;
  lastName: string;
  title?: string;
  linkedin: string;
  status?: 'submitted' | 'approved' | 'rejected';
  liveUrl?: string;
}): Promise<{ id: string; isNew: boolean }> {
  // For person nominees, we need an email to create a contact
  // If no email, we might skip contact creation or use a placeholder
  if (!nominee.email) {
    throw new Error('Email is required for person nominee contact');
  }

  return await upsertContactByEmail({
    email: nominee.email,
    firstname: nominee.firstName,
    lastname: nominee.lastName,
    jobtitle: nominee.title,
    linkedin: nominee.linkedin,
    wsa_year: 2026,
    wsa_role: 'Nominee_Person',
    wsa_live_url: nominee.liveUrl,
  });
}

/**
 * Update contact with live URL (for approved nominees)
 */
export async function updateContactLiveUrl(
  contactId: string,
  liveUrl: string
): Promise<void> {
  await hubspotClient.hubFetch(`/crm/v3/objects/contacts/${contactId}`, {
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
 * Update nominator status
 */
export async function updateNominatorStatus(
  contactId: string,
  status: 'submitted' | 'approved' | 'rejected',
  liveUrl?: string
): Promise<void> {
  const properties: any = {
    wsa_nominator_status: status,
  };

  if (liveUrl) {
    properties.wsa_live_url = liveUrl;
  }

  await hubspotClient.hubFetch(`/crm/v3/objects/contacts/${contactId}`, {
    method: 'PATCH',
    body: { properties },
    idempotencyKey: hubspotClient.generateIdempotencyKey(),
  });
}