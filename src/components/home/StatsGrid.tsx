// @ts-nocheck
import { Grid } from '@mui/material';
import StatTile from './StatTile';

/** Row of KPI tiles. Renders nothing when there are no real stats (and not loading). */
const StatsGrid = ({ stats, loading }) => {
  const items = loading ? [0, 1, 2, 3] : stats || [];
  if (!items.length) return null;
  const lg = items.length === 3 ? 4 : items.length === 2 ? 6 : 3;

  return (
    <Grid container spacing={2}>
      {items.map((s, i) => (
        <Grid item xs={12} sm={6} lg={lg} key={loading ? i : s.id}>
          <StatTile stat={loading ? null : s} loading={loading} />
        </Grid>
      ))}
    </Grid>
  );
};

export default StatsGrid;
