import { useState } from 'react';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { Avatar, Box, Chip, Collapse, IconButton, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import type { Goal } from '../../../types/goal';
import type { AssignableEmployee } from '../../../types/user';
import { GOAL_STATUS } from '../../../utils/goalConstants';
import ManagerGoalCard from './ManagerGoalCard';

type EmployeeGoalGroupProps = {
  employee: AssignableEmployee;
  goals: Goal[];
  onOpenDetails?: (goal: Goal) => void;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goal: Goal) => void;
  onRequestRevision?: (goal: Goal) => void;
  onViewGrowthConnect?: (goal: Goal) => void;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '');
  return initials.join('') || '?';
}

const EmployeeGoalGroup = ({
  employee,
  goals,
  onOpenDetails,
  onEdit,
  onDelete,
  onRequestRevision,
  onViewGrowthConnect,
}: EmployeeGoalGroupProps) => {
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
            fontWeight: 600,
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            color: theme.palette.primary.dark,
          }}
        >
          {getInitials(employee.name)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ letterSpacing: '-0.02em' }}>
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
              fontWeight: 600,
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
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 1.5,
          }}
        >
          {goals.map((goal) => (
            <ManagerGoalCard
              key={goal.id}
              goal={goal}
              onOpenDetails={onOpenDetails}
              onEdit={onEdit}
              onDelete={onDelete}
              onRequestRevision={onRequestRevision}
              onViewGrowthConnect={onViewGrowthConnect}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

export default EmployeeGoalGroup;
