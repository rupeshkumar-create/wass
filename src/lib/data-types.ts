import { z } from "zod";

// Base schemas
export const PersonNomineeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  title: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  linkedin: z.string().url("Valid LinkedIn URL required"),
  imageUrl: z.string().url().optional().nullable(),
  whyVoteForMe: z.string().optional(),
});

export const CompanyNomineeSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  website: z.string().url("Valid website URL required"),
  country: z.string().min(1, "Country is required"),
  linkedin: z.string().url("Valid LinkedIn URL required"),
  imageUrl: z.string().url().optional().nullable(),
  whyVoteForMe: z.string().optional(),
});

export const NominatorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  company: z.string().min(1, "Company is required"),
  linkedin: z.string().url("Valid LinkedIn URL required"),
});

export const CompanyInfoSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  website: z.string().url("Valid website URL required"),
  country: z.string().min(1, "Country is required"),
});

// Main nomination schemas
export const PersonNominationSchema = z.object({
  id: z.string(),
  category: z.string(),
  type: z.literal("person"),
  nominee: PersonNomineeSchema,
  company: CompanyInfoSchema,
  nominator: NominatorSchema,
  whyNominated: z.string().min(1, "Reason for nomination is required"),
  whyVoteForMe: z.string().optional(),
  liveUrl: z.string(),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  uniqueKey: z.string(),
  imageUrl: z.string().url().optional().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  moderatedAt: z.string().optional(),
  moderatorNote: z.string().optional(),
});

export const CompanyNominationSchema = z.object({
  id: z.string(),
  category: z.string(),
  type: z.literal("company"),
  nominee: CompanyNomineeSchema,
  nominator: NominatorSchema,
  whyNominated: z.string().min(1, "Reason for nomination is required"),
  whyVoteForMe: z.string().optional(),
  liveUrl: z.string(),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  uniqueKey: z.string(),
  imageUrl: z.string().url().optional().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  moderatedAt: z.string().optional(),
  moderatorNote: z.string().optional(),
});

export const NominationSchema = z.union([PersonNominationSchema, CompanyNominationSchema]);

// Vote schema
export const VoterSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email required"),
  company: z.string().min(1, "Company is required"),
  linkedin: z.string().url("Valid LinkedIn URL required"),
});

export const VoteSchema = z.object({
  id: z.string(),
  nomineeId: z.string(),
  category: z.string(),
  voter: VoterSchema,
  createdAt: z.string(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

// Type exports
export type PersonNominee = z.infer<typeof PersonNomineeSchema>;
export type CompanyNominee = z.infer<typeof CompanyNomineeSchema>;
export type Nominator = z.infer<typeof NominatorSchema>;
export type CompanyInfo = z.infer<typeof CompanyInfoSchema>;
export type PersonNomination = z.infer<typeof PersonNominationSchema>;
export type CompanyNomination = z.infer<typeof CompanyNominationSchema>;
export type Nomination = z.infer<typeof NominationSchema>;
export type Voter = z.infer<typeof VoterSchema>;
export type Vote = z.infer<typeof VoteSchema>;

// Form input schemas (for validation before submission)
export const PersonNominationInputSchema = z.object({
  category: z.string().min(1, "Category is required"),
  nominee: PersonNomineeSchema,
  company: CompanyInfoSchema,
  nominator: NominatorSchema,
  whyNominated: z.string().min(1, "Reason for nomination is required"),
});

export const CompanyNominationInputSchema = z.object({
  category: z.string().min(1, "Category is required"),
  nominee: CompanyNomineeSchema,
  nominator: NominatorSchema,
  whyNominated: z.string().min(1, "Reason for nomination is required"),
});

export const VoteInputSchema = z.object({
  nomineeId: z.string().min(1, "Nominee ID is required"),
  category: z.string().min(1, "Category is required"),
  voter: VoterSchema,
});

export type PersonNominationInput = z.infer<typeof PersonNominationInputSchema>;
export type CompanyNominationInput = z.infer<typeof CompanyNominationInputSchema>;
export type VoteInput = z.infer<typeof VoteInputSchema>;

// Status and filter types
export type NominationStatus = "pending" | "approved" | "rejected";
export type NominationType = "person" | "company";

// Database record types (with timestamps as Date objects for IndexedDB)
export interface NominationRecord extends Omit<Nomination, 'createdAt' | 'updatedAt' | 'moderatedAt'> {
  createdAt: Date;
  updatedAt?: Date;
  moderatedAt?: Date;
}

export interface VoteRecord extends Omit<Vote, 'createdAt'> {
  createdAt: Date;
}