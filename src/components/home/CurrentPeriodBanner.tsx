// @ts-nocheck
import { Box, LinearProgress, Skeleton, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { homeType } from './homeTypography';
import AppCard from '../common/AppCard';

/** Shows the employee's review pipeline. Hidden when they have no review assignment. */
const CurrentPeriodBanner = ({ period, goalProgress, loading }) => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;

  if (loading) return <Skeleton variant="rounded" height={170} />;
  if (!period) return null;

  const allDone = period.currentStep >= period.steps.length;

  return (
    <AppCard sx={{ p: 2.5, borderColor: alpha(primary, 0.35), bgcolor: alpha(primary, 0.035) }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
        <Box>
          <Typography sx={{ ...homeType.label, color: 'primary.main' }}>Current review</Typography>
          <Typography sx={{ ...homeType.cardTitle, mt: 0.25 }}>{period.name}</Typography>
          <Typography sx={homeType.meta}>
            {allDone
              ? 'All stages complete'
              : period.dueDate
                ? `${period.steps[period.currentStep]} due ${dayjs(period.dueDate).format('D MMM YYYY')} · ${period.daysLeft} day${period.daysLeft === 1 ? '' : 's'} left`
                : period.steps[period.currentStep]}
          </Typography>
        </Box>
        {goalProgress && (
          <Box sx={{ minWidth: { md: 240 } }}>
            <Stack direction="row" justifyContent="space-between">
              <Typography sx={homeType.meta}>Goals completed</Typography>
              <Typography sx={{ ...homeType.meta, fontWeight: 600, color: 'text.primary' }}>
                {goalProgress.completed}/{goalProgress.total}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={goalProgress.percent}
              sx={{ mt: 0.75, height: 6, borderRadius: 3, bgcolor: alpha(primary, 0.15) }}
            />
          </Box>
        )}
      </Stack>

      <Stack direction="row" alignItems="flex-start" sx={{ mt: 3 }}>
        {period.steps.map((step, i) => {
          const done = i < period.currentStep;
          const current = i === period.currentStep;
          return (
            <Box key={step} sx={{ flex: 1, position: 'relative', textAlign: 'center' }}>
              {i > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 13,
                    right: '50%',
                    width: '100%',
                    height: 2,
                    bgcolor: i <= period.currentStep ? primary : 'divider',
                  }}
                />
              )}
              <Box
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  mx: 'auto',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  ...homeType.meta,
                  fontWeight: 600,
                  color: done || current ? '#fff' : 'text.secondary',
                  bgcolor: done || current ? primary : 'background.paper',
                  border: '2px solid',
                  borderColor: done || current ? primary : 'divider',
                  boxShadow: current ? `0 0 0 5px ${alpha(primary, 0.2)}` : 'none',
                }}
              >
                {done ? <CheckRoundedIcon sx={{ fontSize: 16 }} /> : i + 1}
              </Box>
              <Typography
                sx={{ ...homeType.meta, display: 'block', mt: 0.75, fontWeight: current ? 600 : 500, color: current ? 'text.primary' : 'text.secondary' }}
              >
                {step}
              </Typography>
            </Box>
          );
        })}
      </Stack>
    </AppCard>
  );
};

export default CurrentPeriodBanner;
