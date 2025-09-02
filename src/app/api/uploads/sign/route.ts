import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

// Allowed MIME types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'application/pdf'
];

// Max file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const { fileName, fileType, fileSize } = await request.json();
    
    if (!fileName || !fileType || !fileSize) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: fileName, fileType, fileSize' },
        { status: 400 }
      );
    }
    
    // Validate file type
    if (!ALLOWED_TYPES.includes(fileType)) {
      return NextResponse.json(
        { success: false, error: 'File type not allowed. Only images and PDFs are permitted.' },
        { status: 400 }
      );
    }
    
    // Validate file size
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File size too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` },
        { status: 400 }
      );
    }
    
    // Generate secure file path
    const fileExtension = fileName.split('.').pop() || 'bin';
    const uniqueId = uuidv4();
    const timestamp = Date.now();
    const securePath = `uploads/${timestamp}/${uniqueId}.${fileExtension}`;
    
    // Create signed upload URL (expires in 5 minutes)
    const { data, error } = await supabase.storage
      .from('wsa-uploads')
      .createSignedUploadUrl(securePath, {
        expiresIn: 300, // 5 minutes
        upsert: false
      });
    
    if (error) {
      console.error('Supabase storage error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create upload URL' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      uploadUrl: data.signedUrl,
      path: securePath,
      expiresIn: 300
    });
    
  } catch (error) {
    console.error('Upload signing error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}