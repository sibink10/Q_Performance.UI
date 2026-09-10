const DEFAULT_MIN_MS = 150;
const DEFAULT_MAX_MS = 500;

/**
 * Resolves after a delay. When `ms` is omitted, uses a random 150–500 ms window.
 */
export function delay(ms?: number): Promise<void> {
  const waitMs =
    ms ??
    Math.floor(Math.random() * (DEFAULT_MAX_MS - DEFAULT_MIN_MS + 1)) + DEFAULT_MIN_MS;

  return new Promise((resolve) => {
    setTimeout(resolve, waitMs);
  });
}
