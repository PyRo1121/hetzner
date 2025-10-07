/**
 * Retry utility with exponential backoff
 * Handles network failures gracefully
 */

interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelayMs * Math.pow(backoffMultiplier, attempt - 1),
        maxDelayMs
      );
      
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * delay;
      const finalDelay = delay + jitter;
      
      if (onRetry) {
        onRetry(attempt, lastError);
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Retry] Attempt ${attempt}/${maxAttempts} failed, retrying in ${Math.round(finalDelay)}ms...`, lastError.message);
      }
      
      await new Promise(resolve => setTimeout(resolve, finalDelay));
    }
  }
  
  throw lastError!;
}

/**
 * Circuit breaker pattern
 * Prevents cascading failures by stopping requests after threshold
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private threshold: number = 5,
    private resetTimeMs: number = 60000
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should reset
    if (this.state === 'open' && Date.now() - this.lastFailureTime > this.resetTimeMs) {
      this.state = 'half-open';
      this.failures = 0;
    }
    
    // Reject if circuit is open
    if (this.state === 'open') {
      throw new Error('Circuit breaker is OPEN - too many failures');
    }
    
    try {
      const result = await fn();
      
      // Success - reset if we were in half-open
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
      }
      
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      
      // Open circuit if threshold exceeded
      if (this.failures >= this.threshold) {
        this.state = 'open';
        console.error(`[Circuit Breaker] OPEN after ${this.failures} failures`);
      }
      
      throw error;
    }
  }
  
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailure: this.lastFailureTime,
    };
  }
}
