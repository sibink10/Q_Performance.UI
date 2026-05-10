// @ts-nocheck
// src/components/auth/Login
// Public login page - authenticates with Microsoft SSO

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Alert, Stack } from '@mui/material';
import MicrosoftIcon from '@mui/icons-material/Microsoft';
import { alpha, useTheme } from '@mui/material/styles';
import useAuth from '../../hooks/useAuth';
import AppButton from '../../components/common/AppButton';
import AppCard from '../../components/common/AppCard';
import appLogo from '../../assets/logo.png';

const Login = () => {
  const theme = useTheme();
  const { login, isLoading, error, isAuthenticated, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/performance', { replace: true });
  }, [isAuthenticated, navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 3 },
        bgcolor: theme.palette.background.paper,
        backgroundImage: 'none',
      }}
    >
      <AppCard
        variant="paper"
        sx={{
          p: { xs: 3, sm: 4.5 },
          width: '100%',
          maxWidth: 440,
          boxShadow: 'none',
        }}
      >
        <Stack spacing={3} alignItems="center" textAlign="center">
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: 2.5,
              overflow: 'hidden',
              background: alpha(theme.palette.primary.main, 0.12),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 14px 34px -24px ${alpha(theme.palette.primary.main, 0.9)}`,
            }}
          >
            <Box component="img" src={appLogo} alt="" sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 0.5 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.03em' }}>
              QHRMS Performance
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 320, mx: 'auto' }}>
              Sign in with your Microsoft work account to continue. Your session stays secure with SSO.
            </Typography>
          </Box>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mt: 3 }}>
          <AppButton
            type="button"
            fullWidth
            loading={isLoading}
            size="large"
            startIcon={<MicrosoftIcon />}
            onClick={async () => {
              if (error) clearError();
              await login();
            }}
            sx={{ py: 1.35, fontSize: '1rem', borderRadius: 2 }}
          >
            {isLoading ? 'Signing in…' : 'Continue with Microsoft'}
          </AppButton>
        </Box>

        <Typography variant="caption" color="text.secondary" display="block" textAlign="center" sx={{ mt: 3, opacity: 0.85 }}>
          Enterprise sign-in · Azure AD
        </Typography>
      </AppCard>
    </Box>
  );
};

export default Login;
