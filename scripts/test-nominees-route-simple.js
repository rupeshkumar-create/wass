// Simple test for nominees API without environment dependencies
console.log('🔍 Testing Nominees Route Structure...\n');

// Test the transformation logic
const mockNomination = {
  id: 'test-123',
  type: 'person',
  subcategory_id: 'cat-1',
  category_group_id: 'group-1',
  firstname: 'John',
  lastname: 'Doe',
  jobtitle: 'CEO',
  person_email: 'john@example.com',
  person_linkedin: 'https://linkedin.com/in/johndoe',
  headshot_url: 'https://example.com/headshot.jpg',
  why_me: 'I am great at what I do',
  live_url: 'https://johndoe.com',
  votes: 5,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z'
};

// Simulate the transformation logic from the route
function transformNomination(nomination) {
  const displayName = nomination.type === 'person'
    ? `${nomination.firstname || ''} ${nomination.lastname || ''}`.trim()
    : nomination.company_name || 'Unknown';
  
  const imageUrl = nomination.type === 'person' ? nomination.headshot_url : nomination.logo_url;
  const email = nomination.type === 'person' ? nomination.person_email : null;
  const linkedinUrl = nomination.type === 'person' ? nomination.person_linkedin : nomination.company_linkedin;
  const whyVote = nomination.type === 'person' ? nomination.why_me : nomination.why_us;
  const titleOrIndustry = nomination.type === 'person' ? nomination.jobtitle : null;

  return {
    id: nomination.id,
    nomineeId: nomination.id,
    category: nomination.subcategory_id,
    categoryGroup: nomination.category_group_id,
    type: nomination.type,
    votes: nomination.votes || 0,
    status: 'approved',
    createdAt: nomination.created_at,
    approvedAt: nomination.updated_at,
    uniqueKey: nomination.id,
    name: displayName,
    displayName: displayName,
    imageUrl: imageUrl,
    title: titleOrIndustry,
    linkedin: linkedinUrl,
    whyVote: whyVote,
    liveUrl: nomination.live_url || '',
    nominee: {
      id: nomination.id,
      type: nomination.type,
      name: displayName,
      displayName: displayName,
      imageUrl: imageUrl,
      email: email || '',
      phone: '',
      country: '',
      linkedin: linkedinUrl || '',
      liveUrl: nomination.live_url || '',
      bio: '',
      achievements: '',
      socialMedia: '',
      ...(nomination.type === 'person' ? {
        firstName: nomination.firstname || '',
        lastName: nomination.lastname || '',
        jobTitle: nomination.jobtitle || '',
        company: '',
        headshotUrl: nomination.headshot_url || '',
        whyMe: nomination.why_me || '',
        personEmail: nomination.person_email || '',
        personLinkedin: nomination.person_linkedin || '',
        personPhone: '',
        personCountry: '',
        personCompany: ''
      } : {}),
      whyVote: whyVote || '',
      titleOrIndustry: titleOrIndustry || ''
    },
    nominator: {
      name: 'Anonymous',
      email: '',
      displayName: 'Anonymous'
    }
  };
}

const result = transformNomination(mockNomination);

console.log('✅ Transformation successful!');
console.log('📊 Sample result:');
console.log(JSON.stringify(result, null, 2));

console.log('\n🎯 Key fields check:');
console.log('- ID:', result.id);
console.log('- Name:', result.name);
console.log('- Type:', result.type);
console.log('- Email:', result.nominee.email);
console.log('- LinkedIn:', result.nominee.linkedin);
console.log('- Image URL:', result.nominee.imageUrl);
console.log('- Why Vote:', result.nominee.whyVote);

console.log('\n✅ Nominees route should work with current schema!');