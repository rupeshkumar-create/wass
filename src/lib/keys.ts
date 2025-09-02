import { normalizeLinkedIn } from "./linkedin";

export const buildUniqueKey = (category: string, normalizedLinkedIn: string) =>
  `${category.toLowerCase()}__${normalizedLinkedIn}`;

// Helper that normalizes first
export const buildUniqueKeyFromUrl = (category: string, linkedinUrl: string) => {
  const normalizedUrl = normalizeLinkedIn(linkedinUrl);
  return buildUniqueKey(category, normalizedUrl);
};