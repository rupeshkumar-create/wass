import { Category, CategoryType } from "./constants";

export type Nominator = {
  name: string;
  email: string;
  phone?: string;
};

export type NomineePerson = {
  firstName: string;
  lastName: string;
  name?: string; // Legacy support - computed from firstName + lastName
  email: string;
  title?: string;
  country?: string;
  linkedin: string;
  imageUrl?: string;
  whyVoteForMe?: string;
  // Legacy support
  headshotBase64?: string;
};

export type NomineeCompany = {
  name: string;
  website: string;
  country?: string;
  linkedin: string;
  imageUrl?: string;
  whyVoteForMe?: string;
  // Legacy support
  logoBase64?: string;
};

export type Nomination = {
  id: string;
  category: Category;
  type: CategoryType;
  nominator: Nominator;
  nominee: NomineePerson | NomineeCompany;
  liveUrl: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  uniqueKey: string;
  moderatedAt?: string;
  moderatedBy?: string;
  moderatorNote?: string;
  imageUrl?: string;
  whyVoteForMe?: string;
};

export type Voter = {
  firstName: string;
  lastName: string;
  email: string;
  linkedin: string;
};

export type Vote = {
  nomineeId: string;
  category: Category;
  voter: Voter;
  ip: string;
  ua: string;
  ts: string;
};

// Extended type for API responses that include vote counts
export type NominationWithVotes = Nomination & {
  votes: number;
};