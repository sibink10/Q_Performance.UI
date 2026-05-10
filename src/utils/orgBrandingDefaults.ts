/**
 * Defaults when the API omits fields or is unreachable.
 * Backend contract: GET/PATCH `/performance/org-branding` — see `performanceService` module comment.
 */
import type { OrgBranding } from '../types/orgBranding';
import { DEFAULT_BRAND_PRIMARY } from '../types/them';
import defaultLogo from '../assets/qubiqon_logo.png';

export const DEFAULT_PERFORMANCE_REVIEW_GUIDE_URL =
  'https://qubiqon.sharepoint.com/SitePages/Performance-Review-&-Appraisal-at-Qubiqon.aspx';

function isValidHex6(s: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(String(s || '').trim());
}

export const DEFAULT_ORG_BRANDING: OrgBranding = {
  organizationName: '',
  moduleName: 'QHRMS',
  moduleSubtitle: 'Performance',
  logoUrl: typeof defaultLogo === 'string' ? defaultLogo : String(defaultLogo),
  companyLogoUrl: '',
  loginLogoUrl: '',
  faviconUrl: '',
  bannerUrl: '',
  themePrimaryColor: DEFAULT_BRAND_PRIMARY,
  supportUrl: DEFAULT_PERFORMANCE_REVIEW_GUIDE_URL,
  documentTitle: 'QHRMS - Performance',
};

function val(
  remote: Partial<OrgBranding> | null | undefined,
  key: keyof OrgBranding,
  fallback: string,
): string {
  if (!remote || remote[key] === undefined || remote[key] === null) return fallback;
  const s = String(remote[key]).trim();
  return s || fallback;
}

/**
 * Merge API payload with built-in defaults.
 * `loginLogoUrl` uses `logoUrl` when unset or blank.
 */
export function mergeOrgBranding(remote: Partial<OrgBranding> | null | undefined): OrgBranding {
  const base = DEFAULT_ORG_BRANDING;
  const logoUrl = val(remote, 'logoUrl', base.logoUrl) || base.logoUrl;
  const loginLogoUrl = val(remote, 'loginLogoUrl', '') || logoUrl;
  const themeRaw = val(remote, 'themePrimaryColor', '');
  const themePrimaryColor = isValidHex6(themeRaw) ? themeRaw.trim() : DEFAULT_BRAND_PRIMARY;

  return {
    organizationName: val(remote, 'organizationName', ''),
    moduleName: val(remote, 'moduleName', base.moduleName),
    moduleSubtitle: val(remote, 'moduleSubtitle', base.moduleSubtitle),
    logoUrl,
    companyLogoUrl: val(remote, 'companyLogoUrl', ''),
    loginLogoUrl,
    faviconUrl: val(remote, 'faviconUrl', ''),
    bannerUrl: val(remote, 'bannerUrl', ''),
    themePrimaryColor,
    supportUrl: val(remote, 'supportUrl', base.supportUrl) || base.supportUrl,
    documentTitle: val(remote, 'documentTitle', base.documentTitle) || base.documentTitle,
  };
}
