import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(
  process.env.SERVER_SESSION_SECRET || 'fallback-secret-min-32-chars-long'
);

export interface AdminSession {
  userId: string;
  email: string;
  role: 'admin';
  iat: number;
  exp: number;
}

export async function signAdminSession(userId: string, email: string): Promise<string> {
  return await new SignJWT({ userId, email, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifyAdminSession(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as AdminSession;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export async function validateAdminCredentials(email: string, password: string): Promise<boolean> {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  const adminHashes = process.env.ADMIN_PASSWORD_HASHES?.split(',') || [];
  
  const emailIndex = adminEmails.findIndex(adminEmail => adminEmail.trim() === email);
  if (emailIndex === -1) return false;
  
  const hash = adminHashes[emailIndex];
  if (!hash) return false;
  
  return await bcrypt.compare(password, hash.trim());
}

export function createSessionCookie(token: string) {
  return {
    name: 'admin_session',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/'
  };
}