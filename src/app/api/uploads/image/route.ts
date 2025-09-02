import { NextRequest, NextResponse } from "next/server";
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";
import { uploadImage, generateStoragePath, getFileExtension } from "@/lib/supabase/storage";
import crypto from "crypto";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const kind = (formData.get('kind') as string) || 'headshot'; // default to headshot
    const slug = formData.get('slug') as string;
    const nomineeId = formData.get('nomineeId') as string;

    if (!file) {
      return NextResponse.json({ ok: false, error: 'No file provided' }, { status: 400 });
    }

    if (!['headshot', 'logo'].includes(kind)) {
      return NextResponse.json({ ok: false, error: 'Invalid kind. Must be headshot or logo' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Upload JPG, PNG, or SVG only' 
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Max 5MB' 
      }, { status: 400 });
    }

    // Generate storage path
    const name = slug ?? nomineeId ?? crypto.randomUUID();
    const fileExtension = getFileExtension(file.type);
    const storagePath = generateStoragePath(kind as 'headshot' | 'logo', name, fileExtension);

    // Upload to Supabase Storage
    const uploadResult = await uploadImage({
      file,
      bucket: 'images',
      path: storagePath,
      upsert: true
    });

    if (!uploadResult.success) {
      return NextResponse.json({ 
        ok: false, 
        error: uploadResult.error || 'Upload failed' 
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      url: uploadResult.url,
      path: uploadResult.path
    });

  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}