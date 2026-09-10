import { Chip } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import type { GoalStatus } from '../../../types/goal';
import { GOAL_STATUS_LABELS } from '../../../utils/goalConstants';
import { getGoalStatusColors } from '../../../utils/statusColorTokens';

type GoalStatusBadgeProps = {
  status: GoalStatus;
  size?: 'small' | 'medium';
};

const GoalStatusBadge = ({ status, size = 'small' }: GoalStatusBadgeProps) => {
  const theme = useTheme();
  const colors = getGoalStatusColors(theme, status);

  return (
    <Chip
      size={size}
      label={GOAL_STATUS_LABELS[status]}
      sx={{
        fontWeight: 700,
        letterSpacing: '0.01em',
        backgroundColor: colors.light,
        color: colors.dark,
        border: `1px solid ${alpha(colors.main, 0.22)}`,
      }}
    />
  );
};

export default GoalStatusBadge;
