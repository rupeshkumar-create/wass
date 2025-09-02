import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';
import { 
  Nomination, 
  Vote, 
  NominationRecord, 
  VoteRecord, 
  PersonNominationInput,
  CompanyNominationInput,
  VoteInput,
  NominationStatus,
  NominationType
} from '../data-types';
import { getSubcategoryById } from '../categories';
import { getDB, isIndexedDBAvailable, DatabaseError, withTransaction } from './indexeddb';
import { localStorageAdapter, isLocalStorageAvailable } from './localstorage';

// Storage adapter interface
interface StorageAdapter {
  // Nominations
  getAllNominations(): Promise<NominationRecord[]>;
  getNominationById(id: string): Promise<NominationRecord | undefined>;
  getNominationsByCategory(category: string): Promise<NominationRecord[]>;
  getNominationsByStatus(status: string): Promise<NominationRecord[]>;
  getNominationsByType(type: string): Promise<NominationRecord[]>;
  getNominationByUniqueKey(uniqueKey: string): Promise<NominationRecord | undefined>;
  addNomination(nomination: NominationRecord): Promise<void>;
  updateNomination(id: string, updates: Partial<NominationRecord>): Promise<void>;
  deleteNomination(id: string): Promise<void>;

  // Votes
  getAllVotes(): Promise<VoteRecord[]>;
  getVoteById(id: string): Promise<VoteRecord | undefined>;
  getVotesByNominee(nomineeId: string): Promise<VoteRecord[]>;
  getVotesByCategory(category: string): Promise<VoteRecord[]>;
  getVotesByVoterEmail(email: string): Promise<VoteRecord[]>;
  addVote(vote: VoteRecord): Promise<void>;
  deleteVote(id: string): Promise<void>;

  // Metadata
  getMetadata(key: string): Promise<any>;
  setMetadata(key: string, value: any): Promise<void>;
  deleteMetadata(key: string): Promise<void>;
}

// IndexedDB adapter
class IndexedDBAdapter implements StorageAdapter {
  async getAllNominations(): Promise<NominationRecord[]> {
    const db = await getDB();
    return await db.getAll('nominations');
  }

  async getNominationById(id: string): Promise<NominationRecord | undefined> {
    const db = await getDB();
    return await db.get('nominations', id);
  }

  async getNominationsByCategory(category: string): Promise<NominationRecord[]> {
    const db = await getDB();
    return await db.getAllFromIndex('nominations', 'by-category', category);
  }

  async getNominationsByStatus(status: string): Promise<NominationRecord[]> {
    const db = await getDB();
    return await db.getAllFromIndex('nominations', 'by-status', status);
  }

  async getNominationsByType(type: string): Promise<NominationRecord[]> {
    const db = await getDB();
    return await db.getAllFromIndex('nominations', 'by-type', type);
  }

  async getNominationByUniqueKey(uniqueKey: string): Promise<NominationRecord | undefined> {
    const db = await getDB();
    return await db.getFromIndex('nominations', 'by-unique-key', uniqueKey);
  }

  async addNomination(nomination: NominationRecord): Promise<void> {
    return withTransaction(['nominations'], 'readwrite', async (tx) => {
      await tx.objectStore('nominations').add(nomination);
    });
  }

  async updateNomination(id: string, updates: Partial<NominationRecord>): Promise<void> {
    return withTransaction(['nominations'], 'readwrite', async (tx) => {
      const store = tx.objectStore('nominations');
      const existing = await store.get(id);
      if (!existing) {
        throw new Error('Nomination not found');
      }
      await store.put({ ...existing, ...updates, updatedAt: new Date() });
    });
  }

  async deleteNomination(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('nominations', id);
  }

  async getAllVotes(): Promise<VoteRecord[]> {
    const db = await getDB();
    return await db.getAll('votes');
  }

  async getVoteById(id: string): Promise<VoteRecord | undefined> {
    const db = await getDB();
    return await db.get('votes', id);
  }

  async getVotesByNominee(nomineeId: string): Promise<VoteRecord[]> {
    const db = await getDB();
    return await db.getAllFromIndex('votes', 'by-nominee', nomineeId);
  }

  async getVotesByCategory(category: string): Promise<VoteRecord[]> {
    const db = await getDB();
    return await db.getAllFromIndex('votes', 'by-category', category);
  }

  async getVotesByVoterEmail(email: string): Promise<VoteRecord[]> {
    const db = await getDB();
    return await db.getAllFromIndex('votes', 'by-voter-email', email);
  }

  async addVote(vote: VoteRecord): Promise<void> {
    const db = await getDB();
    await db.add('votes', vote);
  }

  async deleteVote(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('votes', id);
  }

  async getMetadata(key: string): Promise<any> {
    const db = await getDB();
    const record = await db.get('metadata', key);
    return record?.value || null;
  }

  async setMetadata(key: string, value: any): Promise<void> {
    const db = await getDB();
    await db.put('metadata', {
      key,
      value,
      updatedAt: new Date(),
    });
  }

  async deleteMetadata(key: string): Promise<void> {
    const db = await getDB();
    await db.delete('metadata', key);
  }
}

// Storage manager that chooses the best available storage
class StorageManager {
  private adapter: StorageAdapter | null = null;
  private storageType: 'indexeddb' | 'localstorage' | null = null;

  private async getAdapter(): Promise<StorageAdapter> {
    if (this.adapter) {
      return this.adapter;
    }

    // Try IndexedDB first
    if (isIndexedDBAvailable()) {
      try {
        await getDB(); // Test connection
        this.adapter = new IndexedDBAdapter();
        this.storageType = 'indexeddb';
        console.log('Using IndexedDB for data storage');
        return this.adapter;
      } catch (error) {
        console.warn('IndexedDB failed, falling back to localStorage:', error);
      }
    }

    // Fallback to localStorage
    if (isLocalStorageAvailable()) {
      this.adapter = localStorageAdapter;
      this.storageType = 'localstorage';
      console.log('Using localStorage for data storage');
      return this.adapter;
    }

    throw new Error('No storage mechanism available');
  }

  getStorageType(): 'indexeddb' | 'localstorage' | null {
    return this.storageType;
  }

  // Nominations API
  async getAllNominations(): Promise<Nomination[]> {
    const adapter = await this.getAdapter();
    const records = await adapter.getAllNominations();
    return records.map(this.recordToNomination);
  }

  async getNominationById(id: string): Promise<Nomination | null> {
    const adapter = await this.getAdapter();
    const record = await adapter.getNominationById(id);
    return record ? this.recordToNomination(record) : null;
  }

  async getNominationsByCategory(category: string): Promise<Nomination[]> {
    const adapter = await this.getAdapter();
    const records = await adapter.getNominationsByCategory(category);
    return records.map(this.recordToNomination);
  }

  async getNominationsByStatus(status: NominationStatus): Promise<Nomination[]> {
    const adapter = await this.getAdapter();
    const records = await adapter.getNominationsByStatus(status);
    return records.map(this.recordToNomination);
  }

  async getNominationsByType(type: NominationType): Promise<Nomination[]> {
    const adapter = await this.getAdapter();
    const records = await adapter.getNominationsByType(type);
    return records.map(this.recordToNomination);
  }

  async createNomination(input: PersonNominationInput | CompanyNominationInput): Promise<Nomination> {
    const adapter = await this.getAdapter();
    
    // Determine nomination type from category
    const subcategory = getSubcategoryById(input.category);
    if (!subcategory) {
      throw new Error('Invalid category');
    }

    // Generate unique key for duplicate detection
    const uniqueKey = this.generateUniqueKey(input.category, input.nominee.linkedin);
    
    // Check for duplicates
    const existing = await adapter.getNominationByUniqueKey(uniqueKey);
    if (existing) {
      throw new Error('A nomination already exists for this category and LinkedIn profile');
    }

    // Generate slug for live URL
    const slug = this.generateSlug(input.nominee.name);
    
    // Create nomination record
    const now = new Date();
    const nomination: NominationRecord = {
      id: uuidv4(),
      category: input.category,
      type: subcategory.type,
      nominee: input.nominee,
      nominator: input.nominator,
      whyNominated: input.whyNominated,
      whyVoteForMe: input.nominee.whyVoteForMe || '',
      liveUrl: slug,
      status: 'pending',
      uniqueKey,
      imageUrl: input.nominee.imageUrl || null,
      createdAt: now,
      ...(subcategory.type === 'person' && { company: (input as PersonNominationInput).company }),
    } as NominationRecord;

    await adapter.addNomination(nomination);
    return this.recordToNomination(nomination);
  }

  async updateNomination(id: string, updates: Partial<Nomination>): Promise<Nomination> {
    const adapter = await this.getAdapter();
    
    // Convert updates to record format
    const recordUpdates: Partial<NominationRecord> = {
      ...updates,
      updatedAt: new Date(),
    };

    await adapter.updateNomination(id, recordUpdates);
    
    const updated = await adapter.getNominationById(id);
    if (!updated) {
      throw new Error('Nomination not found after update');
    }
    
    return this.recordToNomination(updated);
  }

  async deleteNomination(id: string): Promise<void> {
    const adapter = await this.getAdapter();
    await adapter.deleteNomination(id);
  }

  // Votes API
  async getAllVotes(): Promise<Vote[]> {
    const adapter = await this.getAdapter();
    const records = await adapter.getAllVotes();
    return records.map(this.recordToVote);
  }

  async getVotesByNominee(nomineeId: string): Promise<Vote[]> {
    const adapter = await this.getAdapter();
    const records = await adapter.getVotesByNominee(nomineeId);
    return records.map(this.recordToVote);
  }

  async getVotesByCategory(category: string): Promise<Vote[]> {
    const adapter = await this.getAdapter();
    const records = await adapter.getVotesByCategory(category);
    return records.map(this.recordToVote);
  }

  async getVotesByVoterEmail(email: string): Promise<Vote[]> {
    const adapter = await this.getAdapter();
    const records = await adapter.getVotesByVoterEmail(email);
    return records.map(this.recordToVote);
  }

  async createVote(input: VoteInput): Promise<Vote> {
    const adapter = await this.getAdapter();
    
    // Check if nomination exists
    const nomination = await adapter.getNominationById(input.nomineeId);
    if (!nomination) {
      throw new Error('Nomination not found');
    }

    // Check if voter has already voted in this category
    const existingVotes = await adapter.getVotesByVoterEmail(input.voter.email);
    const hasVotedInCategory = existingVotes.some(v => v.category === input.category);
    
    if (hasVotedInCategory) {
      throw new Error('You have already voted in this category');
    }

    // Create vote record
    const vote: VoteRecord = {
      id: uuidv4(),
      nomineeId: input.nomineeId,
      category: input.category,
      voter: input.voter,
      createdAt: new Date(),
    };

    await adapter.addVote(vote);
    return this.recordToVote(vote);
  }

  async deleteVote(id: string): Promise<void> {
    const adapter = await this.getAdapter();
    await adapter.deleteVote(id);
  }

  // Statistics
  async getStats(): Promise<{
    totalNominations: number;
    totalVotes: number;
    nominationsByStatus: Record<NominationStatus, number>;
    nominationsByType: Record<NominationType, number>;
    topCategories: Array<{ category: string; count: number }>;
  }> {
    const adapter = await this.getAdapter();
    const [nominations, votes] = await Promise.all([
      adapter.getAllNominations(),
      adapter.getAllVotes(),
    ]);

    // Count by status
    const nominationsByStatus = nominations.reduce((acc, n) => {
      acc[n.status] = (acc[n.status] || 0) + 1;
      return acc;
    }, {} as Record<NominationStatus, number>);

    // Count by type
    const nominationsByType = nominations.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<NominationType, number>);

    // Top categories by vote count
    const categoryVotes = votes.reduce((acc, v) => {
      acc[v.category] = (acc[v.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCategories = Object.entries(categoryVotes)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalNominations: nominations.length,
      totalVotes: votes.length,
      nominationsByStatus,
      nominationsByType,
      topCategories,
    };
  }

  // Utility methods
  private recordToNomination(record: NominationRecord): Nomination {
    return {
      ...record,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt?.toISOString(),
      moderatedAt: record.moderatedAt?.toISOString(),
    };
  }

  private recordToVote(record: VoteRecord): Vote {
    return {
      ...record,
      createdAt: record.createdAt.toISOString(),
    };
  }

  private generateUniqueKey(category: string, linkedin: string): string {
    const normalizedLinkedIn = linkedin.toLowerCase().replace(/\/$/, '');
    return `${category}:${normalizedLinkedIn}`;
  }

  private generateSlug(name: string): string {
    return slugify(name, { lower: true, strict: true });
  }

  // Metadata operations
  async getMetadata(key: string): Promise<any> {
    const adapter = await this.getAdapter();
    return await adapter.getMetadata(key);
  }

  async setMetadata(key: string, value: any): Promise<void> {
    const adapter = await this.getAdapter();
    await adapter.setMetadata(key, value);
  }

  async deleteMetadata(key: string): Promise<void> {
    const adapter = await this.getAdapter();
    await adapter.deleteMetadata(key);
  }
}

// Export singleton instance
export const dataLayer = new StorageManager();

// Export types and utilities
export type { StorageAdapter };
export { DatabaseError };