import { Box, Grid, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import type { Goal } from '../../../types/goal';
import { GOAL_STATUS, GOAL_STATUS_LABELS } from '../../../utils/goalConstants';
import { getGoalStatusColors } from '../../../utils/statusColorTokens';

type GoalsSummaryStripProps = {
  goals: Goal[];
};

type StatCardAccent = 'primary' | 'info';

function StatCard({
  label,
  value,
  hint,
  status,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  status?: Goal['status'];
  accent?: StatCardAccent;
}) {
  const theme = useTheme();
  const colors = status
    ? getGoalStatusColors(theme, status)
    : accent
      ? {
          main: theme.palette[accent].main,
          dark: theme.palette[accent].dark,
        }
      : null;

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: colors ? alpha(colors.main, 0.28) : 'divider',
        backgroundColor: colors ? alpha(colors.main, 0.1) : 'transparent',
        minHeight: 96,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <Typography
        variant="caption"
        sx={{ fontWeight: 600, mb: 0.5, color: colors ? colors.dark : 'text.secondary' }}
      >
        {label}
      </Typography>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: colors?.dark ?? 'text.primary',
          lineHeight: 1.1,
        }}
      >
        {value}
      </Typography>
      {hint && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
          {hint}
        </Typography>
      )}
    </Box>
  );
}

const GoalsSummaryStrip = ({ goals }: GoalsSummaryStripProps) => {
  const total = goals.length;
  const onTrack = goals.filter((g) => g.status === GOAL_STATUS.ON_TRACK).length;
  const completed = goals.filter((g) => g.status === GOAL_STATUS.COMPLETED).length;

  return (
    <Box
      sx={{
        mb: 3,
        p: { xs: 0, sm: 0.5 },
        backgroundColor: 'transparent',
      }}
    >
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <StatCard label="Total goals" value={total} hint="Across all categories" accent="primary" />
        </Grid>
        <Grid item xs={6} sm={4}>
          <StatCard
            label={GOAL_STATUS_LABELS[GOAL_STATUS.ON_TRACK]}
            value={onTrack}
            status={GOAL_STATUS.ON_TRACK}
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <StatCard
            label={GOAL_STATUS_LABELS[GOAL_STATUS.COMPLETED]}
            value={completed}
            status={GOAL_STATUS.COMPLETED}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default GoalsSummaryStrip;
