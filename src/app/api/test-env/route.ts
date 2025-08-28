import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasToken: !!process.env.HUBSPOT_TOKEN,
    tokenLength: process.env.HUBSPOT_TOKEN?.length || 0,
    contactLinkedInKey: process.env.HUBSPOT_CONTACT_LINKEDIN_KEY,
    companyLinkedInKey: process.env.HUBSPOT_COMPANY_LINKEDIN_KEY,
    pipelineId: process.env.HUBSPOT_PIPELINE_ID,
    stageSubmitted: process.env.HUBSPOT_STAGE_SUBMITTED,
    stageApproved: process.env.HUBSPOT_STAGE_APPROVED,
  });
}