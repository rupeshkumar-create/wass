import fs from "fs/promises";
import path from "path";
import { Nomination, Vote } from "../types";
import { NominationsStore, VotesStore } from "./adapter";
import { buildUniqueKeyFromUrl } from "../keys";
import { normalizeLinkedIn } from "../linkedin";
import { DuplicateError, InvalidLinkedInError } from "../errors";

// Simple mutex to prevent race conditions
const mutexes = new Map<string, Promise<any>>();

async function withMutex<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = mutexes.get(key);
  if (existing) {
    await existing;
  }
  
  const promise = fn();
  mutexes.set(key, promise);
  
  try {
    const result = await promise;
    mutexes.delete(key);
    return result;
  } catch (error) {
    mutexes.delete(key);
    throw error;
  }
}

export class LocalJsonNominationsStore implements NominationsStore {
  private filePath = path.join(process.cwd(), "data", "nominations.json");

  async list(): Promise<Nomination[]> {
    return withMutex("nominations", async () => {
      try {
        const data = await fs.readFile(this.filePath, "utf-8");
        const nominations = JSON.parse(data) as Nomination[];
        
        // Backfill and normalize for old records
        let needsUpdate = false;
        for (const nomination of nominations) {
          try {
            // Normalize LinkedIn URL if not already normalized
            const normalizedLinkedIn = normalizeLinkedIn(nomination.nominee.linkedin);
            if (nomination.nominee.linkedin !== normalizedLinkedIn) {
              nomination.nominee.linkedin = normalizedLinkedIn;
              needsUpdate = true;
            }
            
            // Compute uniqueKey if missing
            if (!nomination.uniqueKey) {
              nomination.uniqueKey = buildUniqueKeyFromUrl(nomination.category, nomination.nominee.linkedin);
              needsUpdate = true;
            }
          } catch (error) {
            console.warn(`Failed to normalize nomination ${nomination.id}:`, error);
          }
        }
        
        // Handle duplicates during migration
        const uniqueKeys = new Set<string>();
        const duplicates: Nomination[] = [];
        
        for (const nomination of nominations) {
          if (nomination.uniqueKey && uniqueKeys.has(nomination.uniqueKey)) {
            // Mark as duplicate
            if (nomination.status !== "rejected") {
              nomination.status = "rejected";
              nomination.moderatorNote = "Auto-rejected duplicate during migration";
              needsUpdate = true;
              duplicates.push(nomination);
            }
          } else if (nomination.uniqueKey) {
            uniqueKeys.add(nomination.uniqueKey);
          }
        }
        
        if (duplicates.length > 0) {
          console.log(`Migration: Auto-rejected ${duplicates.length} duplicate nominations`);
        }
        
        if (needsUpdate) {
          await fs.writeFile(this.filePath, JSON.stringify(nominations, null, 2));
        }
        
        return nominations;
      } catch (error) {
        if ((error as any).code === "ENOENT") {
          return [];
        }
        throw error;
      }
    });
  }

  async add(nomination: Nomination): Promise<void> {
    return withMutex("nominations", async () => {
      const nominations = await this.list();
      
      // Check for duplicates
      const existing = nominations.find(n => n.uniqueKey === nomination.uniqueKey);
      if (existing) {
        throw new DuplicateError({
          id: existing.id,
          status: existing.status,
          liveUrl: existing.liveUrl
        });
      }
      
      nominations.push(nomination);
      await fs.writeFile(this.filePath, JSON.stringify(nominations, null, 2));
    });
  }

  async findByUniqueKey(key: string): Promise<Nomination | undefined> {
    const nominations = await this.list();
    return nominations.find(n => n.uniqueKey === key);
  }

  async findById(id: string): Promise<Nomination | undefined> {
    const nominations = await this.list();
    return nominations.find(n => n.id === id);
  }

  async checkDuplicate(uniqueKey: string, excludeId?: string): Promise<Nomination | undefined> {
    const nominations = await this.list();
    return nominations.find(n => 
      n.uniqueKey === uniqueKey && 
      (!excludeId || n.id !== excludeId)
    );
  }

  async update(id: string, patch: Partial<Nomination>): Promise<void> {
    return withMutex("nominations", async () => {
      const nominations = await this.list();
      const index = nominations.findIndex(n => n.id === id);
      
      if (index === -1) {
        throw new Error("Nomination not found");
      }
      
      const current = nominations[index];
      const updated = { ...current, ...patch };
      
      // If we're updating category or linkedin, recompute uniqueKey and check for conflicts
      if (patch.category || (patch.nominee && 'linkedin' in patch.nominee)) {
        try {
          const newUniqueKey = buildUniqueKeyFromUrl(
            patch.category || current.category,
            (patch.nominee && 'linkedin' in patch.nominee) 
              ? patch.nominee.linkedin 
              : current.nominee.linkedin
          );
          
          // Check if another record has this uniqueKey
          const conflicting = nominations.find(n => 
            n.uniqueKey === newUniqueKey && n.id !== id
          );
          
          if (conflicting) {
            throw new DuplicateError({
              id: conflicting.id,
              status: conflicting.status,
              liveUrl: conflicting.liveUrl
            });
          }
          
          updated.uniqueKey = newUniqueKey;
        } catch (error) {
          if (error instanceof DuplicateError || error instanceof InvalidLinkedInError) {
            throw error;
          }
          throw new Error(`Failed to update unique key: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      nominations[index] = updated;
      await fs.writeFile(this.filePath, JSON.stringify(nominations, null, 2));
    });
  }
}

class LocalJsonVotesStore implements VotesStore {
  private filePath = path.join(process.cwd(), "data", "votes.json");

  async list(): Promise<Vote[]> {
    return withMutex("votes", async () => {
      try {
        const data = await fs.readFile(this.filePath, "utf-8");
        return JSON.parse(data) as Vote[];
      } catch (error) {
        if ((error as any).code === "ENOENT") {
          return [];
        }
        throw error;
      }
    });
  }

  async add(vote: Vote): Promise<void> {
    return withMutex("votes", async () => {
      const votes = await this.list();
      votes.push(vote);
      await fs.writeFile(this.filePath, JSON.stringify(votes, null, 2));
    });
  }

  async listByNominee(nomineeId: string): Promise<Vote[]> {
    const votes = await this.list();
    return votes.filter(v => v.nomineeId === nomineeId);
  }
}

export const nominationsStore = new LocalJsonNominationsStore();
export const votesStore = new LocalJsonVotesStore();