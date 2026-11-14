import { logError } from "./logger";

/**
 * Awaits a non-critical query and falls back instead of failing the request
 * (e.g. zero media counts or no thumbnail), logging the error as a 500 so it
 * still gets noticed.
 */
export async function settle<T, F>(
  p: Promise<T>,
  operation: string,
  fallback: F,
): Promise<T | F> {
  try {
    return await p;
  } catch (e) {
    logError(e, { forceServerError: true, operation });
    return fallback;
  }
}
