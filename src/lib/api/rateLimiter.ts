/**
 * Rate limiter for OpenF1 API (max 3 requests per second)
 * Ensures we don't exceed the API rate limit
 */

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 400; // 400ms = ~2.5 requests/second (safe margin under 3 req/sec)

/**
 * Rate-limited fetch with automatic retry on 429 errors
 */
export const rateLimitedFetch = async (
  url: string,
  options?: RequestInit,
  retries = 3
): Promise<Response> => {
  const urlShort = url.length > 60 ? url.substring(0, 60) + '...' : url;
  console.log(`[API] 🔄 Request: ${urlShort}`);
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Wait if needed to respect rate limit
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        console.log(`[API] ⏳ Rate limit: waiting ${waitTime}ms (${(waitTime/1000).toFixed(2)}s)`);
        await new Promise((resolve) =>
          setTimeout(resolve, waitTime)
        );
      }

      const startTime = Date.now();
      const response = await fetch(url, options);
      const duration = Date.now() - startTime;
      lastRequestTime = Date.now();
      
      console.log(`[API] ✅ Response: ${response.status} ${response.statusText} (${duration}ms) - ${urlShort}`);

      // Handle rate limit errors
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter
          ? parseInt(retryAfter) * 1000
          : Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s

        if (attempt < retries - 1) {
          console.warn(
            `[API] ⚠️ Rate limited (429), waiting ${waitTime}ms before retry ${attempt + 1}/${retries}`
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }
      }

      if (!response.ok && response.status !== 429) {
        console.error(`[API] ❌ HTTP error! status: ${response.status} - ${urlShort}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      if (attempt === retries - 1) {
        console.error(`[API] ❌ Max retries exceeded for ${urlShort}:`, error);
        throw error;
      }
      const waitTime = Math.pow(2, attempt) * 1000;
      console.warn(`[API] ⚠️ Request failed, retrying in ${waitTime}ms (attempt ${attempt + 1}/${retries}) - ${urlShort}`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw new Error('Max retries exceeded');
};

