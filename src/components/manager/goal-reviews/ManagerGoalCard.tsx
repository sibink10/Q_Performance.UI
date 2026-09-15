import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import {
  Box,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import type { Goal, GoalStatus } from '../../../types/goal';
import { GOAL_CATEGORY_LABELS, GOAL_STATUS, GOAL_STATUS_LABELS } from '../../../utils/goalConstants';
import { GOAL_CATEGORY_META } from '../../../utils/goalCategoryMeta';
import { getGoalStatusColors } from '../../../utils/statusColorTokens';
import WeightBadge from '../../common/WeightBadge';
import GoalStatusBadge from '../../employee/goals/GoalStatusBadge';

const DATE_FORMAT = 'DD MMM YYYY';

type ManagerGoalCardProps = {
  goal: Goal;
  isMutating?: boolean;
  onStatusChange: (goalId: string, status: GoalStatus) => void;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goal: Goal) => void;
  onRequestRevision?: (goal: Goal) => void;
};

const STATUS_OPTIONS: GoalStatus[] = [
  GOAL_STATUS.ON_TRACK,
  GOAL_STATUS.NEEDS_ATTENTION,
  GOAL_STATUS.OFF_TRACK,
  GOAL_STATUS.COMPLETED,
];

const ManagerGoalCard = ({
  goal,
  isMutating = false,
  onStatusChange,
  onEdit,
  onDelete,
  onRequestRevision,
}: ManagerGoalCardProps) => {
  const theme = useTheme();
  const statusColors = getGoalStatusColors(theme, goal.status);
  const categoryMeta = GOAL_CATEGORY_META[goal.category];
  const CategoryIcon = categoryMeta.Icon;
  const categoryAccent = categoryMeta.accent(theme);

  const isOverdue = goal.status !== GOAL_STATUS.COMPLETED && dayjs(goal.targetDate).isBefore(dayjs(), 'day');

  return (
    <Box
      sx={{
        position: 'relative',
        p: 2.25,
        pl: 2.75,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'transparent',
        overflow: 'hidden',
        transition: 'border-color 0.2s ease',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 12,
          bottom: 12,
          width: 4,
          borderRadius: 999,
          backgroundColor: statusColors.main,
        },
        '&:hover': {
          borderColor: alpha(statusColors.main, 0.35),
        },
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'flex-start' }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: 1,
                display: 'grid',
                placeItems: 'center',
                backgroundColor: categoryAccent.soft,
                color: categoryAccent.main,
                flexShrink: 0,
              }}
            >
              <CategoryIcon sx={{ fontSize: 14 }} />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {GOAL_CATEGORY_LABELS[goal.category]}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ·
            </Typography>
            <EventOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              Due {dayjs(goal.targetDate).format(DATE_FORMAT)}
            </Typography>
            {isOverdue && (
              <Chip
                size="small"
                icon={<WarningAmberRoundedIcon sx={{ fontSize: '14px !important' }} />}
                label="Overdue"
                sx={{
                  height: 20,
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                  color: theme.palette.error.dark,
                  border: `1px solid ${alpha(theme.palette.error.main, 0.25)}`,
                }}
              />
            )}
          </Stack>

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.25 }}>
            {goal.title}
          </Typography>

          <Stack direction="row" spacing={1}>
            <GoalStatusBadge status={goal.status} />
            <WeightBadge weight={goal.weight} />
          </Stack>
        </Box>

        <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ flexShrink: 0 }}>
          <FormControl size="small" sx={{ minWidth: 190 }}>
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

          {(onEdit || onDelete || onRequestRevision) && (
            <Stack direction="row" spacing={0.5}>
              {onEdit && !goal.isFinalized && (
                <Tooltip title="Edit goal">
                  <IconButton size="small" onClick={() => onEdit(goal)} aria-label="Edit goal">
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {onDelete && !goal.isFinalized && (
                <Tooltip title="Delete goal">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDelete(goal)}
                    aria-label="Delete goal"
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {onRequestRevision && goal.isFinalized && (
                <Tooltip title="Request revision">
                  <IconButton
                    size="small"
                    onClick={() => onRequestRevision(goal)}
                    aria-label="Request revision"
                  >
                    <RateReviewOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          )}
        </Stack>
      </Stack>
    </Box>
  );
};

export default ManagerGoalCard;
