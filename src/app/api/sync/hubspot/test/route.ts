import { NextRequest, NextResponse } from 'next/server';
import { testHubSpotConnection } from '@/server/hubspot/sync';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing HubSpot connection...');

    const result = await testHubSpotConnection();
    
    if (result.success) {
      console.log('HubSpot connection test successful');
      return NextResponse.json({
        success: true,
        accountId: result.accountId,
        message: 'HubSpot connection is working',
      });
    } else {
      console.error('HubSpot connection test failed:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('HubSpot connection test API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}