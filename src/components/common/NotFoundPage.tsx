import { Box, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import noContentImg from '../../assets/no-content.png';
import AppButton from './AppButton';
import AppCard from './AppCard';

type NotFoundPageProps = {
  title?: string;
  message?: string;
  homePath?: string;
  homeLabel?: string;
};

const NotFoundPage = ({
  title = 'Page not found',
  message = "We couldn't find the page you're looking for. It may have been moved, or you may not have permission to view it.",
  homePath = '/performance',
  homeLabel = 'Go to My Reviews',
}: NotFoundPageProps) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const primary = theme.palette.primary.main;

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 6,
      }}
    >
      <AppCard
        sx={{
          maxWidth: 520,
          width: '100%',
          p: { xs: 3, sm: 4 },
          textAlign: 'center',
          background: `linear-gradient(180deg, ${alpha(primary, 0.04)} 0%, ${theme.palette.background.paper} 42%)`,
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '4rem', sm: '5rem' },
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: '-0.04em',
            background: `linear-gradient(135deg, ${primary} 0%, ${theme.palette.primary.dark} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
          }}
        >
          404
        </Typography>

        <Box
          sx={{
            width: { xs: 120, sm: 150 },
            height: { xs: 120, sm: 150 },
            mx: 'auto',
            mb: 2,
            opacity: 0.92,
          }}
        >
          <Box
            component="img"
            src={noContentImg}
            alt=""
            aria-hidden
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          {title}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
          {message}
        </Typography>

        <AppButton onClick={() => navigate(homePath)} sx={{ minWidth: 180 }}>
          {homeLabel}
        </AppButton>
      </AppCard>
    </Box>
  );
};

export default NotFoundPage;
