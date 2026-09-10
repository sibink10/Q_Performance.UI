import { useEffect, useMemo } from 'react';
import {
  Alert,
  Box,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
} from '@mui/material';
import type { GoalCategory, GoalStatus } from '../../../types/goal';
import {
  GOAL_CATEGORY,
  GOAL_CATEGORY_LABELS,
  GOAL_STATUS,
  GOAL_STATUS_LABELS,
} from '../../../utils/goalConstants';
import { getDirectReports } from '../../../utils/resolveMockUserId';
import { AppCard, EmptyState, PageHeader } from '../../common';
import useGoals from '../../../hooks/useGoals';
import GoalReviewCard from './GoalReviewCard';

const GoalReviews = () => {
  const {
    filteredTeamGoals,
    teamFilters,
    mockUserId,
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

  useEffect(() => {
    loadTeamGoals();
  }, [loadTeamGoals]);

  const directReports = useMemo(() => getDirectReports(mockUserId), [mockUserId]);

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

      <AppCard sx={{ p: 3 }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
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
          <Grid item xs={12} md={4}>
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
          <Grid item xs={12} md={4}>
            <FormControl size="small" fullWidth>
              <InputLabel id="filter-status">Status</InputLabel>
              <Select
                labelId="filter-status"
                label="Status"
                value={teamFilters.status}
                onChange={(e) =>
                  setTeamFilters({ status: e.target.value as GoalStatus | 'ALL' })
                }
              >
                <MenuItem value="ALL">All statuses</MenuItem>
                {Object.values(GOAL_STATUS).map((status) => (
                  <MenuItem key={status} value={status}>
                    {GOAL_STATUS_LABELS[status]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {isLoading && !filteredTeamGoals.length ? (
          <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
            Loading team goals…
          </Box>
        ) : filteredTeamGoals.length ? (
          <Stack spacing={1.5}>
            {filteredTeamGoals.map((goal) => (
              <GoalReviewCard
                key={goal.id}
                goal={goal}
                isMutating={isMutating}
                onStatusChange={updateStatus}
              />
            ))}
          </Stack>
        ) : (
          <EmptyState
            variant="noContent"
            message="No team goals match the selected filters."
            minHeight={220}
          />
        )}
      </AppCard>
    </Box>
  );
};

export default GoalReviews;
