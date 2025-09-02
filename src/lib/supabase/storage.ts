import { supabase as supabaseAdmin } from './server';

export interface UploadImageOptions {
  file: File;
  bucket: string;
  path: string;
  upsert?: boolean;
}

export interface UploadImageResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Upload an image to Supabase Storage
 */
export async function uploadImage({
  file,
  bucket,
  path,
  upsert = true
}: UploadImageOptions): Promise<UploadImageResult> {
  try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, fileBuffer, {
        contentType: file.type,
        upsert,
        cacheControl: '3600'
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path
    };

  } catch (error) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Delete an image from Supabase Storage
 */
export async function deleteImage(bucket: string, path: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Supabase storage delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Image delete error:', error);
    return false;
  }
}

/**
 * Generate a unique file path for storage
 */
export function generateStoragePath(
  type: 'headshot' | 'logo',
  slug: string,
  fileExtension: string
): string {
  const timestamp = Date.now();
  const folder = type === 'headshot' ? 'headshots' : 'logos';
  return `${folder}/${slug}-${timestamp}.${fileExtension}`;
}

/**
 * Get file extension from MIME type
 */
export function getFileExtension(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/svg+xml': 'svg',
    'image/webp': 'webp'
  };
  return mimeToExt[mimeType] || 'jpg';
}