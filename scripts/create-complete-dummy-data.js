#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// All 23 categories from constants.ts
const ALL_CATEGORIES = [
  // Role-Specific (6 categories - all person)
  { id: "top-recruiter", label: "Top Recruiter", group: "Role-Specific", type: "person" },
  { id: "talent-acquisition-leader", label: "Talent Acquisition Leader", group: "Role-Specific", type: "person" },
  { id: "recruitment-innovation-award", label: "Recruitment Innovation Award", group: "Role-Specific", type: "person" },
  { id: "top-executive-leader", label: "Top Executive Leader (CEO/COO/CHRO/CRO/CMO/CGO)", group: "Role-Specific", type: "person" },
  { id: "top-staffing-influencer", label: "Top Staffing Influencer", group: "Role-Specific", type: "person" },
  { id: "rising-star", label: "Rising Star (Under 30)", group: "Role-Specific", type: "person" },
  
  // Company Awards (1 category)
  { id: "best-staffing-firm", label: "Best Staffing Firm", group: "Company Awards", type: "company" },
  
  // Innovation & Tech (2 categories - all company)
  { id: "top-ai-driven-platform", label: "Top AI-Driven Staffing Platform", group: "Innovation & Tech", type: "company" },
  { id: "top-digital-experience", label: "Top Digital Experience for Clients", group: "Innovation & Tech", type: "company" },
  
  // Culture & Impact (2 categories - all company)
  { id: "top-women-led-firm", label: "Top Women-Led Staffing Firm", group: "Culture & Impact", type: "company" },
  { id: "fastest-growing-firm", label: "Fastest Growing Staffing Firm", group: "Culture & Impact", type: "company" },
  
  // Growth & Performance (2 categories)
  { id: "best-process-at-scale", label: "Best Staffing Process at Scale", group: "Growth & Performance", type: "company" },
  { id: "thought-leadership", label: "Thought Leadership & Influence", group: "Growth & Performance", type: "person" },
  
  // Geographic - USA (3 categories)
  { id: "top-staffing-company-usa", label: "Top Staffing Company - USA", group: "Geographic", type: "company" },
  { id: "top-recruiting-leader-usa", label: "Top Recruiting Leader - USA", group: "Geographic", type: "person" },
  { id: "top-ai-platform-usa", label: "Top AI-Driven Staffing Platform - USA", group: "Geographic", type: "company" },
  
  // Geographic - Europe (3 categories)
  { id: "top-staffing-company-europe", label: "Top Staffing Company - Europe", group: "Geographic", type: "company" },
  { id: "top-recruiting-leader-europe", label: "Top Recruiting Leader - Europe", group: "Geographic", type: "person" },
  { id: "top-ai-platform-europe", label: "Top AI-Driven Staffing Platform - Europe", group: "Geographic", type: "company" },
  
  // Global (2 categories - all person)
  { id: "top-global-recruiter", label: "Top Global Recruiter", group: "Geographic", type: "person" },
  { id: "top-global-staffing-leader", label: "Top Global Staffing Leader", group: "Geographic", type: "person" },
  
  // Special Recognition (1 category)
  { id: "special-recognition", label: "Special Recognition Award", group: "Special Recognition", type: "person" },
];

// Generate color for avatars
const avatarColors = [
  '3B82F6', '10B981', '8B5CF6', 'EF4444', 'F59E0B', '6366F1', 
  'EC4899', '14B8A6', '84CC16', 'F97316', 'A855F7', '06B6D4',
  'EAB308', 'DC2626', '059669', '7C3AED', 'DB2777', '0891B2'
];

// Comprehensive nominee data for each category
const nomineeData = {
  // Role-Specific Categories
  "top-recruiter": [
    {
      firstname: 'Alexandra', lastname: 'Thompson', email: 'alexandra@techcorp.com',
      title: 'Senior Technical Recruiter', linkedin: 'https://linkedin.com/in/alexandrathompson',
      why: 'Consistently achieved 95% placement success rate in technical roles with expertise in AI, blockchain, and cloud technologies. Built a network of 10,000+ tech professionals.',
      slug: 'alexandra-thompson-top-recruiter'
    },
    {
      firstname: 'Michael', lastname: 'Rodriguez', email: 'michael@innovaterecruit.com',
      title: 'Principal Recruiter', linkedin: 'https://linkedin.com/in/michaelrodriguez',
      why: 'Pioneered remote recruitment strategies during COVID-19. Placed 500+ candidates in Fortune 500 companies with 98% retention rate.',
      slug: 'michael-rodriguez-top-recruiter'
    },
    {
      firstname: 'Sarah', lastname: 'Chen', email: 'sarah@talentbridge.com',
      title: 'Executive Recruiter', linkedin: 'https://linkedin.com/in/sarahchen',
      why: 'Specialist in C-suite recruitment with 15 years experience. Successfully placed 200+ executives across healthcare and finance sectors.',
      slug: 'sarah-chen-top-recruiter'
    }
  ],

  "talent-acquisition-leader": [
    {
      firstname: 'David', lastname: 'Wilson', email: 'david@hrtech.com',
      title: 'VP of Talent Acquisition', linkedin: 'https://linkedin.com/in/davidwilson',
      why: 'Transformed talent acquisition at 3 Fortune 100 companies. Reduced time-to-hire by 60% while improving candidate quality scores by 40%.',
      slug: 'david-wilson-talent-acquisition-leader'
    },
    {
      firstname: 'Jennifer', lastname: 'Park', email: 'jennifer@globaltalent.com',
      title: 'Chief Talent Officer', linkedin: 'https://linkedin.com/in/jenniferpark',
      why: 'Built talent acquisition teams from scratch in 5 countries. Expert in scaling recruitment operations for hypergrowth companies.',
      slug: 'jennifer-park-talent-acquisition-leader'
    }
  ],

  "recruitment-innovation-award": [
    {
      firstname: 'Dr. James', lastname: 'Foster', email: 'james@innovaterecruit.com',
      title: 'Head of Recruitment Innovation', linkedin: 'https://linkedin.com/in/jamesfoster',
      why: 'PhD in Computer Science. Developed AI-powered candidate matching algorithm adopted by 100+ companies. 15 patents in recruitment technology.',
      slug: 'james-foster-recruitment-innovation'
    },
    {
      firstname: 'Lisa', lastname: 'Kumar', email: 'lisa@techrecruit.com',
      title: 'Innovation Director', linkedin: 'https://linkedin.com/in/lisakumar',
      why: 'Created VR-based candidate assessment platform. Pioneered blockchain-verified credentials system used by 50+ enterprises.',
      slug: 'lisa-kumar-recruitment-innovation'
    }
  ],

  "top-executive-leader": [
    {
      firstname: 'Marcus', lastname: 'Johnson', email: 'marcus@innovatestaff.com',
      title: 'CEO & Founder', linkedin: 'https://linkedin.com/in/marcusjohnson',
      why: 'Transformed the staffing industry by pioneering AI-driven matching algorithms. Grew company from startup to $50M revenue in 5 years.',
      slug: 'marcus-johnson-executive-leader'
    },
    {
      firstname: 'Rachel', lastname: 'Martinez', email: 'rachel@globalstaffing.com',
      title: 'Chief Operating Officer', linkedin: 'https://linkedin.com/in/rachelmartinez',
      why: 'Led operational excellence initiatives across 25 countries. Achieved 99.5% client satisfaction while scaling to $200M revenue.',
      slug: 'rachel-martinez-executive-leader'
    }
  ],

  "top-staffing-influencer": [
    {
      firstname: 'Priya', lastname: 'Patel', email: 'priya@talentbridge.com',
      title: 'Chief Technology Officer', linkedin: 'https://linkedin.com/in/priyapatel',
      why: 'Leading voice in HR technology with 500K+ LinkedIn followers. Keynote speaker at 50+ industry conferences. Author of "The Future of Recruitment".',
      slug: 'priya-patel-staffing-influencer'
    },
    {
      firstname: 'Robert', lastname: 'Kim', email: 'robert@hrinfluencer.com',
      title: 'Industry Thought Leader', linkedin: 'https://linkedin.com/in/robertkim',
      why: 'Host of top-rated HR podcast with 1M+ downloads. LinkedIn Top Voice for 3 consecutive years. Mentored 1000+ HR professionals.',
      slug: 'robert-kim-staffing-influencer'
    }
  ],

  "rising-star": [
    {
      firstname: 'Jordan', lastname: 'Taylor', email: 'jordan@nextgenrecruit.com',
      title: 'VP of Talent Acquisition', linkedin: 'https://linkedin.com/in/jordantaylor',
      why: 'At 28, revolutionized talent acquisition at Fortune 500 company. Implemented diversity hiring program that increased underrepresented hires by 300%.',
      slug: 'jordan-taylor-rising-star'
    },
    {
      firstname: 'Maya', lastname: 'Singh', email: 'maya@youngtalent.com',
      title: 'Senior Recruitment Manager', linkedin: 'https://linkedin.com/in/mayasingh',
      why: 'At 26, built recruitment team that placed 1000+ candidates. Created innovative campus recruitment program adopted by 20+ universities.',
      slug: 'maya-singh-rising-star'
    }
  ],

  "thought-leadership": [
    {
      firstname: 'Dr. Rachel', lastname: 'Foster', email: 'rachel@globaltalent.com',
      title: 'Chief People Officer', linkedin: 'https://linkedin.com/in/rachelfoster',
      why: 'PhD in Organizational Psychology. Pioneered evidence-based recruitment methodologies adopted by 1000+ companies globally.',
      slug: 'rachel-foster-thought-leader'
    },
    {
      firstname: 'Professor Alan', lastname: 'Davis', email: 'alan@hrresearch.com',
      title: 'Director of HR Research', linkedin: 'https://linkedin.com/in/alandavis',
      why: 'Published 50+ research papers on talent acquisition. TEDx speaker with 2M+ views. Advisor to Fortune 100 CHROs.',
      slug: 'alan-davis-thought-leader'
    }
  ],

  "top-recruiting-leader-usa": [
    {
      firstname: 'Carlos', lastname: 'Mendoza', email: 'carlos@usastaffing.com',
      title: 'National Recruitment Director', linkedin: 'https://linkedin.com/in/carlosmendoza',
      why: 'Built the largest healthcare staffing network in the USA. Placed 50,000+ healthcare professionals during COVID-19 pandemic.',
      slug: 'carlos-mendoza-usa-leader'
    },
    {
      firstname: 'Amanda', lastname: 'Johnson', email: 'amanda@americantalent.com',
      title: 'Regional VP - Americas', linkedin: 'https://linkedin.com/in/amandajohnson',
      why: 'Manages recruitment operations across all 50 US states. Built partnerships with 500+ universities for campus recruitment.',
      slug: 'amanda-johnson-usa-leader'
    }
  ],

  "top-recruiting-leader-europe": [
    {
      firstname: 'Elena', lastname: 'Kowalski', email: 'elena@europeantalent.com',
      title: 'Regional Director Europe', linkedin: 'https://linkedin.com/in/elenakowalski',
      why: 'Fluent in 7 languages. Established recruitment operations across 15 European countries. Expert in cross-cultural talent acquisition.',
      slug: 'elena-kowalski-europe-leader'
    },
    {
      firstname: 'Hans', lastname: 'Mueller', email: 'hans@eurostaffing.com',
      title: 'European Operations Director', linkedin: 'https://linkedin.com/in/hansmueller',
      why: 'Led European expansion for 3 major staffing firms. Expert in EU employment law and compliance across 27 countries.',
      slug: 'hans-mueller-europe-leader'
    }
  ],

  "top-global-recruiter": [
    {
      firstname: 'Raj', lastname: 'Sharma', email: 'raj@globalrecruit.com',
      title: 'Global Head of Recruitment', linkedin: 'https://linkedin.com/in/rajsharma',
      why: 'Manages recruitment operations across 40 countries. Built global talent pipeline of 1M+ candidates. Expert in remote workforce solutions.',
      slug: 'raj-sharma-global-recruiter'
    },
    {
      firstname: 'Yuki', lastname: 'Tanaka', email: 'yuki@worldwidetalent.com',
      title: 'International Recruitment Director', linkedin: 'https://linkedin.com/in/yukitanaka',
      why: 'Pioneered Asia-Pacific recruitment strategies. Speaks 5 languages. Placed executives in 25+ countries across 6 continents.',
      slug: 'yuki-tanaka-global-recruiter'
    }
  ],

  "top-global-staffing-leader": [
    {
      firstname: 'Isabella', lastname: 'Rodriguez', email: 'isabella@globalstaffleader.com',
      title: 'Global Staffing Director', linkedin: 'https://linkedin.com/in/isabellarodriguez',
      why: 'Transformed global staffing operations for Fortune 10 company. Manages 10,000+ contractors across 50 countries.',
      slug: 'isabella-rodriguez-global-leader'
    },
    {
      firstname: 'Ahmed', lastname: 'Hassan', email: 'ahmed@worldstaffing.com',
      title: 'Chief Global Officer', linkedin: 'https://linkedin.com/in/ahmedhassan',
      why: 'Built staffing infrastructure in emerging markets. Expert in global compliance and workforce management across 6 continents.',
      slug: 'ahmed-hassan-global-leader'
    }
  ],

  "special-recognition": [
    {
      firstname: 'Dr. Maria', lastname: 'Gonzalez', email: 'maria@specialrecognition.com',
      title: 'Diversity & Inclusion Director', linkedin: 'https://linkedin.com/in/mariagonzalez',
      why: 'Pioneered inclusive recruitment practices that became industry standard. Increased diversity hiring by 400% across 100+ companies.',
      slug: 'maria-gonzalez-special-recognition'
    },
    {
      firstname: 'Captain James', lastname: 'Mitchell', email: 'james@veteranstaffing.com',
      title: 'Veterans Placement Specialist', linkedin: 'https://linkedin.com/in/jamesmitchell',
      why: 'Military veteran who placed 10,000+ veterans in civilian careers. Founded non-profit that achieved 95% veteran employment success rate.',
      slug: 'james-mitchell-special-recognition'
    }
  ]
};

// Company nominee data
const companyData = {
  "best-staffing-firm": [
    {
      name: 'Excellence Staffing Group', website: 'https://excellencestaffing.com',
      linkedin: 'https://linkedin.com/company/excellencestaffing',
      why: 'Industry leader for 25 years with $1B revenue. Maintains 98% client satisfaction and 95% candidate retention rate.',
      slug: 'excellence-staffing-group'
    },
    {
      name: 'Premier Talent Solutions', website: 'https://premiertalent.com',
      linkedin: 'https://linkedin.com/company/premiertalent',
      why: 'Award-winning staffing firm with operations in 30 countries. Placed 500K+ candidates with 99% accuracy rate.',
      slug: 'premier-talent-solutions'
    }
  ],

  "top-ai-driven-platform": [
    {
      name: 'TechStaff AI', website: 'https://techstaffai.com',
      linkedin: 'https://linkedin.com/company/techstaffai',
      why: 'Revolutionary AI platform that matches candidates with 98% accuracy. Reduced time-to-hire by 75% for 500+ clients. Processing 1M+ applications monthly.',
      slug: 'techstaff-ai-platform'
    },
    {
      name: 'SmartRecruit Pro', website: 'https://smartrecruitpro.com',
      linkedin: 'https://linkedin.com/company/smartrecruitpro',
      why: 'Advanced machine learning algorithms predict candidate success with 96% accuracy. Used by 200+ Fortune 500 companies.',
      slug: 'smartrecruit-pro-platform'
    }
  ],

  "top-digital-experience": [
    {
      name: 'ClientFirst Recruiting', website: 'https://clientfirstrecruiting.com',
      linkedin: 'https://linkedin.com/company/clientfirst',
      why: 'Award-winning digital experience with 4.9/5 client satisfaction. Mobile-first platform with real-time candidate tracking and AI-powered insights.',
      slug: 'clientfirst-digital-experience'
    },
    {
      name: 'Digital Talent Hub', website: 'https://digitaltalenthub.com',
      linkedin: 'https://linkedin.com/company/digitaltalenthub',
      why: 'Seamless digital experience with VR office tours and AI chatbot support. 99% user satisfaction with mobile-responsive design.',
      slug: 'digital-talent-hub-experience'
    }
  ],

  "top-women-led-firm": [
    {
      name: 'WomenLead Staffing', website: 'https://womenleadstaffing.com',
      linkedin: 'https://linkedin.com/company/womenleadstaffing',
      why: '100% women-owned and operated. 85% female leadership team. Pioneered inclusive hiring practices adopted industry-wide. $100M revenue milestone.',
      slug: 'womenlead-staffing-firm'
    },
    {
      name: 'SheLeads Talent', website: 'https://sheleadstalent.com',
      linkedin: 'https://linkedin.com/company/sheleadstalent',
      why: 'Founded by female entrepreneurs. 90% female workforce. Specializes in placing women in leadership roles with 95% success rate.',
      slug: 'sheleads-talent-firm'
    }
  ],

  "fastest-growing-firm": [
    {
      name: 'RocketGrowth Staffing', website: 'https://rocketgrowthstaffing.com',
      linkedin: 'https://linkedin.com/company/rocketgrowth',
      why: 'Fastest growing staffing firm: 2,000% growth in 3 years. Expanded from 1 to 50 offices globally. Placed 100,000+ candidates.',
      slug: 'rocketgrowth-fastest-growing'
    },
    {
      name: 'HyperScale Talent', website: 'https://hyperscaletalent.com',
      linkedin: 'https://linkedin.com/company/hyperscaletalent',
      why: 'Achieved 1,500% revenue growth in 2 years. Expanded to 25 countries. Innovative scaling model adopted by competitors.',
      slug: 'hyperscale-talent-growing'
    }
  ],

  "best-process-at-scale": [
    {
      name: 'ScaleStaff Solutions', website: 'https://scalestaffsolutions.com',
      linkedin: 'https://linkedin.com/company/scalestaffsolutions',
      why: 'Proprietary process handles 10,000+ hires monthly. Automated screening reduces manual work by 90%. Serves Fortune 100 companies exclusively.',
      slug: 'scalestaff-process-scale'
    },
    {
      name: 'MegaScale Recruiting', website: 'https://megascalerecruiting.com',
      linkedin: 'https://linkedin.com/company/megascalerecruiting',
      why: 'Processes 50,000+ applications daily with 99.9% accuracy. Proprietary workflow management system handles enterprise-scale recruitment.',
      slug: 'megascale-recruiting-process'
    }
  ],

  "top-staffing-company-usa": [
    {
      name: 'USA Talent Partners', website: 'https://usatalentpartners.com',
      linkedin: 'https://linkedin.com/company/usatalentpartners',
      why: 'Leading staffing company in USA with offices in all 50 states. $500M annual revenue. Placed 250,000+ Americans in careers.',
      slug: 'usa-talent-partners-company'
    },
    {
      name: 'American Workforce Solutions', website: 'https://americanworkforce.com',
      linkedin: 'https://linkedin.com/company/americanworkforce',
      why: 'Largest independent staffing firm in USA. 100+ offices nationwide. Specializes in blue-collar and skilled trades placement.',
      slug: 'american-workforce-solutions'
    }
  ],

  "top-ai-platform-usa": [
    {
      name: 'AI Recruit Pro USA', website: 'https://airecruitprousa.com',
      linkedin: 'https://linkedin.com/company/airecruitprousa',
      why: 'Most advanced AI recruiting platform in North America. Patent-pending algorithms. Used by 50+ Fortune 500 companies.',
      slug: 'ai-recruit-pro-usa-platform'
    },
    {
      name: 'USA AI Talent', website: 'https://usaaitalent.com',
      linkedin: 'https://linkedin.com/company/usaaitalent',
      why: 'Leading AI-powered recruitment platform serving US market. Processes 2M+ resumes monthly with 97% matching accuracy.',
      slug: 'usa-ai-talent-platform'
    }
  ],

  "top-staffing-company-europe": [
    {
      name: 'EuroStaff Excellence', website: 'https://eurostaffexcellence.com',
      linkedin: 'https://linkedin.com/company/eurostaffexcellence',
      why: 'Premier European staffing firm operating in 25 countries. Multilingual platform supporting 12 languages. €200M annual revenue.',
      slug: 'eurostaff-excellence-company'
    },
    {
      name: 'Continental Talent Group', website: 'https://continentaltalent.com',
      linkedin: 'https://linkedin.com/company/continentaltalent',
      why: 'Largest staffing network in Europe with 200+ offices. Expert in EU compliance and cross-border recruitment.',
      slug: 'continental-talent-group'
    }
  ],

  "top-ai-platform-europe": [
    {
      name: 'EuroAI Recruiting', website: 'https://euroairecruiting.com',
      linkedin: 'https://linkedin.com/company/euroairecruiting',
      why: 'Leading AI recruitment platform in Europe. GDPR-compliant with multilingual AI processing 27 European languages.',
      slug: 'euroai-recruiting-platform'
    },
    {
      name: 'Continental AI Talent', website: 'https://continentalaitalent.com',
      linkedin: 'https://linkedin.com/company/continentalaitalent',
      why: 'Advanced AI platform serving European market. Processes applications in 15+ languages with cultural context awareness.',
      slug: 'continental-ai-talent-platform'
    }
  ]
};

// Nominators pool
const nominatorPool = [
  { email: 'sarah.johnson@talentacq.com', firstname: 'Sarah', lastname: 'Johnson', linkedin: 'https://linkedin.com/in/sarahjohnson', company: 'TalentAcq Solutions', job_title: 'VP of Talent Acquisition' },
  { email: 'mike.chen@recruitpro.com', firstname: 'Mike', lastname: 'Chen', linkedin: 'https://linkedin.com/in/mikechen', company: 'RecruitPro Inc', job_title: 'Senior Recruiter' },
  { email: 'emily.davis@staffingworld.com', firstname: 'Emily', lastname: 'Davis', linkedin: 'https://linkedin.com/in/emilydavis', company: 'Staffing World', job_title: 'Recruitment Manager' },
  { email: 'david.wilson@hrtech.com', firstname: 'David', lastname: 'Wilson', linkedin: 'https://linkedin.com/in/davidwilson', company: 'HR Tech Solutions', job_title: 'Head of Recruitment' },
  { email: 'lisa.brown@globalstaff.com', firstname: 'Lisa', lastname: 'Brown', linkedin: 'https://linkedin.com/in/lisabrown', company: 'Global Staff Partners', job_title: 'Talent Director' },
  { email: 'james.taylor@innovaterecruit.com', firstname: 'James', lastname: 'Taylor', linkedin: 'https://linkedin.com/in/jamestaylor', company: 'Innovate Recruit', job_title: 'CEO' },
  { email: 'maria.garcia@techtalent.com', firstname: 'Maria', lastname: 'Garcia', linkedin: 'https://linkedin.com/in/mariagarcia', company: 'Tech Talent Hub', job_title: 'Principal Recruiter' },
  { email: 'robert.lee@staffingsolutions.com', firstname: 'Robert', lastname: 'Lee', linkedin: 'https://linkedin.com/in/robertlee', company: 'Staffing Solutions LLC', job_title: 'Managing Director' },
  { email: 'jennifer.white@hrpro.com', firstname: 'Jennifer', lastname: 'White', linkedin: 'https://linkedin.com/in/jenniferwhite', company: 'HR Pro International', job_title: 'Talent Acquisition Lead' },
  { email: 'christopher.martinez@globalrecruit.com', firstname: 'Christopher', lastname: 'Martinez', linkedin: 'https://linkedin.com/in/christophermartinez', company: 'Global Recruit Corp', job_title: 'Executive Recruiter' }
];

// Voters pool
const voterPool = [
  { email: 'voter1@techcorp.com', firstname: 'Jennifer', lastname: 'Adams', linkedin: 'https://linkedin.com/in/jenniferadams', company: 'TechCorp Inc' },
  { email: 'voter2@hrpro.com', firstname: 'Michael', lastname: 'Brown', linkedin: 'https://linkedin.com/in/michaelbrown', company: 'HR Pro Solutions' },
  { email: 'voter3@talentfirm.com', firstname: 'Sarah', lastname: 'Wilson', linkedin: 'https://linkedin.com/in/sarahwilson', company: 'Talent Firm LLC' },
  { email: 'voter4@recruitech.com', firstname: 'David', lastname: 'Miller', linkedin: 'https://linkedin.com/in/davidmiller', company: 'RecruTech Systems' },
  { email: 'voter5@staffpro.com', firstname: 'Lisa', lastname: 'Garcia', linkedin: 'https://linkedin.com/in/lisagarcia', company: 'Staff Pro International' },
  { email: 'voter6@hiringtech.com', firstname: 'John', lastname: 'Martinez', linkedin: 'https://linkedin.com/in/johnmartinez', company: 'Hiring Tech Solutions' },
  { email: 'voter7@talentbridge.com', firstname: 'Amanda', lastname: 'Johnson', linkedin: 'https://linkedin.com/in/amandajohnson', company: 'Talent Bridge Corp' },
  { email: 'voter8@recruitmax.com', firstname: 'Chris', lastname: 'Davis', linkedin: 'https://linkedin.com/in/chrisdavis', company: 'RecruitMax Global' },
  { email: 'voter9@hrexcellence.com', firstname: 'Nicole', lastname: 'Thompson', linkedin: 'https://linkedin.com/in/nicolethompson', company: 'HR Excellence Ltd' },
  { email: 'voter10@talentpro.com', firstname: 'Kevin', lastname: 'Anderson', linkedin: 'https://linkedin.com/in/kevinanderson', company: 'Talent Pro Services' },
  { email: 'voter11@staffingplus.com', firstname: 'Rachel', lastname: 'Taylor', linkedin: 'https://linkedin.com/in/racheltaylor', company: 'Staffing Plus Corp' },
  { email: 'voter12@recruitglobal.com', firstname: 'Daniel', lastname: 'Moore', linkedin: 'https://linkedin.com/in/danielmoore', company: 'Recruit Global Inc' }
];

function getAvatarUrl(name, colorIndex) {
  const color = avatarColors[colorIndex % avatarColors.length];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=256&background=${color}&color=fff&bold=true&format=png`;
}

function getGroupId(group) {
  const groupMap = {
    'Role-Specific': 'role-specific',
    'Company Awards': 'company-awards',
    'Innovation & Tech': 'innovation-tech',
    'Culture & Impact': 'culture-impact',
    'Growth & Performance': 'growth-performance',
    'Geographic': 'geographic',
    'Special Recognition': 'special-recognition'
  };
  return groupMap[group] || 'other';
}

async function createCompleteData() {
  console.log('🚀 Creating COMPLETE dummy data for ALL 23 categories...');
  console.log('📊 This will create 2-3 nominees per category for comprehensive testing');

  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await supabase.from('votes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('nominations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('nominees').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('nominators').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('voters').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Create nominators
    console.log('👤 Creating nominators...');
    const { data: nominators, error: nominatorError } = await supabase
      .from('nominators')
      .insert(nominatorPool)
      .select();

    if (nominatorError) {
      console.error('❌ Error creating nominators:', nominatorError);
      return;
    }
    console.log(`✅ Created ${nominators.length} nominators`);

    // Create all nominees
    console.log('🎯 Creating nominees for all categories...');
    const allPersonNominees = [];
    const allCompanyNominees = [];
    let colorIndex = 0;

    // Process person categories
    for (const category of ALL_CATEGORIES.filter(c => c.type === 'person')) {
      const nominees = nomineeData[category.id] || [];
      for (const nominee of nominees) {
        allPersonNominees.push({
          type: 'person',
          firstname: nominee.firstname,
          lastname: nominee.lastname,
          person_email: nominee.email,
          jobtitle: nominee.title,
          person_linkedin: nominee.linkedin,
          headshot_url: getAvatarUrl(`${nominee.firstname} ${nominee.lastname}`, colorIndex++),
          why_me: nominee.why,
          live_url: nominee.slug
        });
      }
    }

    // Process company categories
    for (const category of ALL_CATEGORIES.filter(c => c.type === 'company')) {
      const companies = companyData[category.id] || [];
      for (const company of companies) {
        allCompanyNominees.push({
          type: 'company',
          company_name: company.name,
          company_website: company.website,
          company_linkedin: company.linkedin,
          logo_url: getAvatarUrl(company.name.split(' ').map(w => w[0]).join(''), colorIndex++),
          why_us: company.why,
          live_url: company.slug
        });
      }
    }

    // Insert person nominees
    const { data: personNominees, error: personError } = await supabase
      .from('nominees')
      .insert(allPersonNominees)
      .select();

    if (personError) {
      console.error('❌ Error creating person nominees:', personError);
      return;
    }
    console.log(`✅ Created ${personNominees.length} person nominees`);

    // Insert company nominees
    const { data: companyNominees, error: companyError } = await supabase
      .from('nominees')
      .insert(allCompanyNominees)
      .select();

    if (companyError) {
      console.error('❌ Error creating company nominees:', companyError);
      return;
    }
    console.log(`✅ Created ${companyNominees.length} company nominees`);

    // Create nominations
    console.log('📝 Creating nominations for all categories...');
    const nominations = [];
    let personIndex = 0;
    let companyIndex = 0;

    for (const category of ALL_CATEGORIES) {
      const nominees = category.type === 'person' 
        ? (nomineeData[category.id] || []).map((_, i) => personNominees[personIndex + i])
        : (companyData[category.id] || []).map((_, i) => companyNominees[companyIndex + i]);

      for (const nominee of nominees) {
        if (nominee) {
          const nominator = nominators[Math.floor(Math.random() * nominators.length)];
          nominations.push({
            state: 'approved',
            category_group_id: getGroupId(category.group),
            subcategory_id: category.id,
            votes: Math.floor(Math.random() * 150) + 10, // Random votes between 10-159
            nominator_id: nominator.id,
            nominee_id: nominee.id
          });
        }
      }

      // Update indices
      if (category.type === 'person') {
        personIndex += (nomineeData[category.id] || []).length;
      } else {
        companyIndex += (companyData[category.id] || []).length;
      }
    }

    const { data: createdNominations, error: nominationError } = await supabase
      .from('nominations')
      .insert(nominations)
      .select();

    if (nominationError) {
      console.error('❌ Error creating nominations:', nominationError);
      return;
    }
    console.log(`✅ Created ${createdNominations.length} nominations`);

    // Create voters
    console.log('🗳️ Creating voters...');
    const { data: createdVoters, error: voterError } = await supabase
      .from('voters')
      .insert(voterPool)
      .select();

    if (voterError) {
      console.error('❌ Error creating voters:', voterError);
      return;
    }
    console.log(`✅ Created ${createdVoters.length} voters`);

    // Create votes (distribute across all categories)
    console.log('✅ Creating votes across all categories...');
    const votes = [];
    const categoriesWithNominations = {};
    
    // Group nominations by category
    createdNominations.forEach(nom => {
      if (!categoriesWithNominations[nom.subcategory_id]) {
        categoriesWithNominations[nom.subcategory_id] = [];
      }
      categoriesWithNominations[nom.subcategory_id].push(nom);
    });

    // Create votes for each category (ensuring each category gets some votes)
    for (const [categoryId, categoryNominations] of Object.entries(categoriesWithNominations)) {
      const votesPerCategory = Math.floor(Math.random() * 8) + 3; // 3-10 votes per category
      
      for (let i = 0; i < votesPerCategory; i++) {
        const randomNomination = categoryNominations[Math.floor(Math.random() * categoryNominations.length)];
        const randomVoter = createdVoters[Math.floor(Math.random() * createdVoters.length)];
        
        // Check if this voter already voted in this category
        const existingVote = votes.find(v => 
          v.voter_id === randomVoter.id && v.subcategory_id === categoryId
        );
        
        if (!existingVote) {
          votes.push({
            voter_id: randomVoter.id,
            nomination_id: randomNomination.id,
            subcategory_id: categoryId,
            vote_timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
          });
        }
      }
    }

    const { data: createdVotes, error: voteError } = await supabase
      .from('votes')
      .insert(votes)
      .select();

    if (voteError) {
      console.error('❌ Error creating votes:', voteError);
      return;
    }
    console.log(`✅ Created ${createdVotes.length} votes`);

    console.log('\n🎉 COMPLETE dummy data created successfully!');
    console.log('\n📊 Final Summary:');
    console.log(`   👤 Nominators: ${nominators.length}`);
    console.log(`   🎯 Person Nominees: ${personNominees.length}`);
    console.log(`   🏢 Company Nominees: ${companyNominees.length}`);
    console.log(`   📝 Total Nominations: ${createdNominations.length}`);
    console.log(`   🗳️ Voters: ${createdVoters.length}`);
    console.log(`   ✅ Total Votes: ${createdVotes.length}`);
    console.log(`   🏆 Categories Covered: ${ALL_CATEGORIES.length}/23 (100%)`);

    console.log('\n🎯 Categories with nominees:');
    const categoryStats = {};
    createdNominations.forEach(nom => {
      categoryStats[nom.subcategory_id] = (categoryStats[nom.subcategory_id] || 0) + 1;
    });
    
    Object.entries(categoryStats).forEach(([cat, count]) => {
      console.log(`   - ${cat}: ${count} nominees`);
    });

    console.log('\n🌐 Ready for comprehensive testing at:');
    console.log('   - Homepage: http://localhost:3000');
    console.log('   - Directory: http://localhost:3000/directory');
    console.log('   - Nomination Form: http://localhost:3000/nominate');
    console.log('   - Admin Panel: http://localhost:3000/admin');

  } catch (error) {
    console.error('❌ Failed to create complete dummy data:', error);
  }
}

createCompleteData();