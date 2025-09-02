const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testNomineesAPI() {
  console.log('🔍 Testing Nominees API with new schema...\n');

  try {
    // First, check if public_nominees view exists
    console.log('1. Checking if public_nominees view exists...');
    const { data: viewData, error: viewError } = await supabase
      .from('public_nominees')
      .select('*')
      .limit(1);

    if (viewError) {
      console.log('❌ public_nominees view not found:', viewError.message);
      console.log('📝 Falling back to direct table query...\n');
      
      // Fallback: Query nominations with nominees join
      console.log('2. Testing direct nominations query...');
      const { data: nominations, error: nomError } = await supabase
        .from('nominations')
        .select(`
          id,
          subcategory_id,
          category_group_id,
          votes,
          created_at,
          approved_at,
          state,
          nominees (
            id,
            type,
            firstname,
            lastname,
            person_email,
            person_linkedin,
            person_phone,
            jobtitle,
            person_company,
            person_country,
            headshot_url,
            why_me,
            company_name,
            company_domain,
            company_website,
            company_linkedin,
            company_email,
            company_phone,
            company_country,
            company_size,
            company_industry,
            logo_url,
            why_us,
            live_url,
            bio,
            achievements,
            social_media
          )
        `)
        .eq('state', 'approved')
        .limit(3);

      if (nomError) {
        console.log('❌ Direct query failed:', nomError.message);
        return;
      }

      console.log('✅ Direct query successful!');
      console.log('📊 Sample data structure:');
      if (nominations && nominations.length > 0) {
        const sample = nominations[0];
        console.log('Nomination fields:', Object.keys(sample));
        console.log('Nominee fields:', sample.nominees ? Object.keys(sample.nominees) : 'No nominees data');
        console.log('Nominee type:', sample.nominees?.type);
        console.log('Is nominees array?', Array.isArray(sample.nominees));
      }

    } else {
      console.log('✅ public_nominees view exists!');
      console.log('📊 Sample data from view:');
      if (viewData && viewData.length > 0) {
        console.log('View fields:', Object.keys(viewData[0]));
        console.log('Sample nominee:', {
          nomination_id: viewData[0].nomination_id,
          nominee_id: viewData[0].nominee_id,
          type: viewData[0].type,
          display_name: viewData[0].display_name,
          image_url: viewData[0].image_url,
          email: viewData[0].email
        });
      }
    }

    // Test the actual API endpoint
    console.log('\n3. Testing API endpoint...');
    const response = await fetch('http://localhost:3000/api/nominees?limit=2');
    const apiResult = await response.json();
    
    if (apiResult.success) {
      console.log('✅ API endpoint working!');
      console.log('📊 API Response:', {
        count: apiResult.count,
        sampleNominee: apiResult.data[0] ? {
          id: apiResult.data[0].id,
          name: apiResult.data[0].name,
          type: apiResult.data[0].type,
          votes: apiResult.data[0].votes
        } : 'No data'
      });
    } else {
      console.log('❌ API endpoint failed:', apiResult.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testNomineesAPI();