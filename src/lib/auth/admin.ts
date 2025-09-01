import { NextRequest } from 'next/server';

/**
 * Admin Authentication Middleware
 * Validates admin access for protected endpoints
 */

const ADMIN_PASSCODES = ['admin123', 'wsa2026'];

export function validateAdminAuth(request: NextRequest): boolean {
  try {
    // Check for admin passcode in headers
    const authHeader = request.headers.get('authorization');
    const adminPasscode = request.headers.get('x-admin-passcode');
    
    // Check Authorization header (Bearer token)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      return ADMIN_PASSCODES.includes(token);
    }
    
    // Check custom admin passcode header
    if (adminPasscode && ADMIN_PASSCODES.includes(adminPasscode)) {
      return true;
    }
    
    // Check query parameter (for development only)
    const url = new URL(request.url);
    const queryPasscode = url.searchParams.get('admin_key');
    if (queryPasscode && ADMIN_PASSCODES.includes(queryPasscode)) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Admin auth validation error:', error);
    return false;
  }
}

export function createAuthErrorResponse() {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Unauthorized access. Admin authentication required.',
      code: 'ADMIN_AUTH_REQUIRED'
    }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Bearer realm="Admin Panel"'
      }
    }
  );
}