import { NextRequest } from 'next/server';
import { verifyAdminSession } from './session';

/**
 * DEPRECATED: Legacy admin authentication - use middleware.ts instead
 * This file is kept for backward compatibility during migration
 */

export async function validateAdminAuth(request: NextRequest): Promise<boolean> {
  try {
    // Check for session cookie (new method)
    const sessionCookie = request.cookies.get('admin_session')?.value;
    if (sessionCookie) {
      const session = await verifyAdminSession(sessionCookie);
      return !!session;
    }
    
    // Check for admin user header set by middleware
    const adminUser = request.headers.get('x-admin-user');
    if (adminUser) {
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