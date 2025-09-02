/**
 * Mapping utilities for converting local data to HubSpot properties
 * Respects existing LinkedIn keys and implements proper role merging
 */

/**
 * Merge roles - combines existing and new roles without duplicates
 * Returns a string for HubSpot property compatibility
 */
export function mergeRoles(existingRoles: string | undefined, newRole: string): string {
  if (!existingRoles) {
    return newRole;
  }

  const existing = existingRoles.split(';').map(r => r.trim()).filter(r => r);
  const roles = new Set(existing);
  roles.add(newRole);
  
  return Array.from(roles).join(';');
}

/**
 * Map contact properties (Nominator, Voter, Person Nominee)
 * Implements role union semantics - never overwrites existing roles
 */
export function contactProps(input: {
  email: string;
  firstname?: string;
  lastname?: string;
  jobtitle?: string;
  linkedin?: string;
  role: string; // Will be merged with existing roles
  extras?: Record<string, unknown>;
}): Record<string, unknown> {
  const props: Record<string, unknown> = {
    email: input.email,
    source: 'WSA26',
    source_detail: 'WSS26',
    wsa_year: 2026,
    lifecyclestage: 'lead', // Always set as lead for WSA contacts
    ...input.extras,
  };

  // Only set non-empty values to avoid overwriting existing data
  if (input.firstname) props.firstname = input.firstname;
  if (input.lastname) props.lastname = input.lastname;
  if (input.jobtitle) props.jobtitle = input.jobtitle;

  // Set LinkedIn at the configured property key
  if (input.linkedin) {
    const linkedinKey = process.env.HUBSPOT_CONTACT_LINKEDIN_KEY;
    if (linkedinKey) {
      props[linkedinKey] = input.linkedin;
    }
  }

  // Role will be merged in the upsert function
  props.wsa_role = input.role;

  return props;
}

/**
 * Map company properties (Company Nominee)
 */
export function companyProps(input: {
  name: string;
  domain?: string;
  website?: string;
  linkedin?: string;
  extras?: Record<string, unknown>;
}): Record<string, unknown> {
  const props: Record<string, unknown> = {
    name: input.name,
    source: 'WSA26',
    source_detail: 'WSS26',
    wsa_year: 2026,
    wsa_role: 'Nominee_Company',
    lifecyclestage: 'lead', // Always set as lead for WSA companies
    ...input.extras,
  };

  // Only set non-empty values
  if (input.domain) props.domain = input.domain;
  if (input.website) props.website = input.website;
  
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
export function ticketDraftProps(params: {
  type: 'person' | 'company';
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
    content: params.content || buildTicketContent(params),
    hs_pipeline: process.env.HUBSPOT_PIPELINE_ID!,
    hs_pipeline_stage: process.env.HUBSPOT_STAGE_SUBMITTED!,
    wsa_year: 2026,
    wsa_type: params.type,
    wsa_category_group: params.categoryGroupId,
    wsa_subcategory_id: params.subcategoryId,
    wsa_nominee_display_name: params.nomineeDisplayName,
    wsa_nominee_linkedin_url: params.nomineeLinkedin,
    wsa_image_url: params.imageUrl,
    wsa_nominator_email: params.nominatorEmail,
  };
}

/**
 * Map ticket properties for approval update
 */
export function ticketApprovedProps(update: { 
  liveUrl: string;
}): Record<string, unknown> {
  return {
    hs_pipeline_stage: process.env.HUBSPOT_STAGE_APPROVED!,
    wsa_live_url: update.liveUrl,
    wsa_approval_timestamp: new Date().toISOString(),
  };
}

/**
 * Map nominator contact properties
 */
export function nominatorContactProps(nominator: {
  email: string;
  name: string;
  company?: string;
  linkedin?: string;
  nominatedDisplayName?: string;
  status?: 'submitted' | 'approved' | 'rejected';
  categoryGroupId?: string;
  subcategoryId?: string;
}): Record<string, unknown> {
  const [firstname, ...lastnameParts] = nominator.name.split(' ');
  const lastname = lastnameParts.join(' ');

  return contactProps({
    email: nominator.email,
    firstname,
    lastname: lastname || undefined,
    linkedin: nominator.linkedin,
    role: 'Nominator',
    extras: {
      ...(nominator.company && { company: nominator.company }),
      ...(nominator.nominatedDisplayName && { wsa_nominated_display_name: nominator.nominatedDisplayName }),
      ...(nominator.status && { wsa_nominator_status: nominator.status }),
    },
  });
}

/**
 * Map voter contact properties
 */
export function voterContactProps(voter: {
  email: string;
  firstname: string;
  lastname: string;
  company?: string;
  linkedin?: string;
  votedForDisplayName: string;
  subcategoryId: string;
}): Record<string, unknown> {
  return contactProps({
    email: voter.email,
    firstname: voter.firstname,
    lastname: voter.lastname,
    linkedin: voter.linkedin,
    role: 'Voter',
    extras: {
      ...(voter.company && { company: voter.company }),
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
  firstname?: string;
  lastname?: string;
  jobtitle?: string;
  linkedin?: string;
  categories?: string[];
  headshotUrl?: string;
  whyMe?: string;
  liveUrl?: string;
}): Record<string, unknown> {
  // Generate email if not provided
  const email = nominee.email || generatePlaceholderEmail(
    nominee.firstname || nominee.name.split(' ')[0],
    nominee.lastname || nominee.name.split(' ').slice(1).join(' ') || 'Nominee'
  );

  return contactProps({
    email,
    firstname: nominee.firstname || nominee.name.split(' ')[0],
    lastname: nominee.lastname || nominee.name.split(' ').slice(1).join(' ') || undefined,
    jobtitle: nominee.jobtitle,
    linkedin: nominee.linkedin,
    role: 'Nominee_Person',
    extras: {
      ...(nominee.categories && { wsa_categories: nominee.categories }),
      ...(nominee.headshotUrl && { wsa_headshot_url: nominee.headshotUrl }),
      ...(nominee.liveUrl && { wsa_live_url: nominee.liveUrl }),
    },
  });
}

/**
 * Map company nominee properties
 */
export function companyNomineeProps(nominee: {
  name: string;
  domain?: string;
  website?: string;
  linkedin?: string;
  categories?: string[];
  logoUrl?: string;
  whyUs?: string;
  liveUrl?: string;
}): Record<string, unknown> {
  return companyProps({
    name: nominee.name,
    domain: nominee.domain,
    website: nominee.website,
    linkedin: nominee.linkedin,
    extras: {
      ...(nominee.categories && { wsa_categories: nominee.categories }),
      ...(nominee.logoUrl && { wsa_logo_url: nominee.logoUrl }),
      ...(nominee.liveUrl && { wsa_live_url: nominee.liveUrl }),
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
 * Generate placeholder email for person nominees without email
 */
export function generatePlaceholderEmail(firstname: string, lastname: string): string {
  const cleanFirst = firstname.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanLast = lastname.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${cleanFirst}.${cleanLast}@nominee.wsa-2026.com`;
}

/**
 * Build ticket content from nomination data
 */
function buildTicketContent(params: {
  type: 'person' | 'company';
  categoryGroupId: string;
  subcategoryId: string;
  nomineeDisplayName: string;
  nomineeLinkedin?: string;
  nominatorEmail: string;
}): string {
  const sections = [
    '**WSA 2026 Nomination**',
    '',
    `**Category:** ${params.subcategoryId}`,
    `**Type:** ${params.type === 'person' ? 'Individual' : 'Company'}`,
    `**Nominee:** ${params.nomineeDisplayName}`,
    `**LinkedIn:** ${params.nomineeLinkedin || 'Not provided'}`,
    '',
    `**Nominated by:** ${params.nominatorEmail}`,
    '',
    '---',
    '*This ticket was automatically created by the WSA 2026 nomination system.*'
  ];

  return sections.join('\n');
}



/**
 * Validate required environment variables
 */
export function validateEnvironmentVariables(): void {
  // Check for HubSpot token (either HUBSPOT_ACCESS_TOKEN or HUBSPOT_TOKEN)
  if (!process.env.HUBSPOT_ACCESS_TOKEN && !process.env.HUBSPOT_TOKEN) {
    throw new Error('HUBSPOT_ACCESS_TOKEN or HUBSPOT_TOKEN environment variable is required');
  }

  // Set defaults for optional HubSpot configuration variables
  if (!process.env.HUBSPOT_CONTACT_LINKEDIN_KEY) {
    process.env.HUBSPOT_CONTACT_LINKEDIN_KEY = 'linkedin';
  }
  
  if (!process.env.HUBSPOT_COMPANY_LINKEDIN_KEY) {
    process.env.HUBSPOT_COMPANY_LINKEDIN_KEY = 'linkedin_company_page';
  }
  
  if (!process.env.HUBSPOT_PIPELINE_ID) {
    process.env.HUBSPOT_PIPELINE_ID = 'default-pipeline';
  }
  
  if (!process.env.HUBSPOT_STAGE_SUBMITTED) {
    process.env.HUBSPOT_STAGE_SUBMITTED = 'submitted';
  }
  
  if (!process.env.HUBSPOT_STAGE_APPROVED) {
    process.env.HUBSPOT_STAGE_APPROVED = 'approved';
  }

  console.log('✅ HubSpot environment variables validated with defaults where needed');
}