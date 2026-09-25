// @ts-nocheck
import { Grid, Stack } from '@mui/material';
import ProfileHeroCard from './ProfileHeroCard';
import StatsGrid from './StatsGrid';
import ProgressBarChart from './ProgressBarChart';
import NeedsActionList from './NeedsActionList';
import ReviewCyclesPanel from './ReviewCyclesPanel';
import RecentUpdatesCard from './RecentUpdatesCard';
import QuickActions from './QuickActions';

const AdminDashboard = ({ data, loading }) => (
  <Stack spacing={3}>
    <ProfileHeroCard profile={data?.profile} loading={loading} />
    <StatsGrid stats={data?.stats} loading={loading} />

    <Grid container spacing={3}>
      <Grid item xs={12} lg={8}>
        <Stack spacing={3}>
          <ReviewCyclesPanel cycles={data?.cycles} loading={loading} title="Growth Connect cycles" />
          <QuickActions actions={data?.quickActions} loading={loading} />
          <ProgressBarChart title="Review progress" subtitle="Completed vs pending by phase, active financial year" data={data?.phaseProgress} loading={loading} />
        </Stack>
      </Grid>
      <Grid item xs={12} lg={4}>
        <Stack spacing={3}>
          <NeedsActionList rows={data?.needsAction} loading={loading} title="Pending HR actions" />
          <RecentUpdatesCard role="ADMIN" />
        </Stack>
      </Grid>
    </Grid>
  </Stack>
);

export default AdminDashboard;
