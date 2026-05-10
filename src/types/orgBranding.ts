/**
 * Organization branding returned by `GET /performance/org-branding` and sent on
 * `PATCH /performance/org-branding` (partial update). See `performanceService` JSDoc.
 * Empty strings from the API are treated as “unset” and merged with UI defaults.
 */
export type OrgBranding = {
  organizationName: string;
  moduleName: string;
  moduleSubtitle: string;
  /** Shell / drawer mark (stored URL after upload) */
  logoUrl: string;
  /** Wider company mark; optional */
  companyLogoUrl: string;
  /** Optional; falls back to logoUrl when empty */
  loginLogoUrl: string;
  faviconUrl: string;
  /** Full-width strip image below the app bar (stored URL after upload) */
  bannerUrl: string;
  /** MUI primary (#rrggbb) */
  themePrimaryColor: string;
  supportUrl: string;
  /** Browser tab title */
  documentTitle: string;
};

export type OrgBrandingPatch = Partial<OrgBranding>;

/** POST /performance/org-branding/upload `kind` field */
export type OrgBrandingUploadKind =
  | 'logo'
  | 'companyLogo'
  | 'loginLogo'
  | 'favicon'
  | 'banner';
