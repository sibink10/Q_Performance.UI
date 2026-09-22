// @ts-nocheck
import { Grid } from '@mui/material';
import StatTile from './StatTile';
import { SECTION_GAP } from './homeLayout';

/**
 * Row of KPI tiles. Renders nothing when there are no real stats (and not loading).
 * `skeletonCount` should match how many tiles this role's stats actually resolve to,
 * so the loading placeholders don't reflow into a different column count once data lands.
 */
const StatsGrid = ({ stats, loading, skeletonCount = 4 }) => {
  const items = loading ? Array.from({ length: skeletonCount }) : stats || [];
  if (!items.length) return null;
  const lg = items.length === 1 ? 12 : items.length === 3 ? 4 : items.length === 2 ? 6 : 3;

  return (
    <Grid container spacing={SECTION_GAP}>
      {items.map((s, i) => (
        <Grid item xs={12} sm={6} lg={lg} key={loading ? i : s.id}>
          <StatTile stat={loading ? null : s} loading={loading} />
        </Grid>
      ))}
    </Grid>
  );
};

export default StatsGrid;
