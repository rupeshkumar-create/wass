import { dataLayer } from './data-layer';
import { NominationRecord, VoteRecord } from '../data-types';

// Migration utilities for transitioning from existing JSON-based system
export class DataMigration {
  // Migrate nominations from JSON format to new data layer
  async migrateNominations(jsonNominations: any[]): Promise<{
    success: number;
    errors: Array<{ index: number; error: string; data: any }>;
  }> {
    const results = {
      success: 0,
      errors: [] as Array<{ index: number; error: string; data: any }>,
    };

    for (let i = 0; i < jsonNominations.length; i++) {
      const jsonNom = jsonNominations[i];
      
      try {
        // Transform JSON nomination to new format
        const nomination: NominationRecord = {
          id: jsonNom.id || `migrated-${Date.now()}-${i}`,
          category: jsonNom.category,
          type: jsonNom.type,
          nominee: this.transformNominee(jsonNom.nominee, jsonNom.type),
          nominator: jsonNom.nominator,
          whyNominated: jsonNom.whyNominated || '',
          whyVoteForMe: jsonNom.whyVoteForMe || jsonNom.nominee?.whyVoteForMe || '',
          liveUrl: jsonNom.liveUrl || this.generateSlug(jsonNom.nominee?.name || ''),
          status: jsonNom.status || 'pending',
          uniqueKey: jsonNom.uniqueKey || this.generateUniqueKey(jsonNom.category, jsonNom.nominee?.linkedin),
          imageUrl: jsonNom.imageUrl || jsonNom.nominee?.imageUrl || null,
          createdAt: jsonNom.createdAt ? new Date(jsonNom.createdAt) : new Date(),
          updatedAt: jsonNom.updatedAt ? new Date(jsonNom.updatedAt) : undefined,
          moderatedAt: jsonNom.moderatedAt ? new Date(jsonNom.moderatedAt) : undefined,
          moderatorNote: jsonNom.moderatorNote,
          ...(jsonNom.type === 'person' && jsonNom.company && { company: jsonNom.company }),
        };

        // Use direct adapter access to avoid duplicate checking during migration
        const adapter = await (dataLayer as any).getAdapter();
        await adapter.addNomination(nomination);
        results.success++;
        
      } catch (error) {
        results.errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: jsonNom,
        });
      }
    }

    return results;
  }

  // Migrate votes from JSON format to new data layer
  async migrateVotes(jsonVotes: any[]): Promise<{
    success: number;
    errors: Array<{ index: number; error: string; data: any }>;
  }> {
    const results = {
      success: 0,
      errors: [] as Array<{ index: number; error: string; data: any }>,
    };

    for (let i = 0; i < jsonVotes.length; i++) {
      const jsonVote = jsonVotes[i];
      
      try {
        const vote: VoteRecord = {
          id: jsonVote.id || `migrated-vote-${Date.now()}-${i}`,
          nomineeId: jsonVote.nomineeId,
          category: jsonVote.category,
          voter: jsonVote.voter,
          createdAt: jsonVote.createdAt ? new Date(jsonVote.createdAt) : new Date(),
          ipAddress: jsonVote.ipAddress,
          userAgent: jsonVote.userAgent,
        };

        const adapter = await (dataLayer as any).getAdapter();
        await adapter.addVote(vote);
        results.success++;
        
      } catch (error) {
        results.errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: jsonVote,
        });
      }
    }

    return results;
  }

  // Import data from existing JSON files
  async importFromJSON(nominationsData: any[], votesData: any[] = []): Promise<{
    nominations: { success: number; errors: any[] };
    votes: { success: number; errors: any[] };
  }> {
    console.log('Starting data migration...');
    
    const nominationResults = await this.migrateNominations(nominationsData);
    console.log(`Nominations: ${nominationResults.success} successful, ${nominationResults.errors.length} errors`);
    
    const voteResults = await this.migrateVotes(votesData);
    console.log(`Votes: ${voteResults.success} successful, ${voteResults.errors.length} errors`);

    return {
      nominations: nominationResults,
      votes: voteResults,
    };
  }

  // Export current data to JSON format (for backup)
  async exportToJSON(): Promise<{
    nominations: any[];
    votes: any[];
    metadata: Record<string, any>;
  }> {
    const [nominations, votes] = await Promise.all([
      dataLayer.getAllNominations(),
      dataLayer.getAllVotes(),
    ]);

    // Get some common metadata
    const metadata: Record<string, any> = {};
    try {
      const commonKeys = ['app-version', 'last-backup', 'migration-info'];
      for (const key of commonKeys) {
        const value = await dataLayer.getMetadata(key);
        if (value !== null) {
          metadata[key] = value;
        }
      }
    } catch (error) {
      console.warn('Failed to export metadata:', error);
    }

    return {
      nominations,
      votes,
      metadata,
    };
  }

  // Clear all data (use with caution!)
  async clearAllData(): Promise<void> {
    const adapter = await (dataLayer as any).getAdapter();
    
    if ('clearAllData' in adapter) {
      await adapter.clearAllData();
    } else {
      // Manual cleanup for IndexedDB
      const nominations = await dataLayer.getAllNominations();
      const votes = await dataLayer.getAllVotes();
      
      await Promise.all([
        ...nominations.map(n => dataLayer.deleteNomination(n.id)),
        ...votes.map(v => dataLayer.deleteVote(v.id)),
      ]);
    }
    
    console.log('All data cleared');
  }

  // Validate data integrity
  async validateData(): Promise<{
    nominations: { total: number; issues: string[] };
    votes: { total: number; issues: string[] };
  }> {
    const [nominations, votes] = await Promise.all([
      dataLayer.getAllNominations(),
      dataLayer.getAllVotes(),
    ]);

    const nominationIssues: string[] = [];
    const voteIssues: string[] = [];

    // Check nominations
    const nominationIds = new Set<string>();
    const uniqueKeys = new Set<string>();
    
    for (const nom of nominations) {
      // Check for duplicate IDs
      if (nominationIds.has(nom.id)) {
        nominationIssues.push(`Duplicate nomination ID: ${nom.id}`);
      }
      nominationIds.add(nom.id);

      // Check for duplicate unique keys
      if (uniqueKeys.has(nom.uniqueKey)) {
        nominationIssues.push(`Duplicate unique key: ${nom.uniqueKey}`);
      }
      uniqueKeys.add(nom.uniqueKey);

      // Check required fields
      if (!nom.nominee?.name) {
        nominationIssues.push(`Missing nominee name for ID: ${nom.id}`);
      }
      if (!nom.nominee?.linkedin) {
        nominationIssues.push(`Missing LinkedIn for ID: ${nom.id}`);
      }
      if (!nom.category) {
        nominationIssues.push(`Missing category for ID: ${nom.id}`);
      }
    }

    // Check votes
    const voteIds = new Set<string>();
    
    for (const vote of votes) {
      // Check for duplicate IDs
      if (voteIds.has(vote.id)) {
        voteIssues.push(`Duplicate vote ID: ${vote.id}`);
      }
      voteIds.add(vote.id);

      // Check if nominee exists
      if (!nominationIds.has(vote.nomineeId)) {
        voteIssues.push(`Vote ${vote.id} references non-existent nominee: ${vote.nomineeId}`);
      }

      // Check required fields
      if (!vote.voter?.email) {
        voteIssues.push(`Missing voter email for vote ID: ${vote.id}`);
      }
      if (!vote.category) {
        voteIssues.push(`Missing category for vote ID: ${vote.id}`);
      }
    }

    return {
      nominations: { total: nominations.length, issues: nominationIssues },
      votes: { total: votes.length, issues: voteIssues },
    };
  }

  // Helper methods
  private transformNominee(nominee: any, type: string): any {
    const base = {
      name: nominee.name,
      country: nominee.country,
      linkedin: nominee.linkedin,
      imageUrl: nominee.imageUrl || null,
      whyVoteForMe: nominee.whyVoteForMe || '',
    };

    if (type === 'person') {
      return {
        ...base,
        firstName: nominee.firstName || nominee.name?.split(' ')[0] || '',
        lastName: nominee.lastName || nominee.name?.split(' ').slice(1).join(' ') || '',
        title: nominee.title || '',
      };
    } else {
      return {
        ...base,
        website: nominee.website || '',
      };
    }
  }

  private generateUniqueKey(category: string, linkedin: string): string {
    const normalizedLinkedIn = linkedin?.toLowerCase().replace(/\/$/, '') || '';
    return `${category}:${normalizedLinkedIn}`;
  }

  private generateSlug(name: string): string {
    return name
      ?.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim() || 'unnamed';
  }
}

// Export singleton instance
export const dataMigration = new DataMigration();