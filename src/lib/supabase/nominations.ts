import { supabase as supabaseAdmin } from './server';
import type { Database } from './types';

type NominationRow = Database['public']['Tables']['nominations']['Row'];

export interface NominationWithImage {
  id: string;
  type: 'person' | 'company';
  categoryGroupId: string;
  subcategoryId: string;
  state: 'submitted' | 'approved' | 'rejected';
  // person fields
  firstname?: string;
  lastname?: string;
  jobtitle?: string;
  personEmail?: string;
  personLinkedin?: string;
  headshotUrl?: string;
  whyMe?: string;
  // company fields
  companyName?: string;
  companyDomain?: string;
  companyWebsite?: string;
  companyLinkedin?: string;
  logoUrl?: string;
  whyUs?: string;
  // shared
  liveUrl?: string;
  votes: number;
  createdAt: string;
  updatedAt: string;
  // computed
  displayName: string;
  imageUrl?: string; // headshot_url or logo_url depending on type
}

/**
 * Get all nominations with proper image URL mapping
 */
export async function getNominations(filters?: {
  subcategoryId?: string;
  state?: 'submitted' | 'approved' | 'rejected';
  limit?: number;
}): Promise<NominationWithImage[]> {
  // Use the public_nominees view for approved nominations, admin_nominations for others
  const usePublicView = filters?.state === 'approved' || !filters?.state;
  
  if (usePublicView && filters?.state === 'approved') {
    // Use public_nominees view for approved nominations
    let query = supabaseAdmin.from('public_nominees').select('*');

    if (filters?.subcategoryId) {
      query = query.eq('subcategory_id', filters.subcategoryId);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    query = query.order('votes', { ascending: false }).order('approved_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get public nominees:', error);
      throw new Error(`Failed to get nominees: ${error.message}`);
    }

    return data.map(mapPublicNomineeRow);
  } else {
    // Use admin_nominations view for all other cases
    let query = supabaseAdmin.from('admin_nominations').select('*');

    if (filters?.subcategoryId) {
      query = query.eq('subcategory_id', filters.subcategoryId);
    }
    if (filters?.state) {
      query = query.eq('state', filters.state);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    query = query.order('votes', { ascending: false }).order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get admin nominations:', error);
      throw new Error(`Failed to get nominations: ${error.message}`);
    }

    return data.map(mapAdminNominationRow);
  }
}

/**
 * Get a single nomination by ID
 */
export async function getNomination(id: string): Promise<NominationWithImage | null> {
  const { data, error } = await supabaseAdmin
    .from('admin_nominations')
    .select('*')
    .eq('nomination_id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Failed to get nomination:', error);
    throw new Error(`Failed to get nomination: ${error.message}`);
  }

  return mapAdminNominationRow(data);
}

/**
 * Update nomination image URL
 */
export async function updateNominationImage(
  id: string,
  imageUrl: string | null
): Promise<NominationWithImage> {
  // First get the nomination to determine type and nominee_id
  const nomination = await getNomination(id);
  if (!nomination) {
    throw new Error('Nomination not found');
  }

  // Get the nominee_id from the nomination
  const { data: nominationData, error: nominationError } = await supabaseAdmin
    .from('nominations')
    .select('nominee_id')
    .eq('id', id)
    .single();

  if (nominationError) {
    throw new Error(`Failed to get nomination: ${nominationError.message}`);
  }

  // Update the appropriate image field in the nominees table based on type
  const updateData = nomination.type === 'person' 
    ? { headshot_url: imageUrl }
    : { logo_url: imageUrl };

  const { error: updateError } = await supabaseAdmin
    .from('nominees')
    .update(updateData)
    .eq('id', nominationData.nominee_id);

  if (updateError) {
    console.error('Failed to update nominee image:', updateError);
    throw new Error(`Failed to update nominee image: ${updateError.message}`);
  }

  // Return the updated nomination
  return await getNomination(id) as NominationWithImage;
}

/**
 * Map public_nominees view row to NominationWithImage
 */
function mapPublicNomineeRow(row: any): NominationWithImage {
  return {
    id: row.nomination_id,
    type: row.type,
    categoryGroupId: row.category_group_id,
    subcategoryId: row.subcategory_id,
    state: 'approved',
    liveUrl: row.live_url || undefined,
    votes: row.votes,
    createdAt: row.created_at,
    updatedAt: row.created_at, // public view doesn't have updated_at
    displayName: row.display_name,
    imageUrl: row.image_url || undefined,
    // Additional fields based on type
    ...(row.type === 'person' ? {
      firstname: row.display_name.split(' ')[0],
      lastname: row.display_name.split(' ').slice(1).join(' '),
      jobtitle: row.title_or_industry,
      personLinkedin: row.linkedin_url,
      headshotUrl: row.image_url,
      whyMe: row.why_vote,
    } : {
      companyName: row.display_name,
      companyLinkedin: row.linkedin_url,
      logoUrl: row.image_url,
      whyUs: row.why_vote,
    })
  };
}

/**
 * Map admin_nominations view row to NominationWithImage
 */
function mapAdminNominationRow(row: any): NominationWithImage {
  return {
    id: row.nomination_id,
    type: row.nominee_type,
    categoryGroupId: row.category_group_id,
    subcategoryId: row.subcategory_id,
    state: row.state,
    liveUrl: row.live_url || undefined,
    votes: row.votes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    displayName: row.nominee_display_name,
    imageUrl: row.nominee_image_url || undefined,
    // Person fields
    firstname: row.nominee_firstname || undefined,
    lastname: row.nominee_lastname || undefined,
    jobtitle: row.nominee_jobtitle || undefined,
    personEmail: row.nominee_email || undefined,
    personLinkedin: row.nominee_linkedin || undefined,
    headshotUrl: row.headshot_url || undefined,
    whyMe: row.why_me || undefined,
    // Company fields
    companyName: row.company_name || undefined,
    companyWebsite: row.company_website || undefined,
    companyLinkedin: row.company_linkedin || undefined,
    logoUrl: row.logo_url || undefined,
    whyUs: row.why_us || undefined,
  };
}

/**
 * Map database row to NominationWithImage (legacy function, kept for compatibility)
 */
function mapNominationRow(row: NominationRow): NominationWithImage {
  // This function is kept for backward compatibility but shouldn't be used with new schema
  throw new Error('mapNominationRow is deprecated, use mapAdminNominationRow or mapPublicNomineeRow');
}