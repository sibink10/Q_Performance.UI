// @ts-nocheck
import { Grid, Stack } from '@mui/material';
import ProfileHeroCard from './ProfileHeroCard';
import StatsGrid from './StatsGrid';
import CurrentPeriodBanner from './CurrentPeriodBanner';
import ReviewCyclesPanel from './ReviewCyclesPanel';
import RecentUpdatesCard from './RecentUpdatesCard';
import QuickActions from './QuickActions';

const EmployeeDashboard = ({ data, loading }) => (
  <Stack spacing={3}>
    <ProfileHeroCard profile={data?.profile} loading={loading} />
    <StatsGrid stats={data?.stats} loading={loading} />

    <Grid container spacing={3}>
      <Grid item xs={12} lg={8}>
        <Stack spacing={3}>
          <CurrentPeriodBanner period={data?.currentPeriod} goalProgress={data?.goalProgress} loading={loading} />
          <ReviewCyclesPanel cycles={data?.cycles} loading={loading} title="Growth Connect cycles" />
          <QuickActions actions={data?.quickActions} loading={loading} />
        </Stack>
      </Grid>
      <Grid item xs={12} lg={4}>
        <RecentUpdatesCard role="EMPLOYEE" />
      </Grid>
    </Grid>
  </Stack>
);

export default EmployeeDashboard;
