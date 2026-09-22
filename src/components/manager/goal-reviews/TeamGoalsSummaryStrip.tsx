import { Box, Grid, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import type { Goal } from '../../../types/goal';
import { GOAL_STATUS, GOAL_STATUS_LABELS } from '../../../utils/goalConstants';
import { getGoalStatusColors } from '../../../utils/statusColorTokens';

type TeamGoalsSummaryStripProps = {
  goals: Goal[];
};

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
  accent?: 'primary';
}) {
  const theme = useTheme();
  const colors = status
    ? getGoalStatusColors(theme, status)
    : accent
      ? { main: theme.palette[accent].main, dark: theme.palette[accent].dark }
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
          fontWeight: 600,
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

const TeamGoalsSummaryStrip = ({ goals }: TeamGoalsSummaryStripProps) => {
  const total = goals.length;
  const needsAttention = goals.filter((g) => g.status === GOAL_STATUS.NEEDS_ATTENTION).length;
  const offTrack = goals.filter((g) => g.status === GOAL_STATUS.OFF_TRACK).length;
  const completed = goals.filter((g) => g.status === GOAL_STATUS.COMPLETED).length;

  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <StatCard label="Team goals" value={total} hint="Across your direct reports" accent="primary" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            label={GOAL_STATUS_LABELS[GOAL_STATUS.NEEDS_ATTENTION]}
            value={needsAttention}
            hint="May need a check-in"
            status={GOAL_STATUS.NEEDS_ATTENTION}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            label={GOAL_STATUS_LABELS[GOAL_STATUS.OFF_TRACK]}
            value={offTrack}
            hint="At risk, review soon"
            status={GOAL_STATUS.OFF_TRACK}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            label={GOAL_STATUS_LABELS[GOAL_STATUS.COMPLETED]}
            value={completed}
            hint="Done this cycle"
            status={GOAL_STATUS.COMPLETED}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeamGoalsSummaryStrip;
