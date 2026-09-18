import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import { Box, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import type { Goal } from '../../../types/goal';
import { GOAL_CATEGORY_LABELS, GOAL_STATUS } from '../../../utils/goalConstants';
import { GOAL_CATEGORY_META } from '../../../utils/goalCategoryMeta';
import { getGoalStatusColors } from '../../../utils/statusColorTokens';
import GoalStatusBadge from '../../employee/goals/GoalStatusBadge';

const DATE_FORMAT = 'DD MMM YYYY';

type ManagerGoalCardProps = {
  goal: Goal;
  onOpenDetails?: (goal: Goal) => void;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goal: Goal) => void;
  onRequestRevision?: (goal: Goal) => void;
  onViewGrowthConnect?: (goal: Goal) => void;
};

const ManagerGoalCard = ({
  goal,
  onOpenDetails,
  onEdit,
  onDelete,
  onRequestRevision,
  onViewGrowthConnect,
}: ManagerGoalCardProps) => {
  const theme = useTheme();
  const statusColors = getGoalStatusColors(theme, goal.status);
  const categoryMeta = GOAL_CATEGORY_META[goal.category];
  const CategoryIcon = categoryMeta.Icon;
  const categoryAccent = categoryMeta.accent(theme);

  const isOverdue = goal.status !== GOAL_STATUS.COMPLETED && dayjs(goal.targetDate).isBefore(dayjs(), 'day');

  return (
    <Box
      onClick={() => onOpenDetails?.(goal)}
      sx={{
        position: 'relative',
        height: '100%',
        p: 2.25,
        pl: 2.75,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'transparent',
        overflow: 'hidden',
        cursor: onOpenDetails ? 'pointer' : undefined,
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
        alignItems={{ xs: 'stretch', md: 'center' }}
        sx={{ height: '100%' }}
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
          </Stack>
        </Box>

        <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ flexShrink: 0 }}>
          {(onEdit || onDelete || onRequestRevision || onViewGrowthConnect) && (
            <Stack direction="row" spacing={0.5}>
              {onViewGrowthConnect && (
                <Tooltip title="Growth Connect">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewGrowthConnect(goal);
                    }}
                    aria-label="View Growth Connect"
                  >
                    <TimelineOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {onEdit && !goal.isFinalized && (
                <Tooltip title="Edit goal">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(goal);
                    }}
                    aria-label="Edit goal"
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {onDelete && !goal.isFinalized && (
                <Tooltip title="Delete goal">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(goal);
                    }}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestRevision(goal);
                    }}
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
