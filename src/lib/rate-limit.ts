import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (use Redis in production)
const store: RateLimitStore = {};

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export function rateLimit(config: RateLimitConfig) {
  return (request: NextRequest): { success: boolean; limit: number; remaining: number; resetTime: number } => {
    const ip = getClientIP(request);
    const key = `rate_limit:${ip}`;
    const now = Date.now();
    
    let entry = store[key];
    
    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired entry
      entry = {
        count: 1,
        resetTime: now + config.windowMs
      };
      store[key] = entry;
      
      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        resetTime: entry.resetTime
      };
    }
    
    if (entry.count >= config.maxRequests) {
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime: entry.resetTime
      };
    }
    
    entry.count++;
    
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  };
}

function getClientIP(request: NextRequest): string {
  // Try various headers for the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback to connection remote address
  return request.ip || 'unknown';
}

// Predefined rate limiters
export const voteRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10 // 10 votes per minute per IP
});

export const dailyVoteRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  maxRequests: 200 // 200 votes per day per IP
});