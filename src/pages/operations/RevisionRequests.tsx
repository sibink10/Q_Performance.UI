import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import dayjs from 'dayjs';
import type { GoalRevisionStatus } from '../../types/goalRevision';
import type { AssignableEmployee } from '../../types/user';
import { REVISION_REASON, REVISION_REASON_LABELS } from '../../utils/revisionReasonConstants';
import { AppCard, PageHeader } from '../../components/common';
import GoalRevisionApprovalTable from '../../components/operations/revision-requests/GoalRevisionApprovalTable';
import GrowthConnectRevisionApprovalTable from '../../components/operations/revision-requests/GrowthConnectRevisionApprovalTable';
import goalsService from '../../services/goalsService';
import useGoalRevisions from '../../hooks/useGoalRevisions';
import useGoals from '../../hooks/useGoals';
import useGrowthConnectRevisions from '../../hooks/useGrowthConnectRevisions';

type StatusTab = GoalRevisionStatus | 'ALL';
type RevisionKind = 'GOAL' | 'GROWTH_CONNECT';

const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'ALL', label: 'All' },
];

const RevisionRequestsPage = () => {
  const {
    pendingRevisions,
    isLoading,
    getPendingRevisions,
    approveRevision,
    rejectRevision,
    isMutating,
    error,
    successMessage,
    clearError,
    clearSuccess,
  } = useGoalRevisions();
  const { teamGoals, loadCycleGoals } = useGoals();

  const [revisionKind, setRevisionKind] = useState<RevisionKind>('GOAL');
  const {
    pendingRevisions: pendingGrowthConnectRevisions,
    isLoading: isGrowthConnectLoading,
    getPendingRevisions: getPendingGrowthConnectRevisions,
    approveRevision: approveGrowthConnectRevision,
    rejectRevision: rejectGrowthConnectRevision,
    isMutating: isGrowthConnectMutating,
    error: growthConnectError,
    successMessage: growthConnectSuccessMessage,
    clearError: clearGrowthConnectError,
    clearSuccess: clearGrowthConnectSuccess,
  } = useGrowthConnectRevisions();

  const [employees, setEmployees] = useState<AssignableEmployee[]>([]);
  const [statusTab, setStatusTab] = useState<StatusTab>('PENDING');
  const [employeeFilter, setEmployeeFilter] = useState('ALL');
  const [managerFilter, setManagerFilter] = useState('ALL');
  const [reasonFilter, setReasonFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    goalsService.getAssignableEmployees().then(setEmployees);
  }, []);

  useEffect(() => {
    getPendingRevisions();
    loadCycleGoals();
  }, [getPendingRevisions, loadCycleGoals]);

  useEffect(() => {
    getPendingGrowthConnectRevisions();
  }, [getPendingGrowthConnectRevisions]);

  const employeeOptions = useMemo(() => employees.filter((e) => e.role === 'EMPLOYEE'), [employees]);
  const managerOptions = useMemo(
    () => employees.filter((e) => e.role === 'MANAGER' || e.role === 'ADMIN'),
    [employees],
  );

  const filtered = useMemo(() => {
    return pendingRevisions.filter((revision) => {
      if (statusTab !== 'ALL' && revision.status !== statusTab) return false;
      if (employeeFilter !== 'ALL' && revision.employeeId !== employeeFilter) return false;
      if (managerFilter !== 'ALL' && revision.requestedBy !== managerFilter) return false;
      if (reasonFilter !== 'ALL' && revision.reason !== reasonFilter) return false;
      if (dateFrom && dayjs(revision.requestedAt).isBefore(dayjs(dateFrom), 'day')) return false;
      if (dateTo && dayjs(revision.requestedAt).isAfter(dayjs(dateTo), 'day')) return false;
      return true;
    });
  }, [pendingRevisions, statusTab, employeeFilter, managerFilter, reasonFilter, dateFrom, dateTo]);

  const handleApprove = async (id: string, reviewComment: string) => {
    const result = await approveRevision(id, reviewComment);
    loadCycleGoals();
    return result;
  };

  const handleReject = async (id: string, reviewComment: string) => {
    const result = await rejectRevision(id, reviewComment);
    loadCycleGoals();
    return result;
  };

  const filteredGrowthConnectRevisions = useMemo(
    () =>
      pendingGrowthConnectRevisions.filter((revision) =>
        statusTab === 'ALL' ? true : revision.status === statusTab,
      ),
    [pendingGrowthConnectRevisions, statusTab],
  );

  return (
    <Box>
      <PageHeader
        title="Revision Requests"
        subtitle="Review manager-submitted goal and Growth Connect revision requests and approve or reject them."
      />

      <Tabs
        value={revisionKind}
        onChange={(_e, value) => setRevisionKind(value)}
        sx={{ mb: 2, minHeight: 40 }}
      >
        <Tab value="GOAL" label="Goal Revisions" sx={{ minHeight: 40, textTransform: 'none', fontWeight: 700 }} />
        <Tab
          value="GROWTH_CONNECT"
          label="Growth Connect Revisions"
          sx={{ minHeight: 40, textTransform: 'none', fontWeight: 700 }}
        />
      </Tabs>

      {revisionKind === 'GOAL' && (
      <AppCard sx={{ p: 2.5, mb: 2.5 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="filter-employee">Employee</InputLabel>
              <Select
                labelId="filter-employee"
                label="Employee"
                value={employeeFilter}
                onChange={(e: SelectChangeEvent<string>) => setEmployeeFilter(e.target.value)}
              >
                <MenuItem value="ALL">All employees</MenuItem>
                {employeeOptions.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="filter-manager">Manager</InputLabel>
              <Select
                labelId="filter-manager"
                label="Manager"
                value={managerFilter}
                onChange={(e: SelectChangeEvent<string>) => setManagerFilter(e.target.value)}
              >
                <MenuItem value="ALL">All managers</MenuItem>
                {managerOptions.map((mgr) => (
                  <MenuItem key={mgr.id} value={mgr.id}>
                    {mgr.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="filter-reason">Reason</InputLabel>
              <Select
                labelId="filter-reason"
                label="Reason"
                value={reasonFilter}
                onChange={(e: SelectChangeEvent<string>) => setReasonFilter(e.target.value)}
              >
                <MenuItem value="ALL">All reasons</MenuItem>
                {Object.values(REVISION_REASON).map((key) => (
                  <MenuItem key={key} value={key}>
                    {REVISION_REASON_LABELS[key]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3} md={1}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="From"
              InputLabelProps={{ shrink: true }}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={3} md={1}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="To"
              InputLabelProps={{ shrink: true }}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </Grid>
        </Grid>
      </AppCard>
      )}

      <Tabs
        value={statusTab}
        onChange={(_e, value) => setStatusTab(value)}
        sx={{ mb: 2, minHeight: 40 }}
      >
        {STATUS_TABS.map((tab) => (
          <Tab
            key={tab.value}
            value={tab.value}
            label={tab.label}
            sx={{ minHeight: 40, textTransform: 'none', fontWeight: 700 }}
          />
        ))}
      </Tabs>

      {revisionKind === 'GOAL' ? (
        <GoalRevisionApprovalTable
          revisions={filtered}
          goals={teamGoals}
          isLoading={isLoading}
          approveRevision={handleApprove}
          rejectRevision={handleReject}
          isMutating={isMutating}
          error={error}
          successMessage={successMessage}
          clearError={clearError}
          clearSuccess={clearSuccess}
        />
      ) : (
        <GrowthConnectRevisionApprovalTable
          revisions={filteredGrowthConnectRevisions}
          isLoading={isGrowthConnectLoading}
          approveRevision={approveGrowthConnectRevision}
          rejectRevision={rejectGrowthConnectRevision}
          isMutating={isGrowthConnectMutating}
          error={growthConnectError}
          successMessage={growthConnectSuccessMessage}
          clearError={clearGrowthConnectError}
          clearSuccess={clearGrowthConnectSuccess}
        />
      )}
    </Box>
  );
};

export default RevisionRequestsPage;
