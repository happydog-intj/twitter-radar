/**
 * Process items in concurrent batches with retry logic
 */
export async function processConcurrently<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: {
    concurrency?: number;
    retries?: number;
    retryDelay?: number;
    onProgress?: (current: number, total: number) => void;
  } = {}
): Promise<R[]> {
  const {
    concurrency = 5,
    retries = 3,
    retryDelay = 1000,
    onProgress,
  } = options;

  const results: R[] = [];
  const errors: Array<{ item: T; error: any }> = [];

  // Process in batches
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);

    const batchPromises = batch.map(async (item, batchIndex) => {
      const globalIndex = i + batchIndex;

      // Retry logic
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const result = await processor(item);

          if (onProgress) {
            onProgress(globalIndex + 1, items.length);
          }

          return result;
        } catch (error) {
          if (attempt === retries) {
            console.error(`❌ Failed after ${retries} retries:`, error);
            errors.push({ item, error });
            throw error;
          }

          // Exponential backoff
          const delay = retryDelay * Math.pow(2, attempt);
          console.error(`⚠️ Attempt ${attempt + 1}/${retries + 1} failed, retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      throw new Error('Unreachable');
    });

    // Wait for batch to complete
    const batchResults = await Promise.allSettled(batchPromises);

    // Collect successful results
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
    }
  }

  if (errors.length > 0) {
    console.error(`\n⚠️ Processing completed with ${errors.length} errors out of ${items.length} items`);
  }

  return results;
}

/**
 * Rate limiter using token bucket algorithm
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private maxTokens: number,
    private refillRate: number // tokens per second
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000; // seconds
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  async acquire(tokens: number = 1): Promise<void> {
    while (true) {
      this.refill();

      if (this.tokens >= tokens) {
        this.tokens -= tokens;
        return;
      }

      // Wait until we can acquire tokens
      const tokensNeeded = tokens - this.tokens;
      const waitTime = (tokensNeeded / this.refillRate) * 1000;
      await new Promise((resolve) => setTimeout(resolve, Math.ceil(waitTime)));
    }
  }
}

/**
 * Circuit breaker pattern for API calls
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
        console.error('🔄 Circuit breaker: half-open, trying request...');
      } else {
        throw new Error('Circuit breaker is OPEN - too many failures');
      }
    }

    try {
      const result = await fn();

      if (this.state === 'half-open') {
        console.error('✅ Circuit breaker: closed, recovered from failures');
        this.state = 'closed';
        this.failures = 0;
      }

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.threshold) {
        this.state = 'open';
        console.error(`🚨 Circuit breaker: OPEN after ${this.failures} failures`);
      }

      throw error;
    }
  }

  reset(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  getState(): string {
    return this.state;
  }
}
