import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import * as Papa from 'papaparse';

interface CSVRow {
  type: 'person' | 'company';
  // Person fields
  firstname?: string;
  lastname?: string;
  person_email?: string;
  person_phone?: string;
  person_linkedin?: string;
  jobtitle?: string;
  person_company?: string;
  person_country?: string;
  why_me?: string;
  bio?: string;
  achievements?: string;
  // Company fields
  company_name?: string;
  company_email?: string;
  company_phone?: string;
  company_website?: string;
  company_linkedin?: string;
  company_country?: string;
  company_size?: string;
  company_industry?: string;
  company_domain?: string;
  why_us?: string;
  // Common fields
  subcategory_id: string;
  category_group_id: string;
  live_url?: string;
  social_media?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: any;
  errorType?: 'validation' | 'duplicate' | 'missing_required';
}

export async function POST(request: NextRequest) {
  try {
    // Use the imported supabase client
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 });
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    const csvText = await file.text();
    
    // Parse CSV
    const parseResult = Papa.parse<CSVRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    });

    if (parseResult.errors.length > 0) {
      return NextResponse.json({ 
        error: 'CSV parsing failed', 
        details: parseResult.errors 
      }, { status: 400 });
    }

    const rows = parseResult.data;
    
    // Check row limit (1000 max)
    if (rows.length > 1000) {
      return NextResponse.json({ 
        error: 'Too many rows. Maximum 1000 nominees per upload.' 
      }, { status: 400 });
    }

    const errors: ValidationError[] = [];
    const validRows: (CSVRow & { rowNumber: number })[] = [];
    const duplicateEmails = new Set<string>();

    // Check for duplicate emails within the CSV
    const emailsInFile = new Set<string>();
    rows.forEach((row, index) => {
      const email = row.type === 'person' ? row.person_email : row.company_email;
      if (email) {
        if (emailsInFile.has(email.toLowerCase())) {
          duplicateEmails.add(email.toLowerCase());
        } else {
          emailsInFile.add(email.toLowerCase());
        }
      }
    });

    // Validate each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because index starts at 0 and we have header
      const rowErrors = await validateRow(row, rowNumber, supabase, duplicateEmails);
      
      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        validRows.push({ ...row, rowNumber });
      }
    }

    // Create batch record
    const { data: batch, error: batchError } = await supabase
      .from('bulk_upload_batches')
      .insert({
        filename: file.name,
        total_rows: rows.length,
        uploaded_by: user.email || 'unknown',
        csv_headers: parseResult.meta.fields,
        status: errors.length > 0 ? 'partial' : 'processing',
        processing_notes: `Uploaded ${rows.length} rows, ${validRows.length} valid, ${errors.length} errors`
      })
      .select()
      .single();

    if (batchError) {
      console.error('Batch creation error:', batchError);
      return NextResponse.json({ error: 'Failed to create batch record' }, { status: 500 });
    }

    // Store errors if any
    if (errors.length > 0) {
      const errorRecords = errors.map(error => ({
        batch_id: batch.id,
        row_number: error.row,
        field_name: error.field,
        error_message: error.message,
        error_type: error.errorType || 'validation',
        raw_data: { value: error.value },
        suggested_fix: getSuggestedFix(error)
      }));

      await supabase
        .from('bulk_upload_errors')
        .insert(errorRecords);
    }

    // Process valid rows
    let successCount = 0;
    let failCount = 0;

    for (const row of validRows) {
      try {
        // Create nominee record
        const nomineeData = createNomineeData(row);
        const { data: nominee, error: nomineeError } = await supabase
          .from('nominees')
          .insert(nomineeData)
          .select()
          .single();

        if (nomineeError) {
          throw new Error(`Nominee creation failed: ${nomineeError.message}`);
        }

        // Create nomination record
        const nominationData = {
          nominee_id: nominee.id,
          subcategory_id: parseInt(row.subcategory_id),
          category_group_id: parseInt(row.category_group_id),
          state: 'pending',
          upload_source: 'bulk_upload',
          bulk_upload_batch_id: batch.id,
          bulk_upload_row_number: row.rowNumber,
          uploaded_by: user.email || 'unknown',
          uploaded_at: new Date().toISOString(),
          is_draft: true, // All bulk uploads start as drafts
          sync_to_loops_on_approval: true,
          loops_sync_status: 'pending'
        };

        const { error: nominationError } = await supabase
          .from('nominations')
          .insert(nominationData);

        if (nominationError) {
          throw new Error(`Nomination creation failed: ${nominationError.message}`);
        }

        successCount++;
      } catch (error) {
        failCount++;
        
        // Store individual row error
        await supabase
          .from('bulk_upload_errors')
          .insert({
            batch_id: batch.id,
            row_number: row.rowNumber,
            error_message: error instanceof Error ? error.message : 'Unknown error',
            error_type: 'processing',
            raw_data: row
          });
      }
    }

    // Update batch with final stats
    const finalStatus = failCount > 0 ? 'partial' : 'completed';
    await supabase
      .from('bulk_upload_batches')
      .update({
        processed_rows: successCount + failCount,
        successful_rows: successCount,
        failed_rows: failCount + errors.length,
        draft_rows: successCount, // All successful uploads are drafts
        status: finalStatus,
        completed_at: new Date().toISOString(),
        error_summary: errors.length > 0 ? `${errors.length} validation errors, ${failCount} processing errors` : null
      })
      .eq('id', batch.id);

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      summary: {
        totalRows: rows.length,
        validationErrors: errors.length,
        successfulUploads: successCount,
        failedUploads: failCount,
        pendingApproval: successCount,
        duplicatesFound: duplicateEmails.size
      },
      nextSteps: [
        'Review uploaded nominees in the admin panel',
        'Manually approve each nominee to make them live',
        'Approved nominees will automatically sync to Loops.so',
        'Check the error report for any failed uploads'
      ]
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function validateRow(
  row: CSVRow, 
  rowNumber: number, 
  supabase: any, 
  duplicateEmails: Set<string>
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  // Validate type
  if (!row.type || !['person', 'company'].includes(row.type)) {
    errors.push({
      row: rowNumber,
      field: 'type',
      message: 'Type must be either "person" or "company"',
      value: row.type,
      errorType: 'validation'
    });
  }

  // Validate required fields based on type
  if (row.type === 'person') {
    if (!row.firstname?.trim()) {
      errors.push({
        row: rowNumber,
        field: 'firstname',
        message: 'First name is required for person nominees',
        errorType: 'missing_required'
      });
    }
    if (!row.lastname?.trim()) {
      errors.push({
        row: rowNumber,
        field: 'lastname',
        message: 'Last name is required for person nominees',
        errorType: 'missing_required'
      });
    }
    if (!row.person_email?.trim()) {
      errors.push({
        row: rowNumber,
        field: 'person_email',
        message: 'Email is required for person nominees',
        errorType: 'missing_required'
      });
    } else {
      if (!isValidEmail(row.person_email)) {
        errors.push({
          row: rowNumber,
          field: 'person_email',
          message: 'Invalid email format',
          value: row.person_email,
          errorType: 'validation'
        });
      }
      
      // Check for duplicates in CSV
      if (duplicateEmails.has(row.person_email.toLowerCase())) {
        errors.push({
          row: rowNumber,
          field: 'person_email',
          message: 'Duplicate email found in CSV file',
          value: row.person_email,
          errorType: 'duplicate'
        });
      }
      
      // Check for existing nominees in database
      const { data: existingNominee } = await supabase
        .from('nominees')
        .select('id')
        .eq('person_email', row.person_email.trim())
        .single();
        
      if (existingNominee) {
        errors.push({
          row: rowNumber,
          field: 'person_email',
          message: 'Email already exists in database',
          value: row.person_email,
          errorType: 'duplicate'
        });
      }
    }
    
    if (!row.why_me?.trim()) {
      errors.push({
        row: rowNumber,
        field: 'why_me',
        message: 'Why me description is required for person nominees',
        errorType: 'missing_required'
      });
    } else if (row.why_me.length > 500) {
      errors.push({
        row: rowNumber,
        field: 'why_me',
        message: 'Why me description must be 500 characters or less',
        value: `${row.why_me.length} characters`,
        errorType: 'validation'
      });
    }
  } else if (row.type === 'company') {
    if (!row.company_name?.trim()) {
      errors.push({
        row: rowNumber,
        field: 'company_name',
        message: 'Company name is required for company nominees',
        errorType: 'missing_required'
      });
    }
    if (!row.company_email?.trim()) {
      errors.push({
        row: rowNumber,
        field: 'company_email',
        message: 'Email is required for company nominees',
        errorType: 'missing_required'
      });
    } else {
      if (!isValidEmail(row.company_email)) {
        errors.push({
          row: rowNumber,
          field: 'company_email',
          message: 'Invalid email format',
          value: row.company_email,
          errorType: 'validation'
        });
      }
      
      // Check for duplicates in CSV
      if (duplicateEmails.has(row.company_email.toLowerCase())) {
        errors.push({
          row: rowNumber,
          field: 'company_email',
          message: 'Duplicate email found in CSV file',
          value: row.company_email,
          errorType: 'duplicate'
        });
      }
      
      // Check for existing nominees in database
      const { data: existingNominee } = await supabase
        .from('nominees')
        .select('id')
        .eq('company_email', row.company_email.trim())
        .single();
        
      if (existingNominee) {
        errors.push({
          row: rowNumber,
          field: 'company_email',
          message: 'Email already exists in database',
          value: row.company_email,
          errorType: 'duplicate'
        });
      }
    }
    
    if (!row.why_us?.trim()) {
      errors.push({
        row: rowNumber,
        field: 'why_us',
        message: 'Why us description is required for company nominees',
        errorType: 'missing_required'
      });
    } else if (row.why_us.length > 500) {
      errors.push({
        row: rowNumber,
        field: 'why_us',
        message: 'Why us description must be 500 characters or less',
        value: `${row.why_us.length} characters`,
        errorType: 'validation'
      });
    }
  }

  // Validate common required fields
  if (!row.subcategory_id || isNaN(parseInt(row.subcategory_id))) {
    errors.push({
      row: rowNumber,
      field: 'subcategory_id',
      message: 'Valid subcategory ID is required (must be a number)',
      value: row.subcategory_id,
      errorType: 'validation'
    });
  } else {
    // Validate subcategory exists
    const { data: subcategory } = await supabase
      .from('subcategories')
      .select('id')
      .eq('id', parseInt(row.subcategory_id))
      .single();
      
    if (!subcategory) {
      errors.push({
        row: rowNumber,
        field: 'subcategory_id',
        message: 'Subcategory ID does not exist',
        value: row.subcategory_id,
        errorType: 'validation'
      });
    }
  }

  if (!row.category_group_id || isNaN(parseInt(row.category_group_id))) {
    errors.push({
      row: rowNumber,
      field: 'category_group_id',
      message: 'Valid category group ID is required (must be a number)',
      value: row.category_group_id,
      errorType: 'validation'
    });
  }

  // Validate URLs if provided
  if (row.person_linkedin && !isValidUrl(row.person_linkedin)) {
    errors.push({
      row: rowNumber,
      field: 'person_linkedin',
      message: 'Invalid LinkedIn URL format (must start with http:// or https://)',
      value: row.person_linkedin,
      errorType: 'validation'
    });
  }

  if (row.company_linkedin && !isValidUrl(row.company_linkedin)) {
    errors.push({
      row: rowNumber,
      field: 'company_linkedin',
      message: 'Invalid LinkedIn URL format (must start with http:// or https://)',
      value: row.company_linkedin,
      errorType: 'validation'
    });
  }

  if (row.company_website && !isValidUrl(row.company_website)) {
    errors.push({
      row: rowNumber,
      field: 'company_website',
      message: 'Invalid website URL format (must start with http:// or https://)',
      value: row.company_website,
      errorType: 'validation'
    });
  }

  if (row.live_url && !isValidUrl(row.live_url)) {
    errors.push({
      row: rowNumber,
      field: 'live_url',
      message: 'Invalid URL format (must start with http:// or https://)',
      value: row.live_url,
      errorType: 'validation'
    });
  }

  return errors;
}

function getSuggestedFix(error: ValidationError): string {
  switch (error.errorType) {
    case 'missing_required':
      return `Add a value for ${error.field}`;
    case 'duplicate':
      return 'Use a unique email address or remove duplicate entry';
    case 'validation':
      if (error.field.includes('email')) {
        return 'Use format: user@domain.com';
      }
      if (error.field.includes('url') || error.field.includes('linkedin') || error.field.includes('website')) {
        return 'Use format: https://example.com';
      }
      if (error.field.includes('id')) {
        return 'Use a valid numeric ID';
      }
      if (error.field === 'type') {
        return 'Use either "person" or "company"';
      }
      return 'Check the field format and requirements';
    default:
      return 'Review the field value and format';
  }
}

function createNomineeData(row: CSVRow & { rowNumber: number }) {
  const baseData = {
    type: row.type,
    live_url: row.live_url?.trim() || null,
    social_media: row.social_media?.trim() || null
  };

  if (row.type === 'person') {
    return {
      ...baseData,
      firstname: row.firstname?.trim(),
      lastname: row.lastname?.trim(),
      person_email: row.person_email?.trim(),
      person_phone: row.person_phone?.trim() || null,
      person_linkedin: row.person_linkedin?.trim() || null,
      jobtitle: row.jobtitle?.trim() || null,
      person_company: row.person_company?.trim() || null,
      person_country: row.person_country?.trim() || null,
      why_me: row.why_me?.trim(),
      bio: row.bio?.trim() || null,
      achievements: row.achievements?.trim() || null
    };
  } else {
    return {
      ...baseData,
      company_name: row.company_name?.trim(),
      company_email: row.company_email?.trim(),
      company_phone: row.company_phone?.trim() || null,
      company_website: row.company_website?.trim() || null,
      company_linkedin: row.company_linkedin?.trim() || null,
      company_country: row.company_country?.trim() || null,
      company_size: row.company_size?.trim() || null,
      company_industry: row.company_industry?.trim() || null,
      company_domain: row.company_domain?.trim() || null,
      why_us: row.why_us?.trim()
    };
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
}

// GET endpoint to fetch bulk upload status and batches
export async function GET(request: NextRequest) {
  try {
    // Use the imported supabase client
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

    if (batchId) {
      // Get specific batch details
      const { data: batch, error: batchError } = await supabase
        .from('admin_bulk_upload_dashboard')
        .select('*')
        .eq('batch_id', batchId)
        .single();

      if (batchError) {
        return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
      }

      // Get batch errors
      const { data: errors } = await supabase
        .from('bulk_upload_errors')
        .select('*')
        .eq('batch_id', batchId)
        .order('row_number');

      // Get pending nominees from this batch
      const { data: pendingNominees } = await supabase
        .from('admin_bulk_nominees_pending')
        .select('*')
        .eq('bulk_upload_batch_id', batchId)
        .order('bulk_upload_row_number');

      return NextResponse.json({
        batch,
        errors: errors || [],
        pendingNominees: pendingNominees || []
      });
    } else {
      // Get all batches
      const { data: batches, error: batchesError } = await supabase
        .from('admin_bulk_upload_dashboard')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (batchesError) {
        return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 });
      }

      // Get overall stats
      const { data: stats } = await supabase.rpc('get_bulk_upload_stats');

      return NextResponse.json({ 
        batches,
        stats: stats?.[0] || {
          total_batches: 0,
          total_nominees_uploaded: 0,
          pending_approval: 0,
          approved_bulk: 0,
          rejected_bulk: 0,
          draft_nominees: 0,
          failed_uploads: 0
        }
      });
    }

  } catch (error) {
    console.error('Bulk upload GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}