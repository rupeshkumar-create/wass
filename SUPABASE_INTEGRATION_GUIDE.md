# WSA 2026 Supabase Integration Guide

## 🚀 Quick Start

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create an account
2. Click "New Project"
3. Choose your organization and enter project details
4. Wait for the database to be ready (2-3 minutes)

### 2. Run Database Schema
1. Go to your Supabase Dashboard → SQL Editor
2. Copy the entire contents of `supabase-schema.sql`
3. Paste into the SQL Editor and click "Run"
4. Verify tables are created: `nominations`, `nominators`, `voters`, `hubspot_outbox`

### 3. Get API Credentials
1. Go to Project Settings → API
2. Copy the following values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **Service Role Key** (secret key, starts with `eyJ...`)

### 4. Configure Environment
Create/update `.env.local`:
```bash
# Supabase Configuration - DO NOT COMMIT TO GIT
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cron job protection
CRON_SECRET=your-secure-random-key
```

### 5. Test Integration
```bash
# Start development server
npm run dev

# Run integration test
node scripts/test-supabase-integration.js
```

## 🏗️ Architecture Overview

### Server-Only Design
- ✅ **Service Role Key** used server-side only (never exposed to browser)
- ✅ **API Routes** handle all database operations
- ✅ **Zod Validation** for all inputs
- ✅ **Outbox Pattern** for reliable external sync

### Database Schema
```
nominations (person/company nominees)
├── id (UUID, PK)
├── type ('person' | 'company')
├── category_group_id, subcategory_id
├── state ('submitted' | 'approved' | 'rejected')
├── person fields (firstname, lastname, jobtitle, etc.)
├── company fields (company_name, domain, website, etc.)
└── votes (integer counter)

nominators (one per email+subcategory)
├── id (UUID, PK)
├── email, firstname, lastname, linkedin
├── nominated_display_name
├── subcategory_id
└── status ('submitted' | 'approved' | 'rejected')

voters (one vote per email+subcategory)
├── id (UUID, PK)
├── email, firstname, lastname, linkedin
├── subcategory_id
├── voted_for_display_name
└── vote_timestamp

hubspot_outbox (sync queue)
├── id (UUID, PK)
├── event_type ('nomination_submitted' | 'nomination_approved' | 'vote_cast')
├── payload (JSONB)
├── status ('pending' | 'processing' | 'done' | 'dead')
└── attempt_count, last_error
```

## 🔌 API Endpoints

### 1. Submit Nomination
```bash
POST /api/nomination/submit
```

**Person Nomination:**
```json
{
  "type": "person",
  "categoryGroupId": "recruiters",
  "subcategoryId": "top-recruiter",
  "nominator": {
    "email": "nominator@example.com",
    "firstname": "John",
    "lastname": "Doe",
    "linkedin": "https://linkedin.com/in/john-doe",
    "nominatedDisplayName": "Jane Smith"
  },
  "nominee": {
    "firstname": "Jane",
    "lastname": "Smith",
    "jobtitle": "Senior Recruiter",
    "email": "jane@example.com",
    "linkedin": "https://linkedin.com/in/jane-smith",
    "headshotUrl": "https://example.com/headshot.jpg",
    "whyMe": "I am an excellent recruiter..."
  }
}
```

**Company Nomination:**
```json
{
  "type": "company",
  "categoryGroupId": "companies",
  "subcategoryId": "best-staffing-firm",
  "nominator": {
    "email": "nominator@example.com",
    "firstname": "John",
    "lastname": "Doe",
    "nominatedDisplayName": "Acme Staffing"
  },
  "nominee": {
    "name": "Acme Staffing",
    "domain": "acme.com",
    "website": "https://acme.com",
    "linkedin": "https://linkedin.com/company/acme",
    "logoUrl": "https://example.com/logo.png",
    "whyUs": "We are the best staffing firm..."
  }
}
```

**Response:**
```json
{
  "nominationId": "uuid",
  "state": "submitted"
}
```

### 2. Approve Nomination
```bash
POST /api/nomination/approve
```

**Request:**
```json
{
  "nominationId": "uuid",
  "liveUrl": "https://example.com/nominees/jane-smith"
}
```

**Response:**
```json
{
  "nominationId": "uuid",
  "state": "approved",
  "liveUrl": "https://example.com/nominees/jane-smith"
}
```

### 3. Cast Vote
```bash
POST /api/vote
```

**Request:**
```json
{
  "email": "voter@example.com",
  "firstname": "Voter",
  "lastname": "Name",
  "linkedin": "https://linkedin.com/in/voter",
  "subcategoryId": "top-recruiter",
  "votedForDisplayName": "Jane Smith"
}
```

**Response:**
```json
{
  "ok": true,
  "voterId": "uuid",
  "newVoteCount": 5
}
```

**Duplicate Vote (409):**
```json
{
  "error": "ALREADY_VOTED",
  "message": "You have already voted in this category"
}
```

### 4. HubSpot Sync Worker (Skeleton)
```bash
POST /api/sync/hubspot/run?limit=10
Headers: x-cron-key: your-cron-secret
```

**Response:**
```json
{
  "processed": 3,
  "succeeded": 2,
  "failed": 1,
  "results": [...]
}
```

## 🔧 Data Validation

### LinkedIn URL Normalization
- **Person URLs:** Converted to `https://linkedin.com/in/username`
- **Company URLs:** Converted to `https://linkedin.com/company/name`
- **Email Normalization:** All emails converted to lowercase

### Duplicate Prevention
- **Nominators:** One per `(email, subcategory_id)` - updates existing
- **Voters:** One per `(email, subcategory_id)` - returns 409 if duplicate
- **Nominations:** New row for each submission (distinct IDs)

## 🔄 Integration with Existing Code

### Update Nomination Wizard (Step 10)
```typescript
// After local submission success
const response = await fetch('/api/nomination/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(nominationData)
});

if (response.ok) {
  const result = await response.json();
  console.log('Nomination submitted to server:', result.nominationId);
  // Continue with existing local storage logic
} else {
  const error = await response.json();
  console.error('Server submission failed:', error);
  // Handle error appropriately
}
```

### Update Admin Approval
```typescript
// When admin approves nomination
const response = await fetch('/api/nomination/approve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nominationId: nomination.id,
    liveUrl: `https://wsa2026.com/nominees/${nomination.slug}`
  })
});

if (response.ok) {
  const result = await response.json();
  console.log('Nomination approved:', result);
  // Update local state
}
```

### Update Vote Dialog
```typescript
// When user casts vote
const response = await fetch('/api/vote', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: voter.email,
    firstname: voter.firstName,
    lastname: voter.lastName,
    linkedin: voter.linkedin,
    subcategoryId: category.id,
    votedForDisplayName: nominee.displayName
  })
});

if (response.ok) {
  const result = await response.json();
  console.log('Vote cast:', result);
  // Update vote count in UI
} else if (response.status === 409) {
  const error = await response.json();
  alert('You have already voted in this category');
}
```

## 🔐 Security Features

### Environment Variables
- ✅ Service Role Key is server-only
- ✅ Never exposed to browser/client
- ✅ Git-ignored in `.env.local`

### Database Security
- ✅ Row Level Security (RLS) enabled
- ✅ Service role bypasses RLS (as intended)
- ✅ No direct client access to database

### API Protection
- ✅ Zod validation on all inputs
- ✅ Proper error handling
- ✅ Cron job secret for sync worker

## 🚀 Deployment

### Environment Variables
Set in your deployment platform (Netlify, Vercel, etc.):
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_SECRET=your-secure-random-key
```

### Database Setup
1. Create production Supabase project
2. Run `supabase-schema.sql` in production SQL editor
3. Verify all tables and indexes are created

## 🧪 Testing

### Manual Testing
```bash
# Start dev server
npm run dev

# Run comprehensive test
node scripts/test-supabase-integration.js
```

### Test Cases Covered
- ✅ Person nomination submission
- ✅ Company nomination submission  
- ✅ Nomination approval
- ✅ Vote casting
- ✅ Duplicate vote prevention
- ✅ HubSpot sync worker access
- ✅ Input validation
- ✅ Error handling

## 📈 Next Steps

1. **Complete this setup** following the guide above
2. **Test all endpoints** using the test script
3. **Update UI components** to call new API routes
4. **Implement HubSpot sync logic** in the worker route
5. **Set up cron job** to call sync worker periodically
6. **Monitor outbox table** for sync status

## 🆘 Troubleshooting

### Common Issues

**"Missing SUPABASE_URL environment variable"**
- Ensure `.env.local` exists with correct variables
- Restart development server after adding variables

**"Failed to submit nomination"**
- Check Supabase project is active
- Verify Service Role Key is correct
- Check database schema was applied correctly

**"Unauthorized" on sync worker**
- Ensure `CRON_SECRET` is set in environment
- Pass correct `x-cron-key` header

**Database connection errors**
- Verify Supabase project URL is correct
- Check Service Role Key has proper permissions
- Ensure RLS policies allow service role access

### Debug Steps
1. Check browser network tab for API errors
2. Check server console for detailed error logs
3. Verify Supabase dashboard shows data being created
4. Test individual API endpoints with curl/Postman