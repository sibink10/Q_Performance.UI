// @ts-nocheck
// src/App
// Root component: sets up MUI theme, Redux Provider, and React Router

import { BrowserRouter, useNavigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, CssBaseline, Box, Alert } from '@mui/material';
import { useEffect, useMemo, useRef } from 'react';
import { MsalProvider, useMsal } from '@azure/msal-react';
import { useDispatch, useSelector } from 'react-redux';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import store from './app/state';
import AppRoutes from './routes/AppRoutes';
import { msalInstance, isMsalConfigured, loginRequest, toAuthUser } from './services/msalConfig';
import { registerNavigationService } from './services/navigationService';
import { setAuthFromSso, clearAuth, setAuthLoading, selectIsAuthenticated } from './app/state/slices/authSlice';
import { fetchOrgBranding } from './app/state/slices/orgBrandingSlice';
import { DEFAULT_ORG_BRANDING } from './utils/orgBrandingDefaults';
import { createAppTheme } from './types/them';
import { selectOrgBranding } from './app/state/slices/orgBrandingSlice';

let authBootstrapStarted = false;

const AuthBootstrap = () => {
  const { instance } = useMsal();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const hasInitialized = useRef(authBootstrapStarted);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const token = useSelector((s) => s.auth.token);

  useEffect(() => {
    registerNavigationService({
      navigate,
      onUnauthorized: () => dispatch(clearAuth()),
    });
    return () => registerNavigationService(null);
  }, [dispatch, navigate]);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    authBootstrapStarted = true;

    const syncAuthState = async () => {
      dispatch(setAuthLoading(true));
      try {
        const currentAccounts = instance.getAllAccounts();
        if (!currentAccounts.length) {
          const cachedToken = localStorage.getItem('qhrms_token');
          if (!cachedToken) {
            dispatch(clearAuth());
          }
          return;
        }

        const activeAccount = instance.getActiveAccount() || currentAccounts[0];
        instance.setActiveAccount(activeAccount);

        const cachedToken = localStorage.getItem('qhrms_token');
        if (cachedToken) {
          dispatch(
            setAuthFromSso({
              token: cachedToken,
              user: toAuthUser(activeAccount.idTokenClaims),
            })
          );
        }

        let tokenResponse;
        try {
          tokenResponse = await instance.acquireTokenSilent({
            account: activeAccount,
            scopes: loginRequest.scopes,
          });
        } catch {
          tokenResponse = await instance.acquireTokenSilent({
            account: activeAccount,
            scopes: ['openid', 'profile', 'email'],
          });
        }

        // Prefer access token for API calls; idToken is only a fallback.
        const token = tokenResponse.accessToken || null;

        if (!token) {
          dispatch(clearAuth());
        }

        localStorage.setItem('qhrms_token', token);
        dispatch(
          setAuthFromSso({
            token,
            user: toAuthUser(tokenResponse.idTokenClaims || activeAccount.idTokenClaims),
          })
        );
      } catch {

        const fallbackToken = localStorage.getItem('qhrms_token');
        if (!fallbackToken) {
          dispatch(clearAuth());
        }
      } finally {
        dispatch(setAuthLoading(false));
      }
    };

    syncAuthState();
  }, [dispatch, instance]);

  useEffect(() => {
    if (isAuthenticated && token) {
      dispatch(fetchOrgBranding());
    } else if (!isAuthenticated) {
      document.title = DEFAULT_ORG_BRANDING.documentTitle;
    }
  }, [dispatch, isAuthenticated, token]);

  return <AppRoutes />;
};

const AppThemeShell = ({ children }) => {
  const primary = useSelector(selectOrgBranding).themePrimaryColor;
  const dynamicTheme = useMemo(() => createAppTheme(primary), [primary]);
  return (
    <ThemeProvider theme={dynamicTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

const App = () => (
  <Provider store={store}>
    <AppThemeShell>
      {!isMsalConfigured || !msalInstance ? (
        <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
          <Alert severity="error">
            MSAL is not configured. Set `VITE_AZURE_TENANT_ID` and `VITE_AZURE_CLIENT_ID`.
          </Alert>
        </Box>
      ) : (
        <MsalProvider instance={msalInstance}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <BrowserRouter>
              <AuthBootstrap />
            </BrowserRouter>
          </LocalizationProvider>
        </MsalProvider>
      )}
    </AppThemeShell>
  </Provider>
);

export default App;
