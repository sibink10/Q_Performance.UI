// Holds React Router navigate + optional Redux cleanup registered from components
// inside the router, so Axios can react to 401 without a full page reload.

type NavigateCompat = ((to: string, opts?: { replace?: boolean }) => void) | null;

let navigateFn: NavigateCompat = null;
let onUnauthorizedFn: (() => void) | null = null;

type Handlers =
  | {
      navigate: NavigateCompat;
      onUnauthorized?: (() => void) | null;
    }
  | null
  | undefined;

/** Call from AuthBootstrap once navigate + dispatch are available. */
export function registerNavigationService(handlers: Handlers) {
  if (!handlers) {
    navigateFn = null;
    onUnauthorizedFn = null;
    return;
  }
  navigateFn = handlers.navigate ?? null;
  onUnauthorizedFn = handlers.onUnauthorized ?? null;
}

/** Session expired — clear auth (if handler registered), then SPA navigate to login. */
export function navigateToLoginAfterUnauthorized() {
  try {
    onUnauthorizedFn?.();
  } catch {
    localStorage.removeItem('qhrms_token');
  }

  if (typeof navigateFn === 'function') {
    navigateFn('/login', { replace: true });
  } else {
    localStorage.removeItem('qhrms_token');
    window.location.assign('/login');
  }
}
