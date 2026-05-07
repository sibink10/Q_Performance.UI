/**
 * Main layout top bar: title derived from the current route.
 */
export function getAppBarTitle(pathname: string, search: string): string {
  const path = pathname.replace(/\/$/, '') || '/';
  const mode = new URLSearchParams(search).get('mode') || 'self';

  if (path === '/performance' || path === '/') {
    return 'My reviews';
  }
  if (path.startsWith('/performance/review')) {
    if (mode === 'manager') return 'Manager evaluation';
    if (mode === 'hr') return 'HR review';
    return 'Self evaluation';
  }
  if (path === '/performance/results') {
    return 'My results';
  }
  if (/^\/performance\/results\//.test(path)) {
    return 'Result details';
  }
  if (path === '/operations/performance') {
    return 'Performance dashboard';
  }
  if (path === '/operations/performance/assign') {
    return 'Assign review form';
  }
  if (path === '/operations/performance/assignments') {
    return 'Assigned review forms';
  }
  if (path === '/operations/performance/assignments/employees') {
    return 'Assigned employees';
  }
  if (path === '/config/performance/financial-years') {
    return 'Financial years';
  }
  if (path === '/config/performance/appraisal-config') {
    return 'Appraisal configuration';
  }
  if (path === '/config/performance/focus-areas') {
    return 'Focus areas';
  }
  if (path === '/config/performance/review-forms') {
    return 'Review forms';
  }
  if (path === '/config/performance/review-forms/new') {
    return 'Create review form';
  }
  if (/^\/config\/performance\/review-forms\//.test(path)) {
    return 'Edit review form';
  }

  return 'Performance';
}
