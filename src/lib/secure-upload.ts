/**
 * Secure file upload utilities
 */

export interface SecureUploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

const DEFAULT_OPTIONS: Required<SecureUploadOptions> = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
  allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf']
};

export function validateFile(file: File, options: SecureUploadOptions = {}): { valid: boolean; error?: string } {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Check file size
  if (file.size > opts.maxSize) {
    return {
      valid: false,
      error: `File size too large. Maximum size is ${opts.maxSize / (1024 * 1024)}MB.`
    };
  }
  
  // Check MIME type
  if (!opts.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${opts.allowedTypes.join(', ')}`
    };
  }
  
  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !opts.allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension not allowed. Allowed extensions: ${opts.allowedExtensions.join(', ')}`
    };
  }
  
  return { valid: true };
}

export async function getSignedUploadUrl(fileName: string, fileType: string, fileSize: number) {
  const response = await fetch('/api/uploads/sign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName,
      fileType,
      fileSize
    })
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to get upload URL');
  }
  
  return data;
}

export async function uploadFileSecurely(file: File, options: SecureUploadOptions = {}) {
  // Validate file
  const validation = validateFile(file, options);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  // Get signed upload URL
  const { uploadUrl, path } = await getSignedUploadUrl(file.name, file.type, file.size);
  
  // Upload file directly to storage
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    }
  });
  
  if (!uploadResponse.ok) {
    throw new Error('Failed to upload file');
  }
  
  return {
    path,
    url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/wsa-uploads/${path}`,
    size: file.size,
    type: file.type
  };
}

/**
 * Detect file type from buffer (server-side validation)
 */
export function detectFileType(buffer: ArrayBuffer): string | null {
  const bytes = new Uint8Array(buffer);
  
  // JPEG
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return 'image/jpeg';
  }
  
  // PNG
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return 'image/png';
  }
  
  // WebP
  if (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return 'image/webp';
  }
  
  // PDF
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return 'application/pdf';
  }
  
  return null;
}