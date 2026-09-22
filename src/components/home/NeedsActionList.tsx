// @ts-nocheck
import { Box, Skeleton, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { homeType } from './homeTypography';
import SectionCard from './SectionCard';

/** Hidden entirely when there is nothing to act on (and not loading). */
const NeedsActionList = ({ rows, loading, title = 'Needs your action' }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  if (!loading && !rows?.length) return null;

  return (
    <SectionCard title={title} action={!loading && <Typography sx={homeType.meta}>{rows.length} items</Typography>}>
      <Stack divider={<Box sx={{ borderTop: '1px solid', borderColor: 'divider' }} />} sx={{ mx: -1 }}>
        {loading
          ? [0, 1, 2].map((i) => <Skeleton key={i} height={52} sx={{ mx: 1 }} />)
          : rows.map((r) => {
              const color = r.urgent ? theme.palette.error.main : theme.palette.warning.main;
              return (
                <Stack
                  key={r.id}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  spacing={2}
                  onClick={() => navigate(r.path)}
                  sx={{
                    py: 1.25,
                    px: 1,
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: alpha(theme.palette.grey[900], 0.03) },
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={homeType.rowTitle} noWrap>
                      {r.title}
                    </Typography>
                    <Typography sx={homeType.meta}>{r.subtitle}</Typography>
                  </Box>
                  <Box
                    sx={{
                      px: 1,
                      py: 0.25,
                      borderRadius: 1,
                      ...homeType.badge,
                      whiteSpace: 'nowrap',
                      color,
                      bgcolor: alpha(color, 0.1),
                    }}
                  >
                    {r.dueLabel}
                  </Box>
                </Stack>
              );
            })}
      </Stack>
    </SectionCard>
  );
};

export default NeedsActionList;
