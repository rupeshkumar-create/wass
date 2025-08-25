import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { normalizeLinkedIn } from '../src/lib/linkedin';
import { buildUniqueKeyFromUrl } from '../src/lib/keys';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface LocalNomination {
  id: string;
  category: string;
  type: 'person' | 'company';
  nominator: {
    name: string;
    email: string;
    phone?: string;
  };
  nominee: {
    name: string;
    email?: string;
    title?: string;
    country?: string;
    website?: string;
    linkedin: string;
    headshotBase64?: string;
    logoBase64?: string;
  };
  liveUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  uniqueKey?: string;
  moderatedAt?: string;
  moderatorNote?: string;
}

interface LocalVote {
  nomineeId: string;
  category: string;
  voter?: {
    firstName: string;
    lastName: string;
    email: string;
    linkedin: string;
  };
  email?: string; // Legacy format
  ip: string;
  ua?: string;
  ts: string;
}

async function uploadImage(nomineeId: string, base64Data: string): Promise<string | null> {
  try {
    if (!base64Data || !base64Data.startsWith('data:')) {
      return null;
    }

    // Extract file type and data from base64
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches) return null;

    const contentType = matches[1];
    const fileData = matches[2];
    const buffer = Buffer.from(fileData, 'base64');

    // Generate filename
    const extension = contentType.split('/')[1] || 'png';
    const fileName = `${nomineeId}.${extension}`;

    console.log(`📸 Uploading image for ${nomineeId}...`);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET || 'wsa-media')
      .upload(fileName, buffer, {
        contentType,
        upsert: true
      });

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET || 'wsa-media')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error processing image upload:', error);
    return null;
  }
}

async function migrateNominations() {
  console.log('📋 Migrating nominations...');
  
  try {
    const nominationsPath = path.join(process.cwd(), 'data', 'nominations.json');
    const data = await fs.readFile(nominationsPath, 'utf-8');
    const localNominations: LocalNomination[] = JSON.parse(data);

    console.log(`Found ${localNominations.length} local nominations`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const nomination of localNominations) {
      try {
        // Normalize LinkedIn URL
        const linkedinNorm = normalizeLinkedIn(nomination.nominee.linkedin);
        
        // Upload image if present
        let imageUrl = null;
        const base64Image = nomination.type === 'person' 
          ? nomination.nominee.headshotBase64 
          : nomination.nominee.logoBase64;
        
        if (base64Image) {
          imageUrl = await uploadImage(nomination.id, base64Image);
        }

        // Prepare database record
        const dbRecord = {
          id: nomination.id,
          category: nomination.category,
          type: nomination.type,
          nominator_name: nomination.nominator.name,
          nominator_email: nomination.nominator.email,
          nominator_phone: nomination.nominator.phone,
          nominee_name: nomination.nominee.name,
          nominee_email: nomination.nominee.email,
          nominee_title: nomination.nominee.title,
          nominee_country: nomination.nominee.country,
          company_name: nomination.type === 'company' ? nomination.nominee.name : null,
          company_website: nomination.nominee.website,
          company_country: nomination.type === 'company' ? nomination.nominee.country : null,
          linkedin_norm: linkedinNorm,
          image_url: imageUrl,
          live_slug: nomination.liveUrl.replace('/nominee/', ''),
          status: nomination.status,
          unique_key: nomination.uniqueKey || buildUniqueKeyFromUrl(nomination.category, linkedinNorm),
          moderated_at: nomination.moderatedAt,
          moderator_note: nomination.moderatorNote,
          created_at: nomination.createdAt
        };

        // Insert into Supabase
        const { error } = await supabase
          .from('nominations')
          .insert([dbRecord]);

        if (error) {
          if (error.code === '23505') {
            console.log(`⚠️  Skipping duplicate: ${nomination.nominee.name} (${nomination.category})`);
            skipped++;
          } else {
            console.error(`❌ Error migrating ${nomination.nominee.name}:`, error);
            errors++;
          }
        } else {
          console.log(`✅ Migrated: ${nomination.nominee.name} (${nomination.category})`);
          migrated++;
        }

      } catch (error) {
        console.error(`❌ Error processing ${nomination.nominee.name}:`, error);
        errors++;
      }
    }

    console.log(`📋 Nominations migration complete: ${migrated} migrated, ${skipped} skipped, ${errors} errors`);
    return { migrated, skipped, errors };

  } catch (error) {
    console.error('❌ Failed to read local nominations:', error);
    return { migrated: 0, skipped: 0, errors: 1 };
  }
}

async function migrateVotes() {
  console.log('🗳️  Migrating votes...');
  
  try {
    const votesPath = path.join(process.cwd(), 'data', 'votes.json');
    const data = await fs.readFile(votesPath, 'utf-8');
    const localVotes: LocalVote[] = JSON.parse(data);

    console.log(`Found ${localVotes.length} local votes`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const vote of localVotes) {
      try {
        // Handle both new and legacy vote formats
        let voterData;
        if (vote.voter) {
          voterData = {
            firstName: vote.voter.firstName,
            lastName: vote.voter.lastName,
            email: vote.voter.email,
            linkedin: normalizeLinkedIn(vote.voter.linkedin)
          };
        } else {
          // Legacy format - create dummy voter data
          voterData = {
            firstName: 'Legacy',
            lastName: 'Voter',
            email: vote.email || 'legacy@voter.com',
            linkedin: 'https://www.linkedin.com/in/legacy-voter'
          };
        }

        // Use the cast_vote function for proper validation
        const { data: result, error } = await supabase
          .rpc('cast_vote', {
            p_nominee: vote.nomineeId,
            p_category: vote.category,
            p_first: voterData.firstName,
            p_last: voterData.lastName,
            p_email: voterData.email,
            p_linkedin_norm: voterData.linkedin,
            p_ip: vote.ip,
            p_ua: vote.ua || 'Migration Script'
          });

        if (error) {
          console.error(`❌ Error migrating vote for ${vote.nomineeId}:`, error);
          errors++;
        } else if (result && result[0]?.success) {
          console.log(`✅ Migrated vote for nominee ${vote.nomineeId}`);
          migrated++;
        } else {
          console.log(`⚠️  Skipping duplicate vote for nominee ${vote.nomineeId}`);
          skipped++;
        }

      } catch (error) {
        console.error(`❌ Error processing vote for ${vote.nomineeId}:`, error);
        errors++;
      }
    }

    console.log(`🗳️  Votes migration complete: ${migrated} migrated, ${skipped} skipped, ${errors} errors`);
    return { migrated, skipped, errors };

  } catch (error) {
    console.error('❌ Failed to read local votes:', error);
    return { migrated: 0, skipped: 0, errors: 1 };
  }
}

async function main() {
  console.log('🚀 Starting migration from local JSON to Supabase...');
  console.log('📡 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  
  // Test connection
  try {
    const { data, error } = await supabase.from('nominations').select('count').limit(1);
    if (error) {
      console.error('❌ Failed to connect to Supabase:', error);
      process.exit(1);
    }
    console.log('✅ Supabase connection successful');
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error);
    process.exit(1);
  }

  // Run migrations
  const nominationsResult = await migrateNominations();
  const votesResult = await migrateVotes();

  console.log('\n🎉 Migration Summary:');
  console.log(`📋 Nominations: ${nominationsResult.migrated} migrated, ${nominationsResult.skipped} skipped, ${nominationsResult.errors} errors`);
  console.log(`🗳️  Votes: ${votesResult.migrated} migrated, ${votesResult.skipped} skipped, ${votesResult.errors} errors`);
  
  if (nominationsResult.errors === 0 && votesResult.errors === 0) {
    console.log('✅ Migration completed successfully!');
  } else {
    console.log('⚠️  Migration completed with some errors. Check logs above.');
  }
}

main().catch(console.error);