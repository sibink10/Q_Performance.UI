// @ts-nocheck
import { Grid, Stack } from '@mui/material';
import ProfileHeroCard from './ProfileHeroCard';
import StatsGrid from './StatsGrid';
import CurrentPeriodBanner from './CurrentPeriodBanner';
import ProgressBarChart from './ProgressBarChart';
import NeedsActionList from './NeedsActionList';
import ReviewCyclesPanel from './ReviewCyclesPanel';
import RecentUpdatesCard from './RecentUpdatesCard';
import QuickActions from './QuickActions';

const ManagerDashboard = ({ data, loading }) => (
  <Stack spacing={3}>
    <ProfileHeroCard profile={data?.profile} loading={loading} />
    <StatsGrid stats={data?.stats} loading={loading} />

    <Grid container spacing={3}>
      <Grid item xs={12} lg={8}>
        <Stack spacing={3}>
          <CurrentPeriodBanner period={data?.currentPeriod} loading={loading} />
          <ReviewCyclesPanel cycles={data?.cycles} loading={loading} title="Growth Connect cycles" />
          <QuickActions actions={data?.quickActions} loading={loading} />
          <ProgressBarChart title="Team review progress" subtitle="Completed vs pending by phase" data={data?.phaseProgress} loading={loading} />
        </Stack>
      </Grid>
      <Grid item xs={12} lg={4}>
        <Stack spacing={3}>
          <NeedsActionList rows={data?.needsAction} loading={loading} />
          <RecentUpdatesCard role="MANAGER" />
        </Stack>
      </Grid>
    </Grid>
  </Stack>
);

export default ManagerDashboard;
