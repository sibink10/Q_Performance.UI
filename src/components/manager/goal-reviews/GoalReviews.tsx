import { useCallback, useEffect, useMemo, useState } from 'react';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  Alert,
  Box,
  Chip,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import type { Goal, GoalCategory, GoalStatus } from '../../../types/goal';
import type { AssignableEmployee } from '../../../types/user';
import {
  GOAL_CATEGORY,
  GOAL_CATEGORY_LABELS,
  GOAL_STATUS,
  GOAL_STATUS_LABELS,
} from '../../../utils/goalConstants';
import { getGoalStatusColors } from '../../../utils/statusColorTokens';
import { directReportsOf, findEmployee } from '../../../utils/resolveEmployee';
import { AppCard, AppLoader, EmptyState, PageHeader } from '../../common';
import useGoals from '../../../hooks/useGoals';
import goalsService from '../../../services/goalsService';
import goalCommentsService from '../../../services/goalCommentsService';
import GoalCommentsDialog from '../../common/goal-comments/GoalCommentsDialog';
import EmployeeGoalGroup from './EmployeeGoalGroup';
import GoalRevisionRequestModal from './GoalRevisionRequestModal';
import TeamGoalsSummaryStrip from './TeamGoalsSummaryStrip';

const STATUS_PRIORITY: Record<GoalStatus, number> = {
  [GOAL_STATUS.OFF_TRACK]: 0,
  [GOAL_STATUS.NEEDS_ATTENTION]: 1,
  [GOAL_STATUS.ON_TRACK]: 2,
  [GOAL_STATUS.COMPLETED]: 3,
};

const QUICK_STATUS_FILTERS: (GoalStatus | 'ALL')[] = [
  'ALL',
  GOAL_STATUS.NEEDS_ATTENTION,
  GOAL_STATUS.OFF_TRACK,
  GOAL_STATUS.ON_TRACK,
  GOAL_STATUS.COMPLETED,
];

type EmployeeGoals = { employee: AssignableEmployee; goals: Goal[] };

function sortGoalsWithin(goals: Goal[]): Goal[] {
  return [...goals].sort(
    (a, b) =>
      STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status] ||
      dayjs(a.targetDate).valueOf() - dayjs(b.targetDate).valueOf(),
  );
}

function orderGroups(groups: EmployeeGoals[]): EmployeeGoals[] {
  return [...groups].sort((a, b) => {
    const aMin = Math.min(...a.goals.map((g) => STATUS_PRIORITY[g.status]));
    const bMin = Math.min(...b.goals.map((g) => STATUS_PRIORITY[g.status]));
    return aMin - bMin;
  });
}

const GoalReviews = () => {
  const theme = useTheme();
  const {
    filteredTeamGoals,
    teamFilters,
    currentUserId,
    isLoading,
    isMutating,
    error,
    successMessage,
    loadTeamGoals,
    updateStatus,
    setTeamFilters,
    clearError,
    clearSuccess,
  } = useGoals();

  const [employees, setEmployees] = useState<AssignableEmployee[]>([]);
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [revisionGoal, setRevisionGoal] = useState<Goal | null>(null);
  const [commentsGoal, setCommentsGoal] = useState<Goal | null>(null);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    setIsEmployeesLoading(true);
    goalsService
      .getAssignableEmployees()
      .then(setEmployees)
      .finally(() => setIsEmployeesLoading(false));
  }, []);

  useEffect(() => {
    loadTeamGoals();
  }, [loadTeamGoals]);

  const refreshCommentCounts = useCallback(() => {
    if (!filteredTeamGoals.length) {
      setCommentCounts({});
      return;
    }
    goalCommentsService
      .getCommentCounts(filteredTeamGoals.map((g) => g.id))
      .then(setCommentCounts);
  }, [filteredTeamGoals]);

  useEffect(() => {
    refreshCommentCounts();
  }, [refreshCommentCounts]);

  const directReports = useMemo(
    () => directReportsOf(employees, currentUserId),
    [employees, currentUserId],
  );

  const searchedGoals = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return filteredTeamGoals;
    return filteredTeamGoals.filter((goal) => {
      const employeeName = findEmployee(employees, goal.employeeId)?.name ?? '';
      return (
        goal.title.toLowerCase().includes(query) || employeeName.toLowerCase().includes(query)
      );
    });
  }, [filteredTeamGoals, search, employees]);

  const employeeGroups = useMemo(() => {
    const groups = new Map<string, EmployeeGoals>();
    searchedGoals.forEach((goal) => {
      const existing = groups.get(goal.employeeId);
      if (existing) {
        existing.goals.push(goal);
        return;
      }
      const employee = findEmployee(employees, goal.employeeId);
      if (!employee) return;
      groups.set(goal.employeeId, { employee, goals: [goal] });
    });

    const list = Array.from(groups.values()).map((group) => ({
      ...group,
      goals: sortGoalsWithin(group.goals),
    }));

    return orderGroups(list);
  }, [searchedGoals, employees]);

  return (
    <Box>
      <PageHeader
        title="Goal Reviews"
        subtitle="Review and update goal status for your direct reports in the active performance cycle."
      />

      {(error || successMessage) && (
        <Alert
          severity={error ? 'error' : 'success'}
          sx={{ mb: 2 }}
          onClose={() => {
            clearError();
            clearSuccess();
          }}
        >
          {error || successMessage}
        </Alert>
      )}

      <TeamGoalsSummaryStrip goals={filteredTeamGoals} />

      <AppCard sx={{ p: { xs: 2, sm: 3 } }}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search goal or employee…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl size="small" fullWidth>
              <InputLabel id="filter-employee">Employee</InputLabel>
              <Select
                labelId="filter-employee"
                label="Employee"
                value={teamFilters.employeeId}
                onChange={(e) => setTeamFilters({ employeeId: e.target.value })}
              >
                <MenuItem value="ALL">All employees</MenuItem>
                {directReports.map((report) => (
                  <MenuItem key={report.id} value={report.id}>
                    {report.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl size="small" fullWidth>
              <InputLabel id="filter-category">Category</InputLabel>
              <Select
                labelId="filter-category"
                label="Category"
                value={teamFilters.category}
                onChange={(e) =>
                  setTeamFilters({ category: e.target.value as GoalCategory | 'ALL' })
                }
              >
                <MenuItem value="ALL">All categories</MenuItem>
                {Object.values(GOAL_CATEGORY).map((category) => (
                  <MenuItem key={category} value={category}>
                    {GOAL_CATEGORY_LABELS[category]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
          {QUICK_STATUS_FILTERS.map((status) => {
            const selected = teamFilters.status === status;
            const colors = status !== 'ALL' ? getGoalStatusColors(theme, status) : null;
            return (
              <Chip
                key={status}
                label={status === 'ALL' ? 'All statuses' : GOAL_STATUS_LABELS[status]}
                onClick={() => setTeamFilters({ status })}
                sx={{
                  fontWeight: 700,
                  backgroundColor: selected
                    ? colors
                      ? colors.light
                      : alpha(theme.palette.primary.main, 0.14)
                    : 'transparent',
                  color: selected ? (colors ? colors.dark : theme.palette.primary.dark) : 'text.secondary',
                  border: '1px solid',
                  borderColor: selected
                    ? alpha(colors ? colors.main : theme.palette.primary.main, 0.35)
                    : 'divider',
                }}
              />
            );
          })}
        </Stack>

        {(isLoading || isEmployeesLoading) && !employeeGroups.length ? (
          <AppLoader message="Loading team goals…" />
        ) : employeeGroups.length ? (
          <Box>
            {employeeGroups.map((group) => (
              <EmployeeGoalGroup
                key={group.employee.id}
                employee={group.employee}
                goals={group.goals}
                isMutating={isMutating}
                commentCounts={commentCounts}
                onStatusChange={updateStatus}
                onRequestRevision={setRevisionGoal}
                onViewComments={setCommentsGoal}
              />
            ))}
          </Box>
        ) : (
          <EmptyState
            variant="noContent"
            message="No team goals match the selected filters."
            minHeight={220}
          />
        )}
      </AppCard>

      <GoalRevisionRequestModal
        open={!!revisionGoal}
        goal={revisionGoal}
        employees={employees}
        onClose={() => setRevisionGoal(null)}
      />

      <GoalCommentsDialog
        open={Boolean(commentsGoal)}
        goal={commentsGoal}
        employeeName={commentsGoal ? findEmployee(employees, commentsGoal.employeeId)?.name : undefined}
        onClose={() => {
          setCommentsGoal(null);
          refreshCommentCounts();
        }}
      />
    </Box>
  );
};

export default GoalReviews;
