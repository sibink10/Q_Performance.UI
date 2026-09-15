import { useState } from 'react';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { Avatar, Box, Chip, Collapse, IconButton, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import type { Goal, GoalStatus } from '../../../types/goal';
import type { MockUser } from '../../../types/user';
import { GOAL_STATUS } from '../../../utils/goalConstants';
import ManagerGoalCard from './ManagerGoalCard';

type EmployeeGoalGroupProps = {
  employee: MockUser;
  goals: Goal[];
  isMutating?: boolean;
  onStatusChange: (goalId: string, status: GoalStatus) => void;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '');
  return initials.join('') || '?';
}

const EmployeeGoalGroup = ({ employee, goals, isMutating = false, onStatusChange }: EmployeeGoalGroupProps) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  const needsAttentionCount = goals.filter(
    (g) => g.status === GOAL_STATUS.NEEDS_ATTENTION || g.status === GOAL_STATUS.OFF_TRACK,
  ).length;

  return (
    <Box sx={{ mb: 3 }}>
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        onClick={() => setExpanded((prev) => !prev)}
        sx={{ mb: expanded ? 2 : 0, cursor: 'pointer', userSelect: 'none' }}
      >
        <Avatar
          sx={{
            width: 40,
            height: 40,
            fontSize: '0.9rem',
            fontWeight: 700,
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            color: theme.palette.primary.dark,
          }}
        >
          {getInitials(employee.name)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
            {employee.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {employee.department} · {goals.length} {goals.length === 1 ? 'goal' : 'goals'}
          </Typography>
        </Box>
        {needsAttentionCount > 0 && (
          <Chip
            size="small"
            label={`${needsAttentionCount} to review`}
            sx={{
              fontWeight: 700,
              backgroundColor: alpha(theme.palette.warning.main, 0.12),
              color: theme.palette.warning.dark,
              border: `1px solid ${alpha(theme.palette.warning.main, 0.25)}`,
            }}
          />
        )}
        <IconButton size="small" aria-label={expanded ? 'Collapse' : 'Expand'}>
          <ExpandMoreRoundedIcon
            sx={{
              transition: 'transform 0.2s ease',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </IconButton>
      </Stack>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Stack spacing={1.5}>
          {goals.map((goal) => (
            <ManagerGoalCard
              key={goal.id}
              goal={goal}
              isMutating={isMutating}
              onStatusChange={onStatusChange}
            />
          ))}
        </Stack>
      </Collapse>
    </Box>
  );
};

export default EmployeeGoalGroup;
