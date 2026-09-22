// @ts-nocheck
// Home dashboard entry: picks the dashboard by the signed-in user's role.
import { Alert, Box, Stack, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectUserRole } from '../../app/state/slices/authSlice';
import { homeType } from '../../components/home/homeTypography';
import { useHomeData } from '../../hooks/useHomeData';
import EmployeeDashboard from '../../components/home/EmployeeDashboard';
import ManagerDashboard from '../../components/home/ManagerDashboard';
import AdminDashboard from '../../components/home/AdminDashboard';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const toHomeRole = (role) => {
  if (role === 'ADMIN' || role === 'HR') return 'ADMIN';
  if (role === 'MANAGER') return 'MANAGER';
  return 'EMPLOYEE';
};

const Home = () => {
  const role = toHomeRole(useSelector(selectUserRole));
  const user = useSelector(selectCurrentUser);
  const { data, loading, error } = useHomeData(role, user);

  const Dashboard = { ADMIN: AdminDashboard, MANAGER: ManagerDashboard, EMPLOYEE: EmployeeDashboard }[role];
  const firstName = (data?.profile?.name || user?.firstName || user?.name || '').split(' ')[0];

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
        spacing={1.5}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography sx={homeType.pageTitle}>
            {greeting()}
            {firstName ? `, ${firstName}` : ''} 👋
          </Typography>
          <Typography sx={{ ...homeType.pageSubtitle, mt: 0.25 }}>
            Here is what is happening with performance reviews today.
          </Typography>
        </Box>
      </Stack>
      {error ? <Alert severity="error">Could not load your dashboard. Please try again.</Alert> : <Dashboard data={data} loading={loading} />}
    </Box>
  );
};

export default Home;
