import { Box, LinearProgress, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { GoalStatus } from '../../../types/goal';
import { getGoalStatusColors } from '../../../utils/statusColorTokens';

type GoalProgressBarProps = {
  progress: number;
  status: GoalStatus;
  size?: 'compact' | 'default' | 'large';
  showLabel?: boolean;
};

const GoalProgressBar = ({
  progress,
  status,
  size = 'default',
  showLabel = true,
}: GoalProgressBarProps) => {
  const theme = useTheme();
  const colors = getGoalStatusColors(theme, status);
  const clamped = Math.min(100, Math.max(0, progress));

  const barHeight = size === 'compact' ? 6 : size === 'large' ? 10 : 8;

  return (
    <Box sx={{ width: '100%' }}>
      {showLabel && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 500, letterSpacing: '0.02em' }}
          >
            Progress
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, color: colors.dark }}>
            {clamped}%
          </Typography>
        </Box>
      )}
      <LinearProgress
        variant="determinate"
        value={clamped}
        sx={{
          height: barHeight,
          borderRadius: 999,
          backgroundColor: colors.light,
          '& .MuiLinearProgress-bar': {
            borderRadius: 999,
            backgroundColor: colors.main,
          },
        }}
      />
    </Box>
  );
};

export default GoalProgressBar;
