// @ts-nocheck
// src/components/auth/Login
// Public login page — authenticates with Microsoft SSO

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Alert, Stack } from '@mui/material';
import MicrosoftIcon from '@mui/icons-material/Microsoft';
import useAuth from '../../hooks/useAuth';
import AppButton from '../../components/common/AppButton';
import AppCard from '../../components/common/AppCard';
import productLogo from '../../assets/qubiqon_logo.jpg';

const Login = () => {
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
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(800px 400px at 15% 10%, rgba(99, 102, 241, 0.35) 0%, transparent 55%),
            radial-gradient(700px 380px at 85% 15%, rgba(56, 189, 248, 0.28) 0%, transparent 50%),
            radial-gradient(600px 360px at 50% 100%, rgba(79, 70, 229, 0.2) 0%, transparent 45%),
            linear-gradient(165deg, #0f172a 0%, #1e293b 40%, #0f172a 100%)
          `,
          zIndex: 0,
        },
      }}
    >
      <AppCard
        variant="glass"
        sx={{
          position: 'relative',
          zIndex: 1,
          p: { xs: 3, sm: 4.5 },
          width: '100%',
          maxWidth: 440,
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.35)',
          boxShadow: '0 24px 80px rgba(15, 23, 42, 0.45), 0 0 0 1px rgba(255,255,255,0.06) inset',
        }}
      >
        <Stack spacing={3} alignItems="center" textAlign="center">
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2.5,
              overflow: 'hidden',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 12px 40px rgba(79, 70, 229, 0.45)',
            }}
          >
            <Box component="img" src={productLogo} alt="Qubiqon logo" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
