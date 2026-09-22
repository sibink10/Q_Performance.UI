import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Chip, FormControl, Grid, InputAdornment, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { alpha, useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import { AppCard, AppLoader, EmptyState, PageHeader } from '../../common';
import AppButton from '../../common/AppButton';
import ConfirmDialog from '../../common/ConfirmDialog';
import useGoals from '../../../hooks/useGoals';
import useGoalTemplates from '../../../hooks/useGoalTemplates';
import useFinancialYears from '../../../hooks/useFinancialYears';
import goalsService from '../../../services/goalsService';
import GoalDetailDrawer from '../../employee/goals/GoalDetailDrawer';
import type { AssignableEmployee } from '../../../types/user';
import type { Goal, GoalCategory, GoalStatus } from '../../../types/goal';
import { GOAL_CATEGORY, GOAL_CATEGORY_LABELS, GOAL_STATUS, GOAL_STATUS_LABELS } from '../../../utils/goalConstants';
import { getGoalStatusColors } from '../../../utils/statusColorTokens';
import { findEmployee } from '../../../utils/resolveEmployee';
import EmployeeGoalGroup from '../../manager/goal-reviews/EmployeeGoalGroup';
import TeamGoalsSummaryStrip from '../../manager/goal-reviews/TeamGoalsSummaryStrip';
import AssignGoalModal, { type AssignGoalSubmitPayload } from './AssignGoalModal';
import EditGoalModal, { type EditGoalSubmitPayload } from './EditGoalModal';

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

const GoalConfig = () => {
  const theme = useTheme();
  const { financialYears } = useFinancialYears();
  const {
    filteredTeamGoals,
    teamFilters,
    isLoading,
    error,
    successMessage,
    loadCycleGoals,
    setTeamFilters,
    clearError,
    clearSuccess,
  } = useGoals();

  const { templates, loadTemplates } = useGoalTemplates();
  const [employees, setEmployees] = useState<AssignableEmployee[]>([]);
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Goal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [detailGoal, setDetailGoal] = useState<Goal | null>(null);
  const [detailTab, setDetailTab] = useState<'details' | 'growthConnect' | 'history'>('details');

  const openGoalDetails = (goal: Goal) => {
    setDetailTab('details');
    setDetailGoal(goal);
  };

  const openGrowthConnect = (goal: Goal) => {
    setDetailTab('growthConnect');
    setDetailGoal(goal);
  };

  useEffect(() => {
    setIsEmployeesLoading(true);
    goalsService
      .getAssignableEmployees()
      .then(setEmployees)
      .finally(() => setIsEmployeesLoading(false));
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    loadCycleGoals();
  }, [loadCycleGoals]);

  const searchedGoals = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return filteredTeamGoals;
    return filteredTeamGoals.filter((goal) => {
      const employeeName = findEmployee(employees, goal.employeeId)?.name ?? '';
      return goal.title.toLowerCase().includes(query) || employeeName.toLowerCase().includes(query);
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

  const handleSubmit = async (payload: AssignGoalSubmitPayload) => {
    setIsSubmitting(true);
    setAssignError(null);
    try {
      const created = await goalsService.assignGoal(payload);
      setAssignSuccess(
        `Goal assigned to ${created.length} ${created.length === 1 ? 'person' : 'people'}.`,
      );
      setIsModalOpen(false);
      loadCycleGoals();
    } catch (e) {
      setAssignError(e instanceof Error ? e.message : 'Failed to assign goal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClose = () => setEditingGoal(null);

  const handleEditSubmit = async (payload: EditGoalSubmitPayload) => {
    if (!editingGoal) return;
    setIsEditSubmitting(true);
    setAssignError(null);
    try {
      await goalsService.updateGoal(editingGoal.id, {
        ...payload,
        status: editingGoal.status,
        targetValue: editingGoal.targetValue,
      });
      setAssignSuccess('Goal updated.');
      setEditingGoal(null);
      loadCycleGoals();
    } catch (e) {
      setAssignError(e instanceof Error ? e.message : 'Failed to update goal.');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDeleteClose = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setAssignError(null);
    try {
      await goalsService.deleteGoal(deleteTarget.id);
      setAssignSuccess('Goal deleted.');
      setDeleteTarget(null);
      loadCycleGoals();
    } catch (e) {
      setAssignError(e instanceof Error ? e.message : 'Failed to delete goal.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Goal Configuration"
        subtitle="Create performance goals and assign them to employees and managers."
        actions={
          <AppButton startIcon={<AddRoundedIcon />} onClick={() => setIsModalOpen(true)}>
            Assign Goal
          </AppButton>
        }
      />

      {(error || successMessage || assignError || assignSuccess) && (
        <Alert
          severity={error || assignError ? 'error' : 'success'}
          sx={{ mb: 2 }}
          onClose={() => {
            clearError();
            clearSuccess();
            setAssignError(null);
            setAssignSuccess(null);
          }}
        >
          {error || assignError || successMessage || assignSuccess}
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
                {employees.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>
                    {employee.name}
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
                onChange={(e) => setTeamFilters({ category: e.target.value as GoalCategory | 'ALL' })}
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
                  fontWeight: 600,
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
          <AppLoader message="Loading goals…" />
        ) : employeeGroups.length ? (
          <Box>
            {employeeGroups.map((group) => (
              <EmployeeGoalGroup
                key={group.employee.id}
                employee={group.employee}
                goals={group.goals}
                onOpenDetails={openGoalDetails}
                onEdit={setEditingGoal}
                onDelete={setDeleteTarget}
                onViewGrowthConnect={openGrowthConnect}
              />
            ))}
          </Box>
        ) : (
          <EmptyState
            variant="noContent"
            message="No goals match the selected filters."
            minHeight={220}
          />
        )}
      </AppCard>

      <AssignGoalModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        employees={employees}
        financialYears={financialYears}
        templates={templates}
        isSubmitting={isSubmitting}
      />

      <EditGoalModal
        open={Boolean(editingGoal)}
        onClose={handleEditClose}
        onSubmit={handleEditSubmit}
        goal={editingGoal}
        employeeName={editingGoal ? findEmployee(employees, editingGoal.employeeId)?.name : undefined}
        reviewPeriodName={
          editingGoal ? financialYears.find((f) => f.id === editingGoal.financialYearId)?.name : undefined
        }
        isSubmitting={isEditSubmitting}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete goal"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.title}"? This action can't be undone.`
            : 'Are you sure you want to delete this goal?'
        }
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteClose}
        loading={isDeleting}
      />

      <GoalDetailDrawer
        open={Boolean(detailGoal)}
        goal={detailGoal}
        initialTab={detailTab}
        employeeName={detailGoal ? findEmployee(employees, detailGoal.employeeId)?.name : undefined}
        onClose={() => setDetailGoal(null)}
      />
    </Box>
  );
};

export default GoalConfig;
