import { Nomination, Vote } from "../types";

export interface NominationsStore {
  list(): Promise<Nomination[]>;
  add(n: Nomination): Promise<void>;
  findByUniqueKey(key: string): Promise<Nomination | undefined>;
  findById(id: string): Promise<Nomination | undefined>;
  update(id: string, patch: Partial<Nomination>): Promise<void>;
  checkDuplicate(uniqueKey: string, excludeId?: string): Promise<Nomination | undefined>;
}

export interface VotesStore {
  list(): Promise<Vote[]>;
  add(v: Vote): Promise<void>;
  listByNominee(nomineeId: string): Promise<Vote[]>;
}