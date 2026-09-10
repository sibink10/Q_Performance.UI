import { delay } from '../../utils/mockDelay';

/**
 * Resolves mock data after an optional simulated network delay.
 * Mirrors the async signature future Axios-backed services will expose.
 */
export async function resolveMock<T>(data: T, delayMs?: number): Promise<T> {
  await delay(delayMs);
  return data;
}
