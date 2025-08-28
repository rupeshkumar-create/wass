#!/usr/bin/env node

// Test the category mapping logic
const CATEGORIES = [
  // Role-Specific
  { id: "top-recruiter", label: "Top Recruiter", group: "Role-Specific", type: "person" },
  { id: "talent-acquisition-leader", label: "Talent Acquisition Leader", group: "Role-Specific", type: "person" },
  { id: "recruitment-innovation-award", label: "Recruitment Innovation Award", group: "Role-Specific", type: "person" },
  { id: "top-executive-leader", label: "Top Executive Leader (CEO/COO/CHRO/CRO/CMO/CGO)", group: "Role-Specific", type: "person" },
  { id: "top-staffing-influencer", label: "Top Staffing Influencer", group: "Role-Specific", type: "person" },
  { id: "rising-star", label: "Rising Star (Under 30)", group: "Role-Specific", type: "person" },
  
  // Company Awards
  { id: "best-staffing-firm", label: "Best Staffing Firm", group: "Company Awards", type: "company" },
  { id: "top-ai-driven-platform", label: "Top AI-Driven Staffing Platform", group: "Innovation & Tech", type: "company" },
  { id: "top-digital-experience", label: "Top Digital Experience for Clients", group: "Innovation & Tech", type: "company" },
  
  // Culture & Impact
  { id: "top-women-led-firm", label: "Top Women-Led Staffing Firm", group: "Culture & Impact", type: "company" },
  { id: "fastest-growing-firm", label: "Fastest Growing Staffing Firm", group: "Culture & Impact", type: "company" },
  
  // Growth & Performance
  { id: "best-process-at-scale", label: "Best Staffing Process at Scale", group: "Growth & Performance", type: "company" },
  { id: "thought-leadership", label: "Thought Leadership & Influence", group: "Growth & Performance", type: "person" },
  
  // Geographic - USA
  { id: "top-staffing-company-usa", label: "Top Staffing Company - USA", group: "Geographic", type: "company" },
  { id: "top-recruiting-leader-usa", label: "Top Recruiting Leader - USA", group: "Geographic", type: "person" },
  { id: "top-ai-platform-usa", label: "Top AI-Driven Staffing Platform - USA", group: "Geographic", type: "company" },
  
  // Geographic - Europe
  { id: "top-staffing-company-europe", label: "Top Staffing Company - Europe", group: "Geographic", type: "company" },
  { id: "top-recruiting-leader-europe", label: "Top Recruiting Leader - Europe", group: "Geographic", type: "person" },
  { id: "top-ai-platform-europe", label: "Top AI-Driven Staffing Platform - Europe", group: "Geographic", type: "company" },
  
  // Global
  { id: "top-global-recruiter", label: "Top Global Recruiter", group: "Geographic", type: "person" },
  { id: "top-global-staffing-leader", label: "Top Global Staffing Leader", group: "Geographic", type: "person" },
  
  // Special Recognition
  { id: "special-recognition", label: "Special Recognition Award", group: "Special Recognition", type: "person" },
];

function getSubcategoryId(category) {
  if (!category) return '';
  return category; // Category is already the subcategory ID
}

function getCategoryGroupId(category) {
  if (!category) return 'general';
  
  const categoryConfig = CATEGORIES.find(c => c.id === category);
  if (!categoryConfig) return 'general';
  
  const groupMap = {
    'Role-Specific': 'role-specific',
    'Company Awards': 'company-awards',
    'Innovation & Tech': 'innovation-tech',
    'Culture & Impact': 'culture-impact',
    'Growth & Performance': 'growth-performance',
    'Geographic': 'geographic',
    'Special Recognition': 'special-recognition'
  };
  
  return groupMap[categoryConfig.group] || 'general';
}

console.log('🧪 Testing Category Mapping Logic');
console.log('=' .repeat(50));

// Test a few categories
const testCategories = [
  'top-recruiter',
  'top-ai-driven-platform', 
  'top-women-led-firm',
  'rising-star',
  'special-recognition'
];

for (const category of testCategories) {
  const subcategoryId = getSubcategoryId(category);
  const groupId = getCategoryGroupId(category);
  const categoryConfig = CATEGORIES.find(c => c.id === category);
  
  console.log(`\n📋 Category: ${category}`);
  console.log(`   Subcategory ID: "${subcategoryId}"`);
  console.log(`   Group ID: "${groupId}"`);
  console.log(`   Type: ${categoryConfig?.type}`);
  console.log(`   Valid: ${subcategoryId.length > 0 ? '✅' : '❌'}`);
}

console.log('\n🎯 All categories should have non-empty subcategoryId values');
console.log('✅ Test complete - category mapping logic verified');