import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import type { Goal, GoalStatus } from '../../../types/goal';
import { GOAL_CATEGORY_LABELS, GOAL_STATUS, GOAL_STATUS_LABELS } from '../../../utils/goalConstants';
import { getMockUserById } from '../../../utils/resolveMockUserId';
import WeightBadge from '../../common/WeightBadge';
import GoalProgressBar from '../../employee/goals/GoalProgressBar';
import GoalStatusBadge from '../../employee/goals/GoalStatusBadge';

type GoalReviewCardProps = {
  goal: Goal;
  isMutating?: boolean;
  onStatusChange: (goalId: string, status: GoalStatus) => void;
};

const STATUS_OPTIONS: GoalStatus[] = [
  GOAL_STATUS.ON_TRACK,
  GOAL_STATUS.NEEDS_ATTENTION,
  GOAL_STATUS.OFF_TRACK,
  GOAL_STATUS.COMPLETED,
];

const GoalReviewCard = ({ goal, isMutating = false, onStatusChange }: GoalReviewCardProps) => {
  const employee = getMockUserById(goal.employeeId);

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'flex-start' }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary">
            {employee?.name ?? 'Unknown employee'} · {GOAL_CATEGORY_LABELS[goal.category]}
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            {goal.title}
          </Typography>
          <Box sx={{ maxWidth: 360, mb: 1 }}>
            <GoalProgressBar progress={goal.progress} status={goal.status} />
          </Box>
          <Stack direction="row" spacing={1}>
            <GoalStatusBadge status={goal.status} />
            <WeightBadge weight={goal.weight} />
          </Stack>
        </Box>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id={`goal-status-${goal.id}`}>Update Status</InputLabel>
          <Select
            labelId={`goal-status-${goal.id}`}
            label="Update Status"
            value={goal.status}
            disabled={isMutating}
            onChange={(e) => onStatusChange(goal.id, e.target.value as GoalStatus)}
          >
            {STATUS_OPTIONS.map((status) => (
              <MenuItem key={status} value={status}>
                {GOAL_STATUS_LABELS[status]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </Box>
  );
};

export default GoalReviewCard;
