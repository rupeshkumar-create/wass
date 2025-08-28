import { v4 as uuidv4 } from 'uuid';

/**
 * HubSpot API client with authentication, retries, and PII protection
 * Server-side only - never expose tokens to browser
 */
export class HubSpotClient {
  private readonly baseUrl = 'https://api.hubapi.com';
  private readonly token: string;
  private readonly maxRetries = 6;

  constructor() {
    this.token = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_TOKEN!;
    if (!this.token) {
      throw new Error('HUBSPOT_ACCESS_TOKEN or HUBSPOT_TOKEN environment variable is required');
    }
  }

  /**
   * Safe fetch wrapper with authentication, retries, and PII redaction
   */
  async hubFetch(
    path: string,
    options: {
      method?: string;
      body?: any;
      idempotencyKey?: string;
      headers?: Record<string, string>;
    } = {}
  ): Promise<any> {
    const { method = 'GET', body, idempotencyKey, headers = {} } = options;
    
    const url = `${this.baseUrl}${path}`;
    const requestId = uuidv4().slice(0, 8);
    
    // Build headers
    const requestHeaders: Record<string, string> = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'WSA-2026-App/1.0',
      ...headers,
    };

    if (idempotencyKey) {
      requestHeaders['Idempotency-Key'] = idempotencyKey;
    }

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      requestOptions.body = JSON.stringify(body);
    }

    // Log request (without sensitive data)
    console.log(`[${requestId}] HubSpot ${method} ${path}`, {
      hasBody: !!body,
      idempotencyKey: idempotencyKey?.slice(0, 8) + '...',
    });

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        
        // Log response status
        console.log(`[${requestId}] Response: ${response.status} ${response.statusText}`);

        if (response.ok) {
          const data = response.status === 204 ? null : await response.json();
          return data;
        }

        // Handle different error types
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 429) {
          // Rate limited - use exponential backoff
          const delay = this.calculateBackoffDelay(attempt);
          console.warn(`[${requestId}] Rate limited, retrying in ${delay}ms (attempt ${attempt}/${this.maxRetries})`);
          await this.sleep(delay);
          continue;
        }

        if (response.status >= 500) {
          // Server error - retry with backoff
          const delay = this.calculateBackoffDelay(attempt);
          console.warn(`[${requestId}] Server error ${response.status}, retrying in ${delay}ms (attempt ${attempt}/${this.maxRetries})`);
          await this.sleep(delay);
          continue;
        }

        // Client error - don't retry
        const error = new HubSpotError(
          `HubSpot API error: ${response.status} ${response.statusText}`,
          response.status,
          this.redactPII(errorData)
        );
        
        console.error(`[${requestId}] Client error:`, {
          status: response.status,
          message: error.message,
          data: this.redactPII(errorData),
        });
        
        throw error;

      } catch (error) {
        lastError = error as Error;
        
        if (error instanceof HubSpotError) {
          throw error; // Don't retry client errors
        }

        // Network error - retry with backoff
        if (attempt < this.maxRetries) {
          const delay = this.calculateBackoffDelay(attempt);
          console.warn(`[${requestId}] Network error, retrying in ${delay}ms (attempt ${attempt}/${this.maxRetries}):`, error);
          await this.sleep(delay);
          continue;
        }
      }
    }

    // All retries exhausted
    console.error(`[${requestId}] All retries exhausted`);
    throw new HubSpotError(
      `HubSpot request failed after ${this.maxRetries} attempts: ${lastError?.message}`,
      0,
      null
    );
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  private calculateBackoffDelay(attempt: number): number {
    const baseDelay = Math.min(1000 * Math.pow(2, attempt - 1), 30000); // Cap at 30s
    const jitter = Math.random() * 0.1 * baseDelay; // Add 10% jitter
    return Math.floor(baseDelay + jitter);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Redact PII from logs and errors
   */
  private redactPII(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const redacted = { ...data };
    
    // Redact common PII fields
    const piiFields = ['email', 'firstname', 'lastname', 'phone', 'address'];
    
    for (const field of piiFields) {
      if (redacted[field]) {
        if (field === 'email') {
          redacted[field] = this.redactEmail(redacted[field]);
        } else {
          redacted[field] = '***REDACTED***';
        }
      }
    }

    // Recursively redact nested objects
    for (const key in redacted) {
      if (typeof redacted[key] === 'object' && redacted[key] !== null) {
        redacted[key] = this.redactPII(redacted[key]);
      }
    }

    return redacted;
  }

  /**
   * Redact email addresses for logging
   */
  private redactEmail(email: string): string {
    if (!email || typeof email !== 'string') return email;
    const [local, domain] = email.split('@');
    if (!domain) return '***@***';
    return `${local.slice(0, 2)}***@***${domain.slice(-4)}`;
  }

  /**
   * Generate idempotency key
   */
  generateIdempotencyKey(): string {
    return uuidv4();
  }

  /**
   * Check if HubSpot sync is enabled
   */
  static isEnabled(): boolean {
    return process.env.HUBSPOT_SYNC_ENABLED === 'true' && !!(process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_TOKEN);
  }
}

/**
 * Custom error class for HubSpot API errors
 */
export class HubSpotError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data: any
  ) {
    super(message);
    this.name = 'HubSpotError';
  }
}

// Export singleton instance
export const hubspotClient = new HubSpotClient();