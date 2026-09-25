import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import { Box, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import type { Goal } from '../../../types/goal';
import { getGoalStatusColors } from '../../../utils/statusColorTokens';
import GoalStatusBadge from './GoalStatusBadge';

const DATE_FORMAT = 'DD MMM YYYY';

type GoalCardProps = {
  goal: Goal;
  onClick: (goal: Goal) => void;
};

const GoalCard = ({ goal, onClick }: GoalCardProps) => {
  const theme = useTheme();
  const statusColors = getGoalStatusColors(theme, goal.status);

  return (
    <Box
      onClick={() => onClick(goal)}
      sx={{
        position: 'relative',
        p: 2.25,
        pl: 2.5,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'transform 0.22s ease, border-color 0.22s ease',
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
          transform: 'translateY(-2px)',
          borderColor: alpha(statusColors.main, 0.35),
          '& .goal-card-chevron': {
            opacity: 1,
            transform: 'translateX(2px)',
          },
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
        <Box sx={{ flex: 1, minWidth: 0, pr: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              lineHeight: 1.45,
              letterSpacing: '-0.01em',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {goal.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1 }}>
            <EventOutlinedIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              Target {dayjs(goal.targetDate).format(DATE_FORMAT)}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <GoalStatusBadge status={goal.status} />
        <ChevronRightRoundedIcon
          className="goal-card-chevron"
          sx={{
            fontSize: 22,
            color: 'text.secondary',
            opacity: 0.45,
            transition: 'opacity 0.2s, transform 0.2s',
          }}
        />
      </Box>
    </Box>
  );
};

export default GoalCard;
