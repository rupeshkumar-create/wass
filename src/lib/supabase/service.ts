import { supabase } from './server';
import type { Database } from './types';
import type { Nomination, Vote, NominationInput, VoteInput } from '../data-types';
import { v4 as uuidv4 } from 'uuid';

type NominationRow = Database['public']['Tables']['nominations']['Row'];
type VoteRow = Database['public']['Tables']['votes']['Row'];
type OutboxRow = Database['public']['Tables']['sync_outbox']['Row'];

/**
 * Supabase service layer for WSA 2026
 * Server-side only operations with proper error handling
 */
export class SupabaseService {
  /**
   * Create a new nomination
   */
  async createNomination(input: NominationInput & { type: 'person' | 'company' }): Promise<Nomination> {
    const id = uuidv4();
    const uniqueKey = this.generateUniqueKey(input);
    
    const nominationData: Database['public']['Tables']['nominations']['Insert'] = {
      id,
      category: input.category,
      type: input.type,
      nominee_data: input.nominee,
      company_data: input.type === 'person' ? (input as any).company : null,
      nominator_data: input.nominator,
      why_nominated: input.whyNominated,
      why_vote_for_me: input.nominee.whyVoteForMe || null,
      unique_key: uniqueKey,
      status: 'pending',
      sync_status: 'pending'
    };

    const { data, error } = await supabase
      .from('nominations')
      .insert(nominationData)
      .select()
      .single();

    if (error) {
      console.error('Failed to create nomination:', error);
      throw new Error(`Failed to create nomination: ${error.message}`);
    }

    // Add to sync outbox for external integrations
    await this.addToSyncOutbox('nomination', data.id, 'create', data);

    return this.mapNominationFromRow(data);
  }

  /**
   * Get nomination by ID
   */
  async getNomination(id: string): Promise<Nomination | null> {
    const { data, error } = await supabase
      .from('nominations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Failed to get nomination:', error);
      throw new Error(`Failed to get nomination: ${error.message}`);
    }

    return this.mapNominationFromRow(data);
  }

  /**
   * Get all nominations with optional filters
   */
  async getNominations(filters?: {
    category?: string;
    type?: 'person' | 'company';
    status?: 'pending' | 'approved' | 'rejected';
    limit?: number;
    offset?: number;
  }): Promise<Nomination[]> {
    let query = supabase.from('nominations').select('*');

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get nominations:', error);
      throw new Error(`Failed to get nominations: ${error.message}`);
    }

    return data.map(row => this.mapNominationFromRow(row));
  }

  /**
   * Update nomination status (for moderation)
   */
  async updateNominationStatus(
    id: string, 
    status: 'pending' | 'approved' | 'rejected',
    moderatorNote?: string
  ): Promise<Nomination> {
    const { data, error } = await supabase
      .from('nominations')
      .update({
        status,
        moderated_at: new Date().toISOString(),
        moderator_note: moderatorNote || null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update nomination status:', error);
      throw new Error(`Failed to update nomination status: ${error.message}`);
    }

    // Add to sync outbox for external integrations
    await this.addToSyncOutbox('nomination', data.id, 'update', data);

    return this.mapNominationFromRow(data);
  }

  /**
   * Create a new vote
   */
  async createVote(input: VoteInput, metadata?: { ipAddress?: string; userAgent?: string }): Promise<Vote> {
    const id = uuidv4();
    
    const voteData: Database['public']['Tables']['votes']['Insert'] = {
      id,
      nominee_id: input.nomineeId,
      category: input.category,
      voter_data: input.voter,
      ip_address: metadata?.ipAddress || null,
      user_agent: metadata?.userAgent || null,
      sync_status: 'pending'
    };

    const { data, error } = await supabase
      .from('votes')
      .insert(voteData)
      .select()
      .single();

    if (error) {
      console.error('Failed to create vote:', error);
      throw new Error(`Failed to create vote: ${error.message}`);
    }

    // Add to sync outbox for external integrations
    await this.addToSyncOutbox('vote', data.id, 'create', data);

    return this.mapVoteFromRow(data);
  }

  /**
   * Get votes for a nomination
   */
  async getVotesForNomination(nomineeId: string): Promise<Vote[]> {
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('nominee_id', nomineeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get votes:', error);
      throw new Error(`Failed to get votes: ${error.message}`);
    }

    return data.map(row => this.mapVoteFromRow(row));
  }

  /**
   * Get vote count for a nomination
   */
  async getVoteCount(nomineeId: string): Promise<number> {
    const { count, error } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('nominee_id', nomineeId);

    if (error) {
      console.error('Failed to get vote count:', error);
      throw new Error(`Failed to get vote count: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Check if user has already voted for a nomination
   */
  async hasUserVoted(nomineeId: string, voterEmail: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('votes')
      .select('id')
      .eq('nominee_id', nomineeId)
      .eq('voter_data->email', voterEmail)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Failed to check vote status:', error);
      throw new Error(`Failed to check vote status: ${error.message}`);
    }

    return !!data;
  }

  /**
   * Get pending sync items from outbox
   */
  async getPendingSyncItems(limit = 50): Promise<OutboxRow[]> {
    const { data, error } = await supabase
      .from('sync_outbox')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Failed to get pending sync items:', error);
      throw new Error(`Failed to get pending sync items: ${error.message}`);
    }

    return data;
  }

  /**
   * Update sync outbox item status
   */
  async updateSyncOutboxStatus(
    id: string, 
    status: 'processing' | 'completed' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('sync_outbox')
      .update({
        status,
        error_message: errorMessage || null,
        processed_at: new Date().toISOString(),
        retry_count: status === 'failed' ? supabase.raw('retry_count + 1') : undefined
      })
      .eq('id', id);

    if (error) {
      console.error('Failed to update sync outbox status:', error);
      throw new Error(`Failed to update sync outbox status: ${error.message}`);
    }
  }

  /**
   * Add item to sync outbox
   */
  private async addToSyncOutbox(
    entityType: 'nomination' | 'vote',
    entityId: string,
    operation: 'create' | 'update' | 'delete',
    payload: any
  ): Promise<void> {
    const { error } = await supabase
      .from('sync_outbox')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        operation,
        payload
      });

    if (error) {
      console.error('Failed to add to sync outbox:', error);
      // Don't throw here - sync is optional
    }
  }

  /**
   * Generate unique key for nomination
   */
  private generateUniqueKey(input: NominationInput & { type: 'person' | 'company' }): string {
    const nominee = input.nominee;
    const nominator = input.nominator;
    
    if (input.type === 'person') {
      return `${nominee.firstName}-${nominee.lastName}-${input.category}-${nominator.email}`.toLowerCase();
    } else {
      return `${nominee.name}-${input.category}-${nominator.email}`.toLowerCase();
    }
  }

  /**
   * Map database row to Nomination type
   */
  private mapNominationFromRow(row: NominationRow): Nomination {
    const base = {
      id: row.id,
      category: row.category,
      type: row.type as 'person' | 'company',
      nominee: row.nominee_data as any,
      nominator: row.nominator_data as any,
      whyNominated: row.why_nominated,
      whyVoteForMe: row.why_vote_for_me || undefined,
      liveUrl: row.live_url || '',
      status: row.status as 'pending' | 'approved' | 'rejected',
      uniqueKey: row.unique_key,
      imageUrl: row.image_url || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at || undefined,
      moderatedAt: row.moderated_at || undefined,
      moderatorNote: row.moderator_note || undefined,
    };

    if (row.type === 'person') {
      return {
        ...base,
        type: 'person',
        company: row.company_data as any,
      } as Nomination;
    } else {
      return {
        ...base,
        type: 'company',
      } as Nomination;
    }
  }

  /**
   * Map database row to Vote type
   */
  private mapVoteFromRow(row: VoteRow): Vote {
    return {
      id: row.id,
      nomineeId: row.nominee_id,
      category: row.category,
      voter: row.voter_data as any,
      createdAt: row.created_at,
      ipAddress: row.ip_address || undefined,
      userAgent: row.user_agent || undefined,
    };
  }
}

// Export singleton instance
export const supabaseService = new SupabaseService();