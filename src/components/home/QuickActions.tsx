// @ts-nocheck
import { Box, Skeleton, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { homeType } from './homeTypography';
import SectionCard from './SectionCard';

const QuickActions = ({ actions, loading, title = 'Quick actions' }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  return (
    <SectionCard title={title}>
      <Stack spacing={1}>
        {loading || !actions
          ? [0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={54} />)
          : actions.map((a) => (
              <Box
                key={a.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(a.path)}
                onKeyDown={(e) => e.key === 'Enter' && navigate(a.path)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                  px: 1.75,
                  py: 1.1,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  cursor: 'pointer',
                  transition: 'all .2s',
                  '&:hover, &:focus-visible': {
                    outline: 'none',
                    borderColor: alpha(theme.palette.primary.main, 0.5),
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={homeType.rowTitle}>
                    {a.label}
                  </Typography>
                  <Typography sx={homeType.meta}>
                    {a.description}
                  </Typography>
                </Box>
                <ChevronRightRoundedIcon sx={{ color: 'text.disabled' }} />
              </Box>
            ))}
      </Stack>
    </SectionCard>
  );
};

export default QuickActions;
