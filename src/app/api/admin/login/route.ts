import { NextRequest, NextResponse } from 'next/server';
import { validateAdminCredentials, signAdminSession, createSessionCookie } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    const isValid = await validateAdminCredentials(email, password);
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Create session token
    const token = await signAdminSession(email, email);
    const cookie = createSessionCookie(token);
    
    const response = NextResponse.json({
      success: true,
      message: 'Login successful'
    });
    
    // Set the HttpOnly cookie
    response.cookies.set(cookie);
    
    return response;
    
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}