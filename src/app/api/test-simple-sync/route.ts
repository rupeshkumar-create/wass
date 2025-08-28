import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Simple sync test with data:', JSON.stringify(body, null, 2));
    
    const token = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_TOKEN;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'HUBSPOT_ACCESS_TOKEN or HUBSPOT_TOKEN not configured' },
        { status: 500 }
      );
    }
    
    // Create a simple contact
    const contactData = {
      properties: {
        email: body.email || 'simple.sync@example.com',
        firstname: body.firstname || 'Simple',
        lastname: body.lastname || 'Sync',
        source: 'WSA26',
        source_detail: 'WSS26',
        wsa_year: 2026,
        wsa_role: 'Nominator'
      }
    };
    
    console.log('Creating contact with data:', JSON.stringify(contactData, null, 2));
    
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contactData)
    });
    
    console.log('HubSpot response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('Contact created successfully:', result.id);
      
      return NextResponse.json({
        success: true,
        contactId: result.id
      });
    } else {
      const errorText = await response.text();
      console.error('HubSpot error:', errorText);
      
      return NextResponse.json(
        { success: false, error: `HubSpot error: ${response.status} - ${errorText}` },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Simple sync error:', error);
    
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}