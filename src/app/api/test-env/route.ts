import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const envCheck = {
      // Supabase Configuration
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_KEY: !!process.env.SUPABASE_KEY,
      supabaseKey: !!process.env.supabaseKey,
      
      // HubSpot Configuration
      HUBSPOT_ACCESS_TOKEN: !!process.env.HUBSPOT_ACCESS_TOKEN,
      HUBSPOT_TOKEN: !!process.env.HUBSPOT_TOKEN,
      HUBSPOT_SYNC_ENABLED: process.env.HUBSPOT_SYNC_ENABLED,
      HUBSPOT_CONTACT_LINKEDIN_KEY: process.env.HUBSPOT_CONTACT_LINKEDIN_KEY || 'linkedin (default)',
      HUBSPOT_COMPANY_LINKEDIN_KEY: process.env.HUBSPOT_COMPANY_LINKEDIN_KEY || 'linkedin_company_page (default)',
      HUBSPOT_PIPELINE_ID: process.env.HUBSPOT_PIPELINE_ID || 'default-pipeline (default)',
      
      // Loops Configuration
      LOOPS_API_KEY: !!process.env.LOOPS_API_KEY,
      LOOPS_SYNC_ENABLED: process.env.LOOPS_SYNC_ENABLED,
      
      // System
      NODE_ENV: process.env.NODE_ENV,
      
      // Computed Values
      supabase_url_available: !!(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
      supabase_key_available: !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.supabaseKey),
    };

    return NextResponse.json({
      message: 'Environment variables check - Updated for Vercel compatibility',
      env: envCheck,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to check environment variables',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}