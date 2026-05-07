// @ts-nocheck
// src/App
// Root component: sets up MUI theme, Redux Provider, and React Router

import { BrowserRouter, useNavigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, CssBaseline, Box, Alert } from '@mui/material';
import { useEffect, useRef } from 'react';
import { MsalProvider, useMsal } from '@azure/msal-react';
import { useDispatch } from 'react-redux';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import store from './app/state';
import AppRoutes from './routes/AppRoutes';
import { msalInstance, isMsalConfigured, loginRequest, toAuthUser } from './services/msalConfig';
import { registerNavigationService } from './services/navigationService';
import { setAuthFromSso, clearAuth, setAuthLoading } from './app/state/slices/authSlice';
import { theme } from './types/them';

let authBootstrapStarted = false;

const AuthBootstrap = () => {
  const { instance } = useMsal();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const hasInitialized = useRef(authBootstrapStarted);

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

  return <AppRoutes />;
};

const App = () => (
  <Provider store={store}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
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
    </ThemeProvider>
  </Provider>
);

export default App;
