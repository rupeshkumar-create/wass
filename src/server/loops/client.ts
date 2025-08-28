import { v4 as uuidv4 } from 'uuid';

/**
 * Loops API client for World Staffing Awards 2026
 * Handles contact management and tagging in Loops
 */
export class LoopsClient {
  private readonly baseUrl = 'https://app.loops.so/api/v1';
  private readonly apiKey: string;
  private readonly maxRetries = 3;

  constructor() {
    this.apiKey = process.env.LOOPS_API_KEY!;
    if (!this.apiKey) {
      throw new Error('LOOPS_API_KEY environment variable is required');
    }
  }

  /**
   * Safe fetch wrapper with authentication and retries
   */
  async loopsFetch(
    path: string,
    options: {
      method?: string;
      body?: any;
      headers?: Record<string, string>;
    } = {}
  ): Promise<any> {
    const { method = 'GET', body, headers = {} } = options;
    
    const url = `${this.baseUrl}${path}`;
    const requestId = uuidv4().slice(0, 8);
    
    // Build headers
    const requestHeaders: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...headers,
    };

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      requestOptions.body = JSON.stringify(body);
    }

    // Log request (without sensitive data)
    console.log(`[${requestId}] Loops ${method} ${path}`, {
      hasBody: !!body,
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
        const error = new LoopsError(
          `Loops API error: ${response.status} ${response.statusText}`,
          response.status,
          errorData
        );
        
        console.error(`[${requestId}] Client error:`, {
          status: response.status,
          message: error.message,
          data: errorData,
        });
        
        throw error;

      } catch (error) {
        lastError = error as Error;
        
        if (error instanceof LoopsError) {
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
    throw new LoopsError(
      `Loops request failed after ${this.maxRetries} attempts: ${lastError?.message}`,
      0,
      null
    );
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  private calculateBackoffDelay(attempt: number): number {
    const baseDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Cap at 10s
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
   * Check if Loops sync is enabled
   */
  static isEnabled(): boolean {
    return process.env.LOOPS_SYNC_ENABLED === 'true' && !!process.env.LOOPS_API_KEY;
  }
}

/**
 * Custom error class for Loops API errors
 */
export class LoopsError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data: any
  ) {
    super(message);
    this.name = 'LoopsError';
  }
}

// Export singleton instance
export const loopsClient = new LoopsClient();