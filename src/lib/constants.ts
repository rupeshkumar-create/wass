export type CategoryType = "person" | "company";

export type Category =
  | "Top Recruiter"
  | "Top Executive Leader"
  | "Top Staffing Influencer"
  | "Rising Star (Under 30)"
  | "Top AI-Driven Staffing Platform"
  | "Top Digital Experience for Clients"
  | "Top Women-Led Staffing Firm"
  | "Fastest Growing Staffing Firm"
  | "Best Staffing Process at Scale"
  | "Thought Leadership & Influence"
  | "Top Staffing Company - USA"
  | "Top Recruiting Leader - USA"
  | "Top AI-Driven Staffing Platform - USA"
  | "Top Staffing Company - Europe"
  | "Top Recruiting Leader - Europe"
  | "Top AI-Driven Staffing Platform - Europe"
  | "Top Global Recruiter"
  | "Top Global Staffing Leader"
  | "Special Recognition";

export interface CategoryConfig {
  id: Category;
  label: string;
  group: string;
  type: CategoryType;
}

export const CATEGORIES: CategoryConfig[] = [
  // Role-Specific
  { id: "Top Recruiter", label: "Top Recruiter", group: "Role-Specific", type: "person" },
  { id: "Top Executive Leader", label: "Top Executive Leader (CEO/COO/CHRO/CRO/CMO/CGO)", group: "Role-Specific", type: "person" },
  { id: "Top Staffing Influencer", label: "Top Staffing Influencer", group: "Role-Specific", type: "person" },
  { id: "Rising Star (Under 30)", label: "Rising Star (Under 30)", group: "Role-Specific", type: "person" },
  
  // Innovation & Tech
  { id: "Top AI-Driven Staffing Platform", label: "Top AI-Driven Staffing Platform", group: "Innovation & Tech", type: "company" },
  { id: "Top Digital Experience for Clients", label: "Top Digital Experience for Clients", group: "Innovation & Tech", type: "company" },
  
  // Culture & Impact
  { id: "Top Women-Led Staffing Firm", label: "Top Women-Led Staffing Firm", group: "Culture & Impact", type: "company" },
  { id: "Fastest Growing Staffing Firm", label: "Fastest Growing Staffing Firm", group: "Culture & Impact", type: "company" },
  
  // Growth & Performance
  { id: "Best Staffing Process at Scale", label: "Best Staffing Process at Scale", group: "Growth & Performance", type: "company" },
  { id: "Thought Leadership & Influence", label: "Thought Leadership & Influence", group: "Growth & Performance", type: "person" },
  
  // Geographic - USA
  { id: "Top Staffing Company - USA", label: "Top Staffing Company - USA", group: "Geographic", type: "company" },
  { id: "Top Recruiting Leader - USA", label: "Top Recruiting Leader - USA", group: "Geographic", type: "person" },
  { id: "Top AI-Driven Staffing Platform - USA", label: "Top AI-Driven Staffing Platform - USA", group: "Geographic", type: "company" },
  
  // Geographic - Europe
  { id: "Top Staffing Company - Europe", label: "Top Staffing Company - Europe", group: "Geographic", type: "company" },
  { id: "Top Recruiting Leader - Europe", label: "Top Recruiting Leader - Europe", group: "Geographic", type: "person" },
  { id: "Top AI-Driven Staffing Platform - Europe", label: "Top AI-Driven Staffing Platform - Europe", group: "Geographic", type: "company" },
  
  // Global
  { id: "Top Global Recruiter", label: "Top Global Recruiter", group: "Geographic", type: "person" },
  { id: "Top Global Staffing Leader", label: "Top Global Staffing Leader", group: "Geographic", type: "person" },
  
  // Special Recognition
  { id: "Special Recognition", label: "Special Recognition Award", group: "Special Recognition", type: "person" },
];

// Free email domains to block
export const FREE_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "aol.com",
  "icloud.com",
  "protonmail.com",
  "proton.me",
  "gmx.com",
  "yandex.com",
  "zoho.com",
  "mail.com",
];

// Admin passcode (change this for production)
export const ADMIN_PASSCODE = "WSA2026";

// File upload limits
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/svg+xml"];