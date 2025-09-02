import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

interface CSVRow {
  type: 'person' | 'company';
  category: string;
  first_name?: string;
  last_name?: string;
  job_title?: string;
  company_name?: string;
  email: string;
  phone?: string;
  country: string;
  linkedin?: string;
  website?: string;
  bio?: string;
  achievements?: string;
  why_vote_for_me: string;
  company_size?: string;
  industry?: string;
  logo_url?: string;
  headshot_url?: string;
  nominator_name: string;
  nominator_email: string;
  nominator_company?: string;
  nominator_job_title?: string;
  nominator_phone?: string;
  nominator_country?: string;
}

interface ValidationError {
  field: string;
  message: string;
}

// Valid categories
const VALID_CATEGORIES = [
  // Person categories
  'best-recruitment-consultant',
  'best-hr-professional',
  'best-talent-acquisition-specialist',
  'rising-star-recruitment',
  'best-executive-search-consultant',
  'best-recruitment-leader',
  'diversity-inclusion-champion',
  'recruitment-innovation-award',
  'lifetime-achievement-recruitment',
  // Company categories
  'best-recruitment-agency',
  'best-hr-consultancy',
  'best-talent-acquisition-team',
  'best-recruitment-technology',
  'best-staffing-firm',
  'recruitment-agency-of-the-year',
  'best-niche-recruitment-agency',
  'best-international-recruitment',
  'recruitment-innovation-company',
  'best-recruitment-startup'
];

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function validateRow(row: CSVRow, rowNumber: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required fields
  if (!row.type) {
    errors.push({ field: 'type', message: 'Type is required' });
  } else if (!['person', 'company'].includes(row.type)) {
    errors.push({ field: 'type', message: 'Type must be "person" or "company"' });
  }

  if (!row.category) {
    errors.push({ field: 'category', message: 'Category is required' });
  } else if (!VALID_CATEGORIES.includes(row.category)) {
    errors.push({ field: 'category', message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
  }

  if (!row.email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!validateEmail(row.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  if (!row.country) {
    errors.push({ field: 'country', message: 'Country is required' });
  }

  if (!row.why_vote_for_me) {
    errors.push({ field: 'why_vote_for_me', message: 'Why vote for me is required' });
  }

  if (!row.nominator_name) {
    errors.push({ field: 'nominator_name', message: 'Nominator name is required' });
  }

  if (!row.nominator_email) {
    errors.push({ field: 'nominator_email', message: 'Nominator email is required' });
  } else if (!validateEmail(row.nominator_email)) {
    errors.push({ field: 'nominator_email', message: 'Invalid nominator email format' });
  }

  // Type-specific validation
  if (row.type === 'person') {
    if (!row.first_name) {
      errors.push({ field: 'first_name', message: 'First name is required for person nominations' });
    }
    if (!row.last_name) {
      errors.push({ field: 'last_name', message: 'Last name is required for person nominations' });
    }
    if (!row.job_title) {
      errors.push({ field: 'job_title', message: 'Job title is required for person nominations' });
    }
  }

  if (row.type === 'company') {
    if (!row.company_name) {
      errors.push({ field: 'company_name', message: 'Company name is required for company nominations' });
    }
  }

  // URL validation
  if (row.linkedin && !validateURL(row.linkedin)) {
    errors.push({ field: 'linkedin', message: 'Invalid LinkedIn URL format' });
  }

  if (row.website && !validateURL(row.website)) {
    errors.push({ field: 'website', message: 'Invalid website URL format' });
  }

  if (row.logo_url && !validateURL(row.logo_url)) {
    errors.push({ field: 'logo_url', message: 'Invalid logo URL format' });
  }

  if (row.headshot_url && !validateURL(row.headshot_url)) {
    errors.push({ field: 'headshot_url', message: 'Invalid headshot URL format' });
  }

  // Length validation
  if (row.why_vote_for_me && row.why_vote_for_me.length > 1000) {
    errors.push({ field: 'why_vote_for_me', message: 'Why vote for me must be less than 1000 characters' });
  }

  if (row.bio && row.bio.length > 2000) {
    errors.push({ field: 'bio', message: 'Bio must be less than 2000 characters' });
  }

  if (row.achievements && row.achievements.length > 2000) {
    errors.push({ field: 'achievements', message: 'Achievements must be less than 2000 characters' });
  }

  return errors;
}

function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const expectedHeaders = [
    'type', 'category', 'first_name', 'last_name', 'job_title', 'company_name',
    'email', 'phone', 'country', 'linkedin', 'website', 'bio', 'achievements',
    'why_vote_for_me', 'company_size', 'industry', 'logo_url', 'headshot_url',
    'nominator_name', 'nominator_email', 'nominator_company', 'nominator_job_title',
    'nominator_phone', 'nominator_country'
  ];

  // Validate headers
  const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
  }

  const rows: CSVRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    rows.push(row as CSVRow);
  }

  return rows;
}

async function createNominationFromRow(
  row: CSVRow, 
  batchId: string, 
  rowNumber: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const nominationId = uuidv4();
    
    // Prepare nominee data
    const nomineeData = {
      type: row.type,
      email: row.email,
      phone: row.phone || '',
      country: row.country,
      linkedin: row.linkedin || '',
      bio: row.bio || '',
      achievements: row.achievements || '',
      whyVoteForMe: row.why_vote_for_me,
      ...(row.type === 'person' ? {
        firstName: row.first_name,
        lastName: row.last_name,
        jobTitle: row.job_title,
        displayName: `${row.first_name} ${row.last_name}`,
        headshotUrl: row.headshot_url || ''
      } : {
        name: row.company_name,
        companyName: row.company_name,
        displayName: row.company_name,
        website: row.website || '',
        size: row.company_size || '',
        industry: row.industry || '',
        logoUrl: row.logo_url || ''
      })
    };

    // Prepare company data (for person nominations)
    const companyData = row.type === 'person' ? {
      name: row.company_name || '',
      companyName: row.company_name || ''
    } : null;

    // Prepare nominator data
    const nominatorData = {
      name: row.nominator_name,
      email: row.nominator_email,
      company: row.nominator_company || '',
      jobTitle: row.nominator_job_title || '',
      phone: row.nominator_phone || '',
      country: row.nominator_country || ''
    };

    // Generate unique key
    const uniqueKey = row.type === 'person' 
      ? `${row.first_name}-${row.last_name}-${row.category}-${row.nominator_email}`.toLowerCase()
      : `${row.company_name}-${row.category}-${row.nominator_email}`.toLowerCase();

    // Insert nomination
    const { error } = await supabase
      .from('nominations')
      .insert({
        id: nominationId,
        category: row.category,
        type: row.type,
        nominee_data: nomineeData,
        company_data: companyData,
        nominator_data: nominatorData,
        why_nominated: `Bulk uploaded nomination for ${row.type === 'person' ? `${row.first_name} ${row.last_name}` : row.company_name}`,
        why_vote_for_me: row.why_vote_for_me,
        unique_key: uniqueKey,
        status: 'pending', // Draft status for manual approval
        upload_source: 'bulk_upload',
        bulk_upload_batch_id: batchId,
        bulk_upload_row_number: rowNumber,
        uploaded_by: 'admin',
        uploaded_at: new Date().toISOString(),
        image_url: row.type === 'person' ? row.headshot_url : row.logo_url
      });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating nomination:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication is now handled by middleware

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        { success: false, error: 'File must be a CSV' },
        { status: 400 }
      );
    }

    // Read file content
    const csvText = await file.text();
    
    // Parse CSV
    let rows: CSVRow[];
    try {
      rows = parseCSV(csvText);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'Invalid CSV format' },
        { status: 400 }
      );
    }

    // Create batch record
    const batchId = uuidv4();
    const { error: batchError } = await supabase
      .from('bulk_upload_batches')
      .insert({
        id: batchId,
        filename: file.name,
        total_rows: rows.length,
        uploaded_by: 'admin',
        status: 'processing'
      });

    if (batchError) {
      throw batchError;
    }

    // Process each row
    let successfulRows = 0;
    let failedRows = 0;
    const errors: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because CSV is 1-indexed and we skip header

      // Validate row
      const validationErrors = validateRow(row, rowNumber);
      
      if (validationErrors.length > 0) {
        failedRows++;
        
        // Store errors in database
        for (const validationError of validationErrors) {
          await supabase
            .from('bulk_upload_errors')
            .insert({
              batch_id: batchId,
              row_number: rowNumber,
              field_name: validationError.field,
              error_message: validationError.message,
              raw_data: row
            });
        }

        // Update nomination with error
        const nominationId = uuidv4();
        await supabase
          .from('nominations')
          .insert({
            id: nominationId,
            category: row.category || 'unknown',
            type: row.type || 'person',
            nominee_data: row,
            nominator_data: { name: row.nominator_name || '', email: row.nominator_email || '' },
            why_nominated: 'Bulk upload - validation failed',
            why_vote_for_me: row.why_vote_for_me || '',
            unique_key: `failed-${batchId}-${rowNumber}`,
            status: 'rejected',
            upload_source: 'bulk_upload',
            bulk_upload_batch_id: batchId,
            bulk_upload_row_number: rowNumber,
            bulk_upload_errors: JSON.stringify(validationErrors),
            uploaded_by: 'admin',
            uploaded_at: new Date().toISOString()
          });

        continue;
      }

      // Create nomination
      const result = await createNominationFromRow(row, batchId, rowNumber);
      
      if (result.success) {
        successfulRows++;
      } else {
        failedRows++;
        
        // Store error
        await supabase
          .from('bulk_upload_errors')
          .insert({
            batch_id: batchId,
            row_number: rowNumber,
            error_message: result.error || 'Unknown error',
            raw_data: row
          });
      }
    }

    // Update batch status
    const batchStatus = failedRows === rows.length ? 'failed' : 'completed';
    await supabase
      .from('bulk_upload_batches')
      .update({
        processed_rows: rows.length,
        successful_rows: successfulRows,
        failed_rows: failedRows,
        status: batchStatus,
        completed_at: new Date().toISOString(),
        error_summary: failedRows > 0 ? `${failedRows} rows failed validation` : null
      })
      .eq('id', batchId);

    return NextResponse.json({
      success: true,
      data: {
        batch_id: batchId,
        total_rows: rows.length,
        successful_rows: successfulRows,
        failed_rows: failedRows,
        status: batchStatus
      }
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      },
      { status: 500 }
    );
  }
}