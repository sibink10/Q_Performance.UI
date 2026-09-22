// @ts-nocheck
import { Box, Grid, Skeleton, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { homeType } from './homeTypography';
import { ROW_PADDING_X, ROW_PADDING_Y } from './homeLayout';
import SectionCard from './SectionCard';

/** Laid out as a grid (not a vertical list) — meant for the wider main column. */
const QuickActions = ({ actions, loading, title = 'Quick actions' }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <SectionCard title={title}>
      <Grid container spacing={1.5}>
        {loading || !actions
          ? [0, 1, 2, 3].map((i) => (
              <Grid item xs={12} sm={6} key={i}>
                <Skeleton variant="rounded" height={64} />
              </Grid>
            ))
          : actions.map((a) => (
              <Grid item xs={12} sm={6} key={a.id}>
                <Box
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(a.path)}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(a.path)}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    px: ROW_PADDING_X,
                    py: ROW_PADDING_Y,
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
                    <Typography sx={homeType.rowTitle}>{a.label}</Typography>
                    <Typography sx={homeType.meta}>{a.description}</Typography>
                  </Box>
                  <ChevronRightRoundedIcon sx={{ color: 'text.disabled', flexShrink: 0 }} />
                </Box>
              </Grid>
            ))}
      </Grid>
    </SectionCard>
  );
};

export default QuickActions;
