import { PublicClientApplication } from '@azure/msal-browser';

const tenantId = String(import.meta.env.VITE_AZURE_TENANT_ID || '').trim();
const clientId = String(import.meta.env.VITE_AZURE_CLIENT_ID || '').trim();

export const isMsalConfigured = Boolean(tenantId && clientId);
const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

export const msalInstance = isMsalConfigured
  ? new PublicClientApplication({
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        redirectUri: appOrigin,
        postLogoutRedirectUri: `${appOrigin}/login`,
      },
      cache: {
        cacheLocation: 'localStorage',
        storeAuthStateInCookie: true,
      } as any,
    })
  : null;

export function getMsalScopes() {
  const apiScope = String(import.meta.env.VITE_AZURE_API_SCOPE || '').trim();
  return apiScope ? [apiScope] : ['User.Read'];
}

export const loginRequest = {
  scopes: getMsalScopes(),
};

export const getPrimaryRole = (claims: any): string => {
  const rawRoles = claims?.roles || claims?.role || [];
  const roles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
  const normalized = roles.map((r: string) => String(r || '').toUpperCase());

  if (normalized.includes('ADMIN')) return 'ADMIN';
  if (normalized.includes('MANAGER')) return 'MANAGER';
  return 'EMPLOYEE';
};

export const toAuthUser = (claims: any) => ({
  id: claims?.oid || claims?.sub || claims?.preferred_username,
  name: claims?.name || claims?.preferred_username || 'User',
  email: claims?.preferred_username || claims?.email || '',
  role: getPrimaryRole(claims),
});
