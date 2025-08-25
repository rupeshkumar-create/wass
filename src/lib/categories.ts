export type SubcatType = "person" | "company";
export type Region = "North America" | "Europe" | "Global";

export interface Subcategory {
  id: string;
  label: string;
  type: SubcatType;
  region?: Region;
}

export interface CategoryGroup {
  id: string;
  label: string;
  subcategories: Subcategory[];
}

export const CATEGORY_TREE: CategoryGroup[] = [
  {
    id: "role-specific",
    label: "Role-Specific Categories",
    subcategories: [
      { id: "top-recruiter", label: "Top Recruiter", type: "person" },
      { id: "top-executive-leader", label: "Top Executive Leader (CEO/COO/CMO/CRO)", type: "person" },
    ],
  },
  {
    id: "innovation-tech",
    label: "Innovation & Tech Categories",
    subcategories: [
      { id: "top-ai-driven-staffing-platform", label: "Top AI-Driven Staffing Platform", type: "company" },
      { id: "top-digital-experience-for-clients", label: "Top Digital Experience for Clients", type: "company" },
    ],
  },
  {
    id: "company-culture-impact",
    label: "Company Culture & Impact",
    subcategories: [
      { id: "top-women-led-staffing-firm", label: "Top Women-Led Staffing Firm", type: "company" },
    ],
  },
  {
    id: "growth-performance",
    label: "Growth & Performance Categories",
    subcategories: [
      { id: "fastest-growing-staffing-firm", label: "Fastest Growing Staffing Firm", type: "company" },
    ],
  },
  {
    id: "thought-leadership",
    label: "Thought Leadership & Influence",
    subcategories: [
      { id: "top-staffing-influencer", label: "Top Staffing Influencer (LinkedIn/X/Blogs)", type: "person" },
      { id: "best-staffing-podcast-or-show", label: "Best Staffing Podcast or Show", type: "company" },
      { id: "top-thought-leader", label: "Top Thought Leader – Recruitment & Staffing", type: "person" },
      { id: "top-staffing-educator", label: "Top Staffing Educator or Coach", type: "person" },
    ],
  },
  {
    id: "special-recognition",
    label: "Special Recognition",
    subcategories: [
      { id: "rising-star-under-30", label: "Rising Star – Under 30", type: "person" },
    ],
  },
  {
    id: "geographic",
    label: "Geographic Categories",
    subcategories: [
      { id: "top-staffing-company-usa", label: "Top Staffing Company – USA", type: "company", region: "North America" },
      { id: "top-recruiting-leader-usa", label: "Top Recruiting Leader – USA", type: "person", region: "North America" },
      { id: "top-recruiter-usa", label: "Top Recruiter – USA", type: "person", region: "North America" },
      { id: "top-ai-driven-platform-usa", label: "Top AI-Driven Staffing Platform – USA", type: "company", region: "North America" },
      { id: "top-staffing-company-europe", label: "Top Staffing Company – Europe", type: "company", region: "Europe" },
      { id: "top-recruiting-leader-europe", label: "Top Recruiting Leader – Europe", type: "person", region: "Europe" },
      { id: "top-recruiter-europe", label: "Top Recruiter – Europe", type: "person", region: "Europe" },
      { id: "top-ai-driven-platform-europe", label: "Top AI-Driven Staffing Platform – Europe", type: "company", region: "Europe" },
      { id: "top-global-staffing-company", label: "Top Global Staffing Company", type: "company", region: "Global" },
      { id: "top-global-recruiter", label: "Top Global Recruiter", type: "person", region: "Global" },
      { id: "top-global-staffing-leader", label: "Top Global Staffing Leader", type: "person", region: "Global" },
    ],
  },
] as const;

// Helper functions for working with categories
export function getAllSubcategories(): Subcategory[] {
  return CATEGORY_TREE.flatMap(group => group.subcategories);
}

export function getSubcategoryById(id: string): Subcategory | undefined {
  return getAllSubcategories().find(sub => sub.id === id);
}

export function getSubcategoriesByType(type: SubcatType): Subcategory[] {
  return getAllSubcategories().filter(sub => sub.type === type);
}

export function getSubcategoriesByRegion(region: Region): Subcategory[] {
  return getAllSubcategories().filter(sub => sub.region === region);
}

export function getCategoryGroupById(id: string): CategoryGroup | undefined {
  return CATEGORY_TREE.find(group => group.id === id);
}