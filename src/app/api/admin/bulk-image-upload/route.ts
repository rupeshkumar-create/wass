import { NextRequest, NextResponse } from 'next/server';
import { nominationsStore } from '@/lib/storage/local-json';

export const dynamic = 'force-static';
export const revalidate = false;

export async function POST(request: NextRequest) {


  try {
    const { nominationId, imageUrl } = await request.json();
    
    if (!nominationId || !imageUrl) {
      return NextResponse.json({
        success: false,
        error: 'Missing nominationId or imageUrl'
      }, { status: 400 });
    }
    
    // Get the nomination
    const nomination = await nominationsStore.findById(nominationId);
    if (!nomination) {
      return NextResponse.json({
        success: false,
        error: 'Nomination not found'
      }, { status: 404 });
    }
    
    // Update the nomination with the new image URL
    await nominationsStore.update(nominationId, {
      nominee: {
        ...nomination.nominee,
        imageUrl: imageUrl
      }
    });
    
    return NextResponse.json({
      success: true,
      message: `Image updated for ${nomination.nominee.name}`,
      nominationId,
      imageUrl
    });
    
  } catch (error) {
    console.error('Bulk image upload error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Return nominations without images
    const allNominations = await nominationsStore.list();
    const nominationsWithoutImages = allNominations.filter(n => !n.nominee.imageUrl);
    
    return NextResponse.json({
      success: true,
      count: nominationsWithoutImages.length,
      nominations: nominationsWithoutImages.map(n => ({
        id: n.id,
        name: n.nominee.name,
        category: n.category,
        type: n.type,
        status: n.status
      }))
    });
    
  } catch (error) {
    console.error('Get nominations without images error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}