import { NominationRecord, VoteRecord } from '../data-types';

// Storage keys
const STORAGE_KEYS = {
  nominations: 'wsa_nominations',
  votes: 'wsa_votes',
  metadata: 'wsa_metadata',
} as const;

// Check if localStorage is available
export function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    
    // Test localStorage functionality
    const testKey = '__wsa_test__';
    window.localStorage.setItem(testKey, 'test');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

// Generic storage operations
class LocalStorageAdapter {
  private getStorageKey(store: keyof typeof STORAGE_KEYS): string {
    return STORAGE_KEYS[store];
  }

  private readStore<T>(store: keyof typeof STORAGE_KEYS): T[] {
    try {
      const data = localStorage.getItem(this.getStorageKey(store));
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      
      // Convert date strings back to Date objects for records
      if (store === 'nominations' || store === 'votes') {
        return parsed.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
          moderatedAt: item.moderatedAt ? new Date(item.moderatedAt) : undefined,
        }));
      }
      
      return parsed;
    } catch (error) {
      console.error(`Failed to read ${store} from localStorage:`, error);
      return [];
    }
  }

  private writeStore<T>(store: keyof typeof STORAGE_KEYS, data: T[]): void {
    try {
      // Convert Date objects to strings for storage
      const serializable = data.map((item: any) => ({
        ...item,
        createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
        updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
        moderatedAt: item.moderatedAt instanceof Date ? item.moderatedAt.toISOString() : item.moderatedAt,
      }));
      
      localStorage.setItem(this.getStorageKey(store), JSON.stringify(serializable));
    } catch (error) {
      console.error(`Failed to write ${store} to localStorage:`, error);
      throw new Error(`Storage operation failed: ${error}`);
    }
  }

  // Nominations operations
  async getAllNominations(): Promise<NominationRecord[]> {
    return this.readStore<NominationRecord>('nominations');
  }

  async getNominationById(id: string): Promise<NominationRecord | undefined> {
    const nominations = await this.getAllNominations();
    return nominations.find(n => n.id === id);
  }

  async getNominationsByCategory(category: string): Promise<NominationRecord[]> {
    const nominations = await this.getAllNominations();
    return nominations.filter(n => n.category === category);
  }

  async getNominationsByStatus(status: string): Promise<NominationRecord[]> {
    const nominations = await this.getAllNominations();
    return nominations.filter(n => n.status === status);
  }

  async getNominationsByType(type: string): Promise<NominationRecord[]> {
    const nominations = await this.getAllNominations();
    return nominations.filter(n => n.type === type);
  }

  async getNominationByUniqueKey(uniqueKey: string): Promise<NominationRecord | undefined> {
    const nominations = await this.getAllNominations();
    return nominations.find(n => n.uniqueKey === uniqueKey);
  }

  async addNomination(nomination: NominationRecord): Promise<void> {
    const nominations = await this.getAllNominations();
    
    // Check for duplicate unique key
    if (nominations.some(n => n.uniqueKey === nomination.uniqueKey)) {
      throw new Error('Nomination with this unique key already exists');
    }
    
    nominations.push(nomination);
    this.writeStore('nominations', nominations);
  }

  async updateNomination(id: string, updates: Partial<NominationRecord>): Promise<void> {
    const nominations = await this.getAllNominations();
    const index = nominations.findIndex(n => n.id === id);
    
    if (index === -1) {
      throw new Error('Nomination not found');
    }
    
    nominations[index] = { ...nominations[index], ...updates, updatedAt: new Date() };
    this.writeStore('nominations', nominations);
  }

  async deleteNomination(id: string): Promise<void> {
    const nominations = await this.getAllNominations();
    const filtered = nominations.filter(n => n.id !== id);
    this.writeStore('nominations', filtered);
  }

  // Votes operations
  async getAllVotes(): Promise<VoteRecord[]> {
    return this.readStore<VoteRecord>('votes');
  }

  async getVoteById(id: string): Promise<VoteRecord | undefined> {
    const votes = await this.getAllVotes();
    return votes.find(v => v.id === id);
  }

  async getVotesByNominee(nomineeId: string): Promise<VoteRecord[]> {
    const votes = await this.getAllVotes();
    return votes.filter(v => v.nomineeId === nomineeId);
  }

  async getVotesByCategory(category: string): Promise<VoteRecord[]> {
    const votes = await this.getAllVotes();
    return votes.filter(v => v.category === category);
  }

  async getVotesByVoterEmail(email: string): Promise<VoteRecord[]> {
    const votes = await this.getAllVotes();
    return votes.filter(v => v.voter.email === email);
  }

  async addVote(vote: VoteRecord): Promise<void> {
    const votes = await this.getAllVotes();
    votes.push(vote);
    this.writeStore('votes', votes);
  }

  async deleteVote(id: string): Promise<void> {
    const votes = await this.getAllVotes();
    const filtered = votes.filter(v => v.id !== id);
    this.writeStore('votes', filtered);
  }

  // Metadata operations
  async getMetadata(key: string): Promise<any> {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.metadata}_${key}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async setMetadata(key: string, value: any): Promise<void> {
    try {
      localStorage.setItem(`${STORAGE_KEYS.metadata}_${key}`, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to set metadata:', error);
      throw error;
    }
  }

  async deleteMetadata(key: string): Promise<void> {
    localStorage.removeItem(`${STORAGE_KEYS.metadata}_${key}`);
  }

  // Utility operations
  async clearAllData(): Promise<void> {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear metadata keys
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(`${STORAGE_KEYS.metadata}_`)) {
        localStorage.removeItem(key);
      }
    });
  }

  async getStorageInfo(): Promise<{
    nominationsCount: number;
    votesCount: number;
    estimatedSize: string;
  }> {
    const nominations = await this.getAllNominations();
    const votes = await this.getAllVotes();
    
    // Estimate storage size
    let totalSize = 0;
    Object.values(STORAGE_KEYS).forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        totalSize += data.length;
      }
    });
    
    return {
      nominationsCount: nominations.length,
      votesCount: votes.length,
      estimatedSize: `${(totalSize / 1024).toFixed(2)} KB`,
    };
  }
}

export const localStorageAdapter = new LocalStorageAdapter();