# World Staffing Awards 2026

A modern, interactive platform for the World Staffing Awards 2026 that enables community-driven nominations, transparent voting, and real-time engagement.

## 🏆 Features

### Public Features
- **Multi-step Nomination Form**: Intuitive form with business email validation and LinkedIn verification
- **Supabase Storage Integration**: Secure image uploads with automatic optimization
- **Public Directory**: Browse approved nominees with filtering and search capabilities
- **Interactive Voting**: Cast votes with comprehensive duplicate prevention
- **Real-time Vote Counts**: Live vote updates without page refresh
- **Top 3 Podium**: Real-time leaderboard with category switching
- **Social Sharing**: Share nominees via Email, LinkedIn, and Twitter
- **Responsive Design**: Optimized for desktop and mobile devices

### Admin Features
- **Admin Dashboard**: Comprehensive management interface with passcode protection
- **Approval Workflow**: Review, approve, or reject nominations
- **Real-time Analytics**: Live stats and vote tracking with Supabase Realtime
- **CSV Export**: Export nominations and votes data
- **Conflict Resolution**: Handle duplicate nominations gracefully
- **Image Migration Tools**: Convert legacy base64 images to Supabase Storage

### Developer Features
- **Development Utilities**: Seed dummy data and reset system
- **Vote Simulation**: Generate realistic voting patterns for testing
- **Data Validation**: Comprehensive LinkedIn URL normalization and business email validation

## 🚀 Tech Stack

- **Framework**: Next.js 14+ (App Router) with TypeScript
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Storage**: Supabase Storage for media files
- **Styling**: Tailwind CSS + shadcn/ui components
- **Forms**: react-hook-form + zod validation
- **State Management**: SWR for data fetching and caching
- **Email Marketing**: Loops.so integration for voter sync
- **Icons**: Lucide React
- **File Handling**: Supabase Storage with public URLs

## 📋 Award Categories

### Role-Specific Excellence
- Top Recruiter
- Top Executive Leader (CEO/COO/CHRO/CRO/CMO/CGO)
- Top Staffing Influencer
- Rising Star (Under 30)

### Innovation & Technology
- Top AI-Driven Staffing Platform
- Top Digital Experience for Clients

### Culture & Impact
- Top Women-Led Staffing Firm

## 📧 Email Marketing Integration

The platform integrates with **Loops.so** to automatically sync voters and enable targeted email campaigns:

### Voter Sync
- **Automatic Sync**: When users vote, their information is automatically synced to Loops
- **Tagging**: All voters receive the "Voter 2026" tag for segmentation
- **Upsert Logic**: Existing contacts are updated, new ones are created
- **Error Handling**: Failed syncs are logged but don't block voting

### Event Tracking
- **Vote Events**: Each vote triggers a "vote_cast" event in Loops
- **Rich Data**: Events include category, nominee details, and voting context
- **Analytics**: Enables detailed voter behavior analysis

### Configuration
```env
LOOPS_API_KEY=your_loops_api_key
LOOPS_SYNC_ENABLED=true
```

### Testing
Use the development utilities at `/dev` to test Loops integration:
- Test voter sync
- Send sample events
- Verify contact creation
- Fastest Growing Staffing Firm

### Growth & Performance
- Best Staffing Process at Scale
- Thought Leadership & Influence

### Geographic Excellence
- Top Staffing Company (USA/Europe)
- Top Recruiting Leader (USA/Europe)
- Top AI-Driven Platform (USA/Europe)
- Top Global Recruiter/Leader

### Special Recognition
- Special Recognition Award

## 🛠 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/world-staffing-awards.git
   cd world-staffing-awards
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create data directory**
   ```bash
   mkdir -p data
   echo "[]" > data/nominations.json
   echo "[]" > data/votes.json
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Quick Start

### Seed Dummy Data (Development)
```bash
# Reset all data
curl -X POST http://localhost:3000/api/dev/reset

# Seed with approvals and votes
curl -X POST http://localhost:3000/api/dev/seed \
  -H "Content-Type: application/json" \
  -d '{"approveSome":true,"votes":true}'
```

### Admin Access
- URL: `/admin`
- Default Password: `WSA2026`

### Key Routes
- `/` - Homepage with podium
- `/nominate` - Nomination form
- `/directory` - Public nominee directory
- `/nominee/[slug]` - Individual nominee profiles
- `/admin` - Admin dashboard
- `/dev` - Development utilities (dev only)

## 🔧 Configuration

### Admin Passcode
Update the admin passcode in `src/lib/constants.ts`:
```typescript
export const ADMIN_PASSCODE = "your-secure-password";
```

### Email Domain Restrictions
Modify the free email domains list in `src/lib/constants.ts`:
```typescript
export const FREE_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  // Add more domains...
];
```

### File Upload Limits
Adjust file size limits in `src/lib/constants.ts`:
```typescript
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
```

## 📊 Data Structure

### Nominations
```json
{
  "id": "uuid",
  "category": "Top Recruiter",
  "type": "person",
  "nominator": {
    "name": "John Doe",
    "email": "john@company.com",
    "phone": "+1-555-0000"
  },
  "nominee": {
    "name": "Jane Smith",
    "email": "jane@company.com",
    "title": "Senior Recruiter",
    "linkedin": "https://www.linkedin.com/in/jane-smith",
    "headshotBase64": "data:image/jpeg;base64,..."
  },
  "liveUrl": "/nominee/jane-smith",
  "status": "approved",
  "uniqueKey": "top recruiter__https://www.linkedin.com/in/jane-smith",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

### Votes
```json
{
  "nomineeId": "uuid",
  "category": "Top Recruiter",
  "voter": {
    "firstName": "John",
    "lastName": "Voter",
    "email": "john@agency.com",
    "linkedin": "https://www.linkedin.com/in/john-voter"
  },
  "ip": "192.168.1.1",
  "ua": "Mozilla/5.0...",
  "ts": "2025-01-01T00:00:00.000Z"
}
```

## 🔒 Security Features

- **Business Email Validation**: Blocks personal email domains
- **LinkedIn URL Normalization**: Prevents duplicate nominations
- **One Vote Per Category**: Enforced per voter per category
- **IP + Email Tracking**: Comprehensive duplicate vote prevention
- **Admin Passcode Protection**: Secure admin access
- **Input Sanitization**: All user inputs are validated and sanitized

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect repository to Vercel
3. Deploy with default settings
4. Set environment variables if needed

### Environment Variables
```bash
# Optional: Set admin passcode via environment
ADMIN_PASSCODE=your-secure-password

# Optional: Set to production to disable dev routes
NODE_ENV=production
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] Submit nomination with business email
- [ ] Try duplicate nomination (should be blocked)
- [ ] Vote for nominee (should work once)
- [ ] Try voting again (should be blocked)
- [ ] Admin approval workflow
- [ ] Directory filtering and search
- [ ] Social sharing buttons
- [ ] Mobile responsiveness

### Development Commands
```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📈 Timeline

- **Aug 12, 2025**: Nominations Open
- **Sep 14, 2025**: Nominations Close
- **Sep 15, 2025**: Public Voting Opens
- **Jan 15, 2026**: Voting Closes
- **Jan 30, 2026**: Awards Ceremony

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support or questions:
- Create an issue on GitHub
- Check the development utilities at `/dev`
- Review the admin dashboard for data insights

---

Built with ❤️ for the World Staffing Awards 2026# wass
