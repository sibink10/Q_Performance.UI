import { useEffect, useMemo, useState } from 'react';
import { Alert, Box } from '@mui/material';
import type { Goal, GoalCategory } from '../../../types/goal';
import { GOAL_CATEGORY } from '../../../utils/goalConstants';
import { AppCard, EmptyState, PageHeader } from '../../common';
import useGoals from '../../../hooks/useGoals';
import GoalCategoryGroup from './GoalCategoryGroup';
import GoalDetailDrawer from './GoalDetailDrawer';
import GoalsSummaryStrip from './GoalsSummaryStrip';

const CATEGORY_ORDER: GoalCategory[] = [
  GOAL_CATEGORY.ORGANIZATIONAL,
  GOAL_CATEGORY.ROLE,
  GOAL_CATEGORY.DEVELOPMENT,
];

const MyGoalsList = () => {
  const {
    employeeGoals,
    selectedGoal,
    isLoading,
    error,
    successMessage,
    loadMyGoals,
    selectGoal,
    clearError,
    clearSuccess,
  } = useGoals();

  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    loadMyGoals();
  }, [loadMyGoals]);

  const groupedGoals = useMemo(() => {
    const groups: Record<GoalCategory, Goal[]> = {
      ORGANIZATIONAL: [],
      ROLE: [],
      DEVELOPMENT: [],
    };

    employeeGoals.forEach((goal) => {
      groups[goal.category].push(goal);
    });

    return groups;
  }, [employeeGoals]);

  const handleGoalClick = (goal: Goal) => {
    selectGoal(goal);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    selectGoal(null);
  };

  return (
    <Box>
      <PageHeader
        title="My Goals"
        subtitle="Track progress across organizational, role, and development goals — aligned to your active performance cycle."
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

      {isLoading && !employeeGoals.length ? (
        <AppCard sx={{ p: 4, textAlign: 'center', color: 'text.secondary', boxShadow: 'none' }}>
          Loading your goals…
        </AppCard>
      ) : employeeGoals.length ? (
        <>
          <GoalsSummaryStrip goals={employeeGoals} />

          <AppCard sx={{ p: { xs: 2, sm: 3 }, boxShadow: 'none' }}>
            {CATEGORY_ORDER.map((category) => (
              <GoalCategoryGroup
                key={category}
                category={category}
                goals={groupedGoals[category]}
                onGoalClick={handleGoalClick}
              />
            ))}
          </AppCard>
        </>
      ) : (
        <AppCard sx={{ p: 3, boxShadow: 'none' }}>
          <EmptyState variant="folder" message="No goals assigned for this cycle yet." minHeight={220} />
        </AppCard>
      )}

      <GoalDetailDrawer open={drawerOpen} goal={selectedGoal} onClose={handleCloseDrawer} />
    </Box>
  );
};

export default MyGoalsList;
