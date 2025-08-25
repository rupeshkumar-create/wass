/**
 * Mapping utilities for converting local data to HubSpot properties
 */

/**
 * Map contact properties for Nominator/Voter/Person Nominee
 */
export function contactProps(input: {
  email: string;
  firstname: string;
  lastname: string;
  linkedin?: string | null;
  role: "Nominator" | "Voter" | "Nominee_Person";
  extras?: Record<string, unknown>;
}): Record<string, unknown> {
  const props: Record<string, unknown> = {
    email: input.email,
    firstname: input.firstname,
    lastname: input.lastname,
    wsa_year: 2026,
    wsa_role: input.role,
    ...input.extras,
  };

  // Set LinkedIn at the configured property key
  if (input.linkedin) {
    const linkedinKey = process.env.HUBSPOT_CONTACT_LINKEDIN_KEY;
    if (linkedinKey) {
      props[linkedinKey] = input.linkedin;
    }
  }

  return props;
}

/**
 * Map company properties for Company Nominee
 */
export function companyProps(input: {
  name: string;
  domain?: string | null;
  website?: string | null;
  linkedin?: string | null;
  extras?: Record<string, unknown>;
}): Record<string, unknown> {
  const props: Record<string, unknown> = {
    name: input.name,
    wsa_year: 2026,
    wsa_role: "Nominee_Company",
    ...input.extras,
  };

  if (input.domain) props["domain"] = input.domain;
  if (input.website) props["website"] = input.website;
  
  // Set LinkedIn at the configured property key
  if (input.linkedin) {
    const linkedinKey = process.env.HUBSPOT_COMPANY_LINKEDIN_KEY;
    if (linkedinKey) {
      props[linkedinKey] = input.linkedin;
    }
  }

  return props;
}

/**
 * Map ticket properties for nomination (draft/submitted state)
 */
export function ticketPropsDraft(params: {
  type: "person" | "company";
  categoryGroupId: string;
  subcategoryId: string;
  nomineeDisplayName: string;
  nomineeLinkedin?: string;
  imageUrl?: string;
  nominatorEmail: string;
  content?: string;
}): Record<string, unknown> {
  return {
    subject: `WSA 2026 – ${params.subcategoryId} – ${params.nomineeDisplayName}`,
    content: params.content || "",
    wsa_year: 2026,
    wsa_type: params.type,
    wsa_category_group: params.categoryGroupId,
    wsa_subcategory_id: params.subcategoryId,
    wsa_nominee_display_name: params.nomineeDisplayName,
    wsa_nominee_linkedin_url: params.nomineeLinkedin,
    wsa_image_url: params.imageUrl,
    wsa_nominator_email: params.nominatorEmail,
    hs_pipeline: process.env.HUBSPOT_PIPELINE_ID!,
    hs_pipeline_stage: process.env.HUBSPOT_STAGE_SUBMITTED!,
  };
}

/**
 * Map ticket properties for approval update
 */
export function ticketPropsApproved(update: { 
  liveUrl: string;
}): Record<string, unknown> {
  return {
    hs_pipeline_stage: process.env.HUBSPOT_STAGE_APPROVED!,
    wsa_live_url: update.liveUrl,
    wsa_approval_timestamp: new Date().toISOString(),
  };
}

/**
 * Map ticket properties for rejection update
 */
export function ticketPropsRejected(): Record<string, unknown> {
  return {
    hs_pipeline_stage: process.env.HUBSPOT_STAGE_REJECTED!,
  };
}

/**
 * Map nominator contact properties
 */
export function nominatorContactProps(nominator: {
  email: string;
  name: string;
  company: string;
  linkedin: string;
  nominatedDisplayName?: string;
  status?: 'submitted' | 'approved' | 'rejected';
}): Record<string, unknown> {
  const [firstname, ...lastnameParts] = nominator.name.split(' ');
  const lastname = lastnameParts.join(' ');

  return contactProps({
    email: nominator.email,
    firstname,
    lastname,
    linkedin: nominator.linkedin,
    role: 'Nominator',
    extras: {
      company: nominator.company,
      wsa_nominated_display_name: nominator.nominatedDisplayName,
      wsa_nominator_status: nominator.status || 'submitted',
    },
  });
}

/**
 * Map voter contact properties
 */
export function voterContactProps(voter: {
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  linkedin: string;
  votedForDisplayName: string;
  subcategoryId: string;
}): Record<string, unknown> {
  return contactProps({
    email: voter.email,
    firstname: voter.firstName,
    lastname: voter.lastName,
    linkedin: voter.linkedin,
    role: 'Voter',
    extras: {
      company: voter.company,
      wsa_voted_for_display_name: voter.votedForDisplayName,
      wsa_voted_subcategory_id: voter.subcategoryId,
      wsa_vote_timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Map person nominee contact properties
 */
export function personNomineeContactProps(nominee: {
  email?: string;
  name: string;
  firstName: string;
  lastName: string;
  title?: string;
  linkedin: string;
  status?: 'submitted' | 'approved' | 'rejected';
  liveUrl?: string;
}): Record<string, unknown> {
  return contactProps({
    email: nominee.email || `${nominee.firstName.toLowerCase()}.${nominee.lastName.toLowerCase()}@nominee.wsa2026.com`,
    firstname: nominee.firstName,
    lastname: nominee.lastName,
    linkedin: nominee.linkedin,
    role: 'Nominee_Person',
    extras: {
      jobtitle: nominee.title,
      wsa_live_url: nominee.liveUrl,
    },
  });
}

/**
 * Map company nominee properties
 */
export function companyNomineeProps(nominee: {
  name: string;
  website?: string;
  linkedin: string;
  status?: 'submitted' | 'approved' | 'rejected';
  liveUrl?: string;
}): Record<string, unknown> {
  // Extract domain from website
  let domain: string | undefined;
  if (nominee.website) {
    try {
      const url = new URL(nominee.website.startsWith('http') ? nominee.website : `https://${nominee.website}`);
      domain = url.hostname.replace('www.', '');
    } catch {
      // Invalid URL, skip domain
    }
  }

  return companyProps({
    name: nominee.name,
    website: nominee.website,
    domain,
    linkedin: nominee.linkedin,
    extras: {
      wsa_live_url: nominee.liveUrl,
    },
  });
}

/**
 * Extract domain from website URL
 */
export function extractDomain(website: string): string | null {
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    return url.hostname.replace('www.', '');
  } catch {
    return null;
  }
}

/**
 * Normalize LinkedIn URL
 */
export function normalizeLinkedInUrl(url: string): string {
  if (!url) return url;
  
  // Remove trailing slashes and normalize format
  return url.replace(/\/$/, '').toLowerCase();
}

/**
 * Generate placeholder email for person nominees without email
 */
export function generatePlaceholderEmail(firstName: string, lastName: string): string {
  const cleanFirst = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanLast = lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${cleanFirst}.${cleanLast}@nominee.wsa2026.com`;
}

/**
 * Map local nomination to HubSpot ticket content
 */
export function buildTicketContent(nomination: {
  type: 'person' | 'company';
  nominee: any;
  nominator: any;
  whyNominated: string;
  category: string;
  whyVoteForMe?: string;
}): string {
  const { type, nominee, nominator, whyNominated, category, whyVoteForMe } = nomination;
  
  const sections = [
    '**Nomination Details**',
    '',
    `**Category:** ${category}`,
    `**Type:** ${type === 'person' ? 'Person' : 'Company'}`,
    `**Nominee:** ${nominee.name}`,
    `**LinkedIn:** ${nominee.linkedin}`,
    '',
    `**Nominated by:** ${nominator.name} (${nominator.email})`,
    `**Company:** ${nominator.company}`,
    '',
    '**Why nominated:**',
    whyNominated,
  ];

  if (whyVoteForMe) {
    sections.push('', '**Why vote for them:**', whyVoteForMe);
  }

  sections.push('', '---', '*This ticket was automatically created by the WSA 2026 nomination system.*');

  return sections.join('\n');
}

/**
 * Validate required environment variables
 */
export function validateEnvironmentVariables(): void {
  const required = [
    'HUBSPOT_TOKEN',
    'HUBSPOT_CONTACT_LINKEDIN_KEY',
    'HUBSPOT_COMPANY_LINKEDIN_KEY',
    'HUBSPOT_PIPELINE_ID',
    'HUBSPOT_STAGE_SUBMITTED',
    'HUBSPOT_STAGE_APPROVED',
    'HUBSPOT_STAGE_REJECTED',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}