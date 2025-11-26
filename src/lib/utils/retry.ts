/**
 * Retry utility for failed operations
 */

export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential';
  onRetry?: (attempt: number, error: Error) => void;
}

const defaultOptions: Required<RetryOptions> = {
  maxAttempts: 3,
  delay: 1000,
  backoff: 'exponential',
  onRetry: () => {},
};

/**
 * Retry a function with exponential or linear backoff
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const opts = { ...defaultOptions, ...options };
  let lastError: Error;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === opts.maxAttempts) {
        console.error(`[Retry] ❌ Max attempts (${opts.maxAttempts}) reached`);
        throw lastError;
      }

      const delay = opts.backoff === 'exponential'
        ? opts.delay * Math.pow(2, attempt - 1)
        : opts.delay * attempt;

      opts.onRetry(attempt, lastError);
      console.warn(`[Retry] ⚠️ Attempt ${attempt}/${opts.maxAttempts} failed, retrying in ${delay}ms...`);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
};

/**
 * Retry with custom condition
 */
export const retryUntil = async <T>(
  fn: () => Promise<T>,
  condition: (result: T) => boolean,
  options: RetryOptions = {}
): Promise<T> => {
  const opts = { ...defaultOptions, ...options };
  let lastError: Error;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      const result = await fn();
      if (condition(result)) {
        return result;
      }
      throw new Error('Condition not met');
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === opts.maxAttempts) {
        console.error(`[Retry] ❌ Max attempts (${opts.maxAttempts}) reached`);
        throw lastError;
      }

      const delay = opts.backoff === 'exponential'
        ? opts.delay * Math.pow(2, attempt - 1)
        : opts.delay * attempt;

      opts.onRetry(attempt, lastError);
      console.warn(`[Retry] ⚠️ Attempt ${attempt}/${opts.maxAttempts} failed, retrying in ${delay}ms...`);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
};

