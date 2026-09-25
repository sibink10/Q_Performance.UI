import { Box, Chip, Grid, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { Goal, GoalCategory } from '../../../types/goal';
import { GOAL_CATEGORY_LABELS } from '../../../utils/goalConstants';
import { GOAL_CATEGORY_META } from '../../../utils/goalCategoryMeta';
import GoalCard from './GoalCard';

type GoalCategoryGroupProps = {
  category: GoalCategory;
  goals: Goal[];
  onGoalClick: (goal: Goal) => void;
};

const GoalCategoryGroup = ({ category, goals, onGoalClick }: GoalCategoryGroupProps) => {
  const theme = useTheme();

  if (!goals.length) {
    return null;
  }

  const { Icon, accent } = GOAL_CATEGORY_META[category];
  const colors = accent(theme);

  return (
    <Box
      sx={{
        mb: 3.5,
        p: 0,
        backgroundColor: 'transparent',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              backgroundColor: colors.soft,
              border: '1px solid',
              borderColor: colors.border,
              color: colors.main,
            }}
          >
            <Icon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
              {GOAL_CATEGORY_LABELS[category]} Goals
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {goals.length} {goals.length === 1 ? 'goal' : 'goals'} in this category
            </Typography>
          </Box>
        </Stack>
        <Chip
          size="small"
          label={`${goals.length} total`}
          sx={{
            fontWeight: 600,
            backgroundColor: colors.soft,
            color: colors.main,
            border: `1px solid ${colors.border}`,
          }}
        />
      </Stack>

      <Grid container spacing={2}>
        {goals.map((goal) => (
          <Grid item xs={12} md={6} key={goal.id}>
            <GoalCard goal={goal} onClick={onGoalClick} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default GoalCategoryGroup;
