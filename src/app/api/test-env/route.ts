import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      HUBSPOT_ACCESS_TOKEN: !!process.env.HUBSPOT_ACCESS_TOKEN,
      LOOPS_API_KEY: !!process.env.LOOPS_API_KEY,
      LOOPS_SYNC_ENABLED: process.env.LOOPS_SYNC_ENABLED,
      NODE_ENV: process.env.NODE_ENV,
    };

    return NextResponse.json({
      message: 'Environment variables check',
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