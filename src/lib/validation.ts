import { z } from "zod";
import { MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES, Category } from "./constants";

// Business email validation - blocks common personal email domains
const PERSONAL_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
  'icloud.com', 'me.com', 'mac.com', 'live.com', 'msn.com',
  'ymail.com', 'rocketmail.com', 'protonmail.com', 'tutanota.com',
  'mail.com', 'gmx.com', 'zoho.com', 'fastmail.com'
];

export const BusinessEmailSchema = z
  .string()
  .email("Please enter a valid email address")
  .refine((email) => {
    const domain = email.split('@')[1]?.toLowerCase();
    return domain && !PERSONAL_EMAIL_DOMAINS.includes(domain);
  }, "Please use a business email address. Personal email domains (Gmail, Yahoo, etc.) are not allowed");

// LinkedIn URL validation and normalization
export const LinkedInSchema = z
  .string()
  .min(1, "LinkedIn URL is required")
  .refine((url) => {
    try {
      const { normalizeLinkedIn } = require("./linkedin");
      normalizeLinkedIn(url);
      return true;
    } catch (error) {
      return false;
    }
  }, "Please enter a valid LinkedIn URL (e.g., https://www.linkedin.com/in/username)")
  .transform((url) => {
    try {
      const { normalizeLinkedIn } = require("./linkedin");
      return normalizeLinkedIn(url);
    } catch (error) {
      // This shouldn't happen if refine passed, but fallback
      return url;
    }
  });

// File validation
// Image URL validation (for Supabase Storage URLs and relative paths)
export const ImageUrlSchema = z
  .string()
  .refine((url) => {
    // Allow relative URLs starting with /
    if (url.startsWith('/')) return true;
    // Allow full URLs
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, "Please provide a valid image URL")
  .optional();

// Legacy file validation (for backward compatibility)
export const FileSchema = z
  .string()
  .refine((base64) => {
    if (!base64) return false;
    try {
      // Extract the base64 data part
      const base64Data = base64.split(",")[1];
      const sizeInBytes = (base64Data.length * 3) / 4;
      return sizeInBytes <= MAX_FILE_SIZE;
    } catch {
      return false;
    }
  }, `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
  .refine((base64) => {
    if (!base64) return false;
    const mimeType = base64.split(",")[0].split(":")[1].split(";")[0];
    return ALLOWED_IMAGE_TYPES.includes(mimeType);
  }, "File must be a valid image (JPG, PNG, or SVG)");

// Nominator schema
export const NominatorSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: BusinessEmailSchema,
  linkedin: LinkedInSchema,
  // Legacy support for existing data
  name: z.string().optional(),
});

// Person nominee schema
export const NomineePersonSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: BusinessEmailSchema,
  title: z.string().min(1, "Job title is required"),
  country: z.string().min(1, "Country is required"),
  linkedin: LinkedInSchema,
  imageUrl: z.string().min(1, "Professional headshot is required"),
  whyVoteForMe: z.string().min(1, "Please explain why someone should vote for this nominee").max(1000, "Please keep your response under 1000 characters"),
  // Legacy support
  name: z.string().optional(), // Computed from firstName + lastName
  headshotBase64: FileSchema.optional(),
});

// Company nominee schema
export const NomineeCompanySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  website: z.string().url("Please enter a valid website URL"),
  country: z.string().min(1, "Country is required"),
  linkedin: LinkedInSchema,
  imageUrl: z.string().min(1, "Company logo is required"),
  whyVoteForMe: z.string().min(1, "Please explain why someone should vote for this company").max(1000, "Please keep your response under 1000 characters"),
  // Legacy support
  logoBase64: FileSchema.optional(),
});

// Full nomination schemas
export const NominationPersonSchema = z.object({
  category: z.string() as z.ZodType<Category>,
  nominator: NominatorSchema,
  nominee: NomineePersonSchema,
});

export const NominationCompanySchema = z.object({
  category: z.string() as z.ZodType<Category>,
  nominator: NominatorSchema,
  nominee: NomineeCompanySchema,
});

// Voter schema
export const VoterSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: BusinessEmailSchema,
  linkedin: LinkedInSchema,
});

// Vote schema
export const VoteSchema = z.object({
  nomineeId: z.string().min(1, "Nominee ID is required"),
  category: z.string() as z.ZodType<Category>,
  voter: VoterSchema,
});

// Export types
export type NominatorData = z.infer<typeof NominatorSchema>;
export type NomineePersonData = z.infer<typeof NomineePersonSchema>;
export type NomineeCompanyData = z.infer<typeof NomineeCompanySchema>;
export type NominationPersonData = z.infer<typeof NominationPersonSchema>;
export type NominationCompanyData = z.infer<typeof NominationCompanySchema>;
export type VoterData = z.infer<typeof VoterSchema>;
export type VoteData = z.infer<typeof VoteSchema>;