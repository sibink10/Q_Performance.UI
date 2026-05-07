

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, FormControl, InputLabel,
  Select, MenuItem, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Alert, Snackbar,
  Tooltip, Stack, TextField, InputAdornment, Badge,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import AddIcon from '@mui/icons-material/Add';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import usePerformance from '../../hooks/usePerformance';
import AppButton from '../../components/common/AppButton';
import { AppCard, AppLoader, AppModal, PageHeader } from '../../components/common/index.jsx';
import { EVALUATION_PHASES, PHASE_LABELS } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import useFinancialYears from '../../hooks/useFinancialYears';

// ── Phase status chip ─────────────────────────────────────────────────────────
const PhaseChip = ({ status }) => {
  const colorMap = {
    'Not Started': 'default',
    'In Progress': 'warning',
    Submitted: 'info',
    Completed: 'success',
    'Not Applicable': 'default',
    Published: 'success',
  };
  return (
    <Chip
      label={status || 'Pending'}
      color={colorMap[status] || 'default'}
      size="small"
      variant="filled"
      sx={{ fontSize: 11, height: 22 }}
    />
  );
};

// ── Extend Timeline Modal ────────────────────────────────────────────────────
const ExtendTimelineModal = ({ open, onClose, employee, onSave, isSaving }) => {
  const [phase, setPhase] = useState(EVALUATION_PHASES.SELF);
  const [newDate, setNewDate] = useState(null);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <AppModal
        open={open}
        onClose={onClose}
        title={`Extend Timeline${employee ? ` — ${employee.name}` : ' (Global)'}`}
        maxWidth="sm"
        actions={
          <>
            <AppButton variant="outlined" startIcon={null} onClick={onClose}>Cancel</AppButton>
            <AppButton
              startIcon={null}
              loading={isSaving}
              disabled={!newDate}
              onClick={() => onSave({ employeeId: employee?.id || null, phase, newDate: newDate?.toISOString() })}
            >
              Extend Timeline
            </AppButton>
          </>
        }
      >
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {!employee && (
            <Alert severity="info">
              This will extend the timeline for ALL employees in the current filtered view.
            </Alert>
          )}
          <FormControl fullWidth size="small">
            <InputLabel>Phase</InputLabel>
            <Select value={phase} label="Phase" onChange={(e) => setPhase(e.target.value)}>
              {Object.entries(PHASE_LABELS).map(([k, v]) => (
                <MenuItem key={k} value={k}>{v}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <DatePicker
            label="New End Date *"
            value={newDate}
            onChange={setNewDate}
            minDate={dayjs().add(1, 'day')}
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
          />
        </Stack>
      </AppModal>
    </LocalizationProvider>
  );
};

const OperationsPerformance = () => {
  const navigate = useNavigate();
  const {
    dashboardEmployees, dashboardFilters, reviewForms,
    isLoading, isSaving, error, successMessage,
    loadDashboard, loadReviewForms, setFilter,
    extendDeadline, clearSuccess,
  } = usePerformance();

  const [search, setSearch] = useState('');
  const [extendModal, setExtendModal] = useState({ open: false, employee: null });
  const { financialYears } = useFinancialYears();

  useEffect(() => {
    loadReviewForms();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (dashboardFilters.financialYearId && dashboardFilters.reviewFormId) {
      loadDashboard(dashboardFilters.financialYearId, dashboardFilters.reviewFormId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardFilters]);

  // Filter employees by search
  const filteredEmployees = dashboardEmployees.filter(
    (e) =>
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeId?.toLowerCase().includes(search.toLowerCase())
  );

  const handleExtend = (data) => {
    extendDeadline(data);
    setExtendModal({ open: false, employee: null });
  };

  return (
    <Box>
      <PageHeader
        title="Performance Dashboard"
        subtitle="Monitor evaluation progress across all employees"
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <AppButton
              variant="outlined"
              startIcon={<EditCalendarIcon />}
              onClick={() => setExtendModal({ open: true, employee: null })}
            >
              Extend Deadline (Global)
            </AppButton>
            <AppButton startIcon={<AddIcon />} onClick={() => navigate('/operations/performance/assign')}>
              Assign Review Form
            </AppButton>
          </Stack>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filters */}
      <AppCard sx={{ p: 2.5, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Financial Year</InputLabel>
              <Select
                value={dashboardFilters.financialYearId}
                label="Financial Year"
                onChange={(e) => setFilter({ financialYearId: e.target.value })}
              >
                {financialYears.map((y) => (
                  <MenuItem key={y.id} value={y.id}>{y.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Review Form</InputLabel>
              <Select
                value={dashboardFilters.reviewFormId}
                label="Review Form"
                onChange={(e) => setFilter({ reviewFormId: e.target.value })}
              >
                <MenuItem value="">All Forms</MenuItem>
                {reviewForms.map((f) => (
                  <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              size="small" fullWidth
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <AppButton
              variant="outlined"
              startIcon={<DownloadIcon />}
              fullWidth
              disabled={!dashboardFilters.financialYearId || !filteredEmployees.length}
            >
              Export
            </AppButton>
          </Grid>
        </Grid>
      </AppCard>

      {/* Employee Table */}
      {isLoading ? (
        <AppLoader message="Loading performance data..." />
      ) : !dashboardFilters.financialYearId ? (
        <AppCard sx={{ p: 6, textAlign: 'center' }}>
          <FilterListIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography color="text.secondary">Select a financial year to view performance data</Typography>
        </AppCard>
      ) : (
        <AppCard sx={{ overflow: 'hidden', p: 0 }}>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: 'grey.50', fontWeight: 600, fontSize: 12 } }}>
                  <TableCell>Employee</TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Assigned Form</TableCell>
                  <TableCell align="center">Self Eval</TableCell>
                  <TableCell align="center">Manager Eval</TableCell>
                  <TableCell align="center">HR Review</TableCell>
                  <TableCell align="center">Published</TableCell>
                  <TableCell>Reporting Manager</TableCell>
                  <TableCell align="center">Final Rating</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                      No employees found for the selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((emp) => (
                    <TableRow key={emp.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{emp.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{emp.designation}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" fontFamily="monospace">{emp.employeeId}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{emp.formName}</Typography>
                      </TableCell>
                      <TableCell align="center"><PhaseChip status={emp.selfEvalStatus} /></TableCell>
                      <TableCell align="center"><PhaseChip status={emp.managerEvalStatus} /></TableCell>
                      <TableCell align="center"><PhaseChip status={emp.hrReviewStatus} /></TableCell>
                      <TableCell align="center"><PhaseChip status={emp.publishedStatus} /></TableCell>
                      <TableCell>
                        <Typography variant="caption">{emp.managerName || '—'}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        {emp.finalRating ? (
                          <Chip
                            label={`${emp.finalRating} / ${emp.ratingScale}`}
                            color="primary"
                            size="small"
                          />
                        ) : '—'}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Extend Timeline">
                          <IconButton
                            size="small"
                            onClick={() => setExtendModal({ open: true, employee: emp })}
                          >
                            <EditCalendarIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary">
              {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''} found
            </Typography>
          </Box>
        </AppCard>
      )}

      {/* Extend Timeline Modal */}
      <ExtendTimelineModal
        open={extendModal.open}
        onClose={() => setExtendModal({ open: false, employee: null })}
        employee={extendModal.employee}
        onSave={handleExtend}
        isSaving={isSaving}
      />

      <Snackbar open={!!successMessage} autoHideDuration={4000} onClose={clearSuccess}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={clearSuccess}>{successMessage}</Alert>
      </Snackbar>
    </Box>
  );
};

export default OperationsPerformance;
