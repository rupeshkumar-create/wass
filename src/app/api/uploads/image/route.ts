import { NextRequest, NextResponse } from "next/server";
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";
import crypto from "crypto";
import fs from "fs";
import path from "path";

export const runtime = 'nodejs';


export const dynamic = 'force-static';
export const revalidate = false;

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

    // Build path
    const dir = kind === 'logo' ? 'logos' : 'headshots';
    const name = slug ?? nomineeId ?? crypto.randomUUID();
    
    // Map MIME type to extension
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg', 
      'image/png': 'png',
      'image/svg+xml': 'svg'
    };
    const ext = mimeToExt[file.type] || 'jpg';
    const fileName = `${name}.${ext}`;
    const filePath = `${dir}/${fileName}`;

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', dir);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Save file to local storage
    const fullPath = path.join(uploadsDir, fileName);
    fs.writeFileSync(fullPath, Buffer.from(buffer));

    // Return public URL
    const publicUrl = `/uploads/${filePath}`;

    return NextResponse.json({
      ok: true,
      url: publicUrl,
      path: filePath
    });

  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}