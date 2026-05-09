// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Alert,
  Autocomplete,
  Box,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { useNavigate } from 'react-router-dom';
import usePerformance from '../../hooks/usePerformance';
import { assignReviewForm } from '../../app/state/slices/performanceThunks';
import {
  entraUserToAssignmentPayload,
  fetchEntraUsers,
  importStudentsFromEntra,
  syncStudentsFromEntra,
} from '../../services/usersService';
import { formatDate, getApiErrorMessage } from '../../utils/helpers';
import AppButton from '../common/AppButton';
import { AppLoader, AppCard, ConfirmDialog, StatusChip, PageHeader } from '../common';
import useFinancialYears from '../../hooks/useFinancialYears';
import SyncIcon from '@mui/icons-material/Sync';

const MAX_TAGS_INLINE = 2;

const INITIAL_FORM = {
  financialYearId: '',
  reviewFormId: '',
  employeeIds: [],
};

/** API fields for POST /performance/assignments (from global appraisal config). */
const ASSIGNMENT_TIMELINE_KEYS = [
  'selfEvalStart',
  'selfEvalEnd',
  'managerEvalStart',
  'managerEvalEnd',
  'hrReviewStart',
  'hrReviewEnd',
] as const;

const TIMELINE_ROWS: { label: string; startKey: string; endKey: string }[] = [
  { label: 'Self Evaluation', startKey: 'selfEvalStart', endKey: 'selfEvalEnd' },
  { label: 'Manager valuation', startKey: 'managerEvalStart', endKey: 'managerEvalEnd' },
  { label: 'HR / admin review', startKey: 'hrReviewStart', endKey: 'hrReviewEnd' },
];

/** Matches server contract when assigning via Entra user picker (no department-wide mode yet). */
const ASSIGNMENT_SELECTION_MODE_EMPLOYEES = 'Employees';

const getEntraUserDisplayName = (u: any) =>
  u?.fullName ?? u?.name ?? [u?.firstName, u?.lastName].filter(Boolean).join(' ') ?? '';

const getEntraUserSecondaryText = (u: any) => {
  const email = u?.email ?? u?.mail ?? '';
  const managerName = u?.managerName ?? u?.manager?.displayName ?? '';
  const bits = [
    email ? `Email: ${email}` : '',
    managerName ? `Manager: ${managerName}` : '',
  ].filter(Boolean);
  return bits.join(' • ');
};

function buildAssignmentPayload(
  formData: { financialYearId: string; reviewFormId: string; employeeIds: string[] },
  selectedUsers: { id: string }[],
  appraisalConfig: Record<string, unknown> | null
): { ok: true; payload: Record<string, unknown> } | { ok: false; message: string } {
  if (!appraisalConfig) {
    return { ok: false, message: 'Appraisal configuration could not be loaded. Try again or check Appraisal Config.' };
  }
  const missing = ASSIGNMENT_TIMELINE_KEYS.filter((k) => !appraisalConfig[k]);
  if (missing.length) {
    return {
      ok: false,
      message:
        'Appraisal cycle dates are incomplete. Set all evaluation windows in Appraisal Config before assigning.',
    };
  }
  const timeline = ASSIGNMENT_TIMELINE_KEYS.reduce<Record<string, unknown>>((acc, k) => {
    acc[k] = appraisalConfig[k];
    return acc;
  }, {});
  return {
    ok: true,
    payload: {
      reviewFormId: formData.reviewFormId,
      entraEmployees: selectedUsers.map((u) => entraUserToAssignmentPayload(u)),
      selectionMode: ASSIGNMENT_SELECTION_MODE_EMPLOYEES,
      employeeIds: formData.employeeIds,
      departments: [],
      financialYearId: formData.financialYearId,
      ...timeline,
    },
  };
}

const AssignReviewForm = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    reviewForms,
    appraisalConfig,
    isLoading,
    isSaving,
    error,
    successMessage,
    loadReviewForms,
    loadAppraisalConfig,
    clearError,
    clearSuccess,
  } = usePerformance();
  const { financialYears, activeFinancialYear } = useFinancialYears();

  const [configFetchSettled, setConfigFetchSettled] = useState(false);

  const [formData, setFormData] = useState({ ...INITIAL_FORM });

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [validationError, setValidationError] = useState('');
  const [userSearchInput, setUserSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [entraUsers, setEntraUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersFetchError, setUsersFetchError] = useState('');
  const [pendingRemoveUser, setPendingRemoveUser] = useState(null);
  const [pendingClearAllUsers, setPendingClearAllUsers] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [importing, setImporting] = useState(false);
  const [syncingUsers, setSyncingUsers] = useState(false);
  const [syncSummary, setSyncSummary] = useState(null);
  const [refreshEntraUsersKey, setRefreshEntraUsersKey] = useState(0);

  useEffect(() => {
    loadReviewForms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeFinancialYear?.id) return;
    setFormData((prev) => (prev.financialYearId ? prev : { ...prev, financialYearId: activeFinancialYear.id }));
  }, [activeFinancialYear]);

  useEffect(() => {
    if (!formData.financialYearId) {
      // Nothing to fetch yet (or user cleared selection) — don't show the loading state.
      setConfigFetchSettled(true);
      return;
    }
    setConfigFetchSettled(false);
    loadAppraisalConfig(formData.financialYearId)
      .unwrap()
      .catch(() => {})
      .finally(() => setConfigFetchSettled(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.financialYearId]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(userSearchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [userSearchInput]);

  useEffect(() => {
    let cancelled = false;
    setUsersLoading(true);
    setUsersFetchError('');
    fetchEntraUsers({ search: debouncedSearch, top: 100 })
      .then(({ users }) => {
        if (cancelled) return;
        setEntraUsers(users);
      })
      .catch((e) => {
        if (cancelled) return;
        setEntraUsers([]);
        setUsersFetchError(getApiErrorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setUsersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, refreshEntraUsersKey]);

  const activeReviewForms = useMemo(
    () => reviewForms.filter((form) => form.status !== 'Archived'),
    [reviewForms]
  );

  const timelineComplete = useMemo(() => {
    if (!appraisalConfig) return false;
    return ASSIGNMENT_TIMELINE_KEYS.every((k) => !!appraisalConfig[k]);
  }, [appraisalConfig]);

  const syncSelection = (users) => {
    setSelectedUsers(users);
    setFormData((prev) => ({ ...prev, employeeIds: users.map((u) => u.id) }));
  };

  const resetPage = () => {
    setFormData({ ...INITIAL_FORM });
    setSelectedUsers([]);
    setUserSearchInput('');
    setDebouncedSearch('');
    setValidationError('');
  };

  const handleImportStudents = async () => {
    if (!selectedUsers.length) {
      setValidationError('Select at least one user before importing students.');
      return;
    }
    setImporting(true);
    setValidationError('');
    try {
      const result = await importStudentsFromEntra(selectedUsers.map((u) => entraUserToAssignmentPayload(u)));
      setImportSummary(result);
      setSyncSummary(null);
    } catch (e) {
      setValidationError(getApiErrorMessage(e));
      setImportSummary(null);
    } finally {
      setImporting(false);
    }
  };

  const handleSyncUsers = async () => {
    setSyncingUsers(true);
    setValidationError('');
    try {
      const result = await syncStudentsFromEntra();
      setSyncSummary(result);
      setImportSummary(null);
      setRefreshEntraUsersKey((k) => k + 1);
    } catch (e) {
      setValidationError(getApiErrorMessage(e));
      setSyncSummary(null);
    } finally {
      setSyncingUsers(false);
    }
  };

  const handleAssign = async () => {
    setValidationError('');

    if (!formData.financialYearId || !formData.reviewFormId) {
      setValidationError('Please select review period and review form.');
      return;
    }

    if (!formData.employeeIds.length) {
      setValidationError('Please select at least one user.');
      return;
    }

    const built = buildAssignmentPayload(formData, selectedUsers, appraisalConfig);
    if (!built.ok) {
      setValidationError(built.message);
      return;
    }

    try {
      await dispatch(assignReviewForm(built.payload)).unwrap();
      resetPage();
    } catch {
      /* error → Redux slice / Alert */
    }
  };

  if (isLoading && !reviewForms.length) return <AppLoader />;

  return (
    <Box>
      <PageHeader
        title="Assign Review Form"
        subtitle="Choose review period, select a review form, and assign it to users."
        actions={
          <Stack direction="row" spacing={1}>
            <AppButton
              variant="outlined"
              startIcon={<SyncIcon />}
              loading={syncingUsers}
              onClick={handleSyncUsers}
            >
              Sync Entra users
            </AppButton>
            <AppButton
              variant="outlined"
              startIcon={<ListAltIcon />}
              onClick={() => navigate('/operations/performance/assignments')}
            >
              View all assigned forms
            </AppButton>
          </Stack>
        }
      />

      <AppCard variant="glass" sx={{ p: 3 }}>
        <Stack spacing={3}>
          {(error || validationError || usersFetchError) && (
            <Alert
              severity="error"
              onClose={() => {
                clearError();
                setUsersFetchError('');
              }}
            >
              {validationError || usersFetchError || error}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Review Period</InputLabel>
                <Select
                  label="Review Period"
                  value={formData.financialYearId}
                  onChange={(e) => {
                    setSelectedUsers([]);
                    setFormData((prev) => ({
                      ...prev,
                      financialYearId: e.target.value,
                      employeeIds: [],
                    }));
                  }}
                >
                  {financialYears.map((year) => (
                    <MenuItem key={year.id} value={year.id}>{year.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={8}>
              <FormControl fullWidth size="small">
                <InputLabel>Review Form</InputLabel>
                <Select
                  label="Review Form"
                  value={formData.reviewFormId}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      reviewFormId: e.target.value,
                    }));
                  }}
                >
                  {activeReviewForms.map((form) => (
                    <MenuItem key={form.id} value={form.id}>
                      {form.name} {form.period ? `(${form.period})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <AppCard
            sx={{
              p: 2,
              boxShadow: 'none',
              border: '1px solid',
              borderColor: alpha('#01df96', 0.55),
              borderLeftWidth: 4,
              borderLeftColor: '#01df96',
              bgcolor: alpha('#01df96', 0.06),
            }}
          >
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Evaluation windows (from Appraisal Config)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              These dates are loaded from the appraisal config API and included in the assignment
              request.
            </Typography>
            {!!formData.financialYearId && !configFetchSettled && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={18} />
                <Typography variant="body2" color="text.secondary">
                  Loading config…
                </Typography>
              </Box>
            )}
            {configFetchSettled && appraisalConfig && (
              <Grid container spacing={1}>
                {TIMELINE_ROWS.map(({ label, startKey, endKey }) => (
                  <Grid item xs={12} key={startKey}>
                    <Typography variant="body2">
                      <strong>{label}:</strong>{' '}
                      {formatDate(appraisalConfig[startKey])} – {formatDate(appraisalConfig[endKey])}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            )}
            {!!formData.financialYearId && configFetchSettled && !appraisalConfig && (
              <Typography variant="body2" color="warning.main">
                No appraisal configuration found. Save settings under Appraisal Config first.
              </Typography>
            )}
          </AppCard>

          <Divider />

          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Matching users
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                {usersLoading && <CircularProgress size={18} />}
                <Chip
                  label={`${formData.employeeIds.length} selected`}
                  color={formData.employeeIds.length ? 'primary' : 'default'}
                  size="small"
                />
              </Stack>
            </Box>

            <Autocomplete
              multiple
              disableCloseOnSelect
              fullWidth
              size="small"
              options={entraUsers}
              value={selectedUsers}
              onChange={(_, newValue) => {
                syncSelection(newValue);
                // After picking a user, clear the search box so the next pick starts fresh.
                setUserSearchInput('');
                setDebouncedSearch('');
              }}
              inputValue={userSearchInput}
              onInputChange={(_, val, reason) => {
                if (reason !== 'reset') setUserSearchInput(val);
              }}
              filterOptions={(opts) => opts}
              blurOnSelect={false}
              clearOnBlur={false}
              getOptionLabel={(option) => getEntraUserDisplayName(option)}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              loading={usersLoading}
              loadingText="Searching…"
              noOptionsText={usersLoading ? 'Searching…' : 'No matching users'}
              renderTags={(value, getTagProps) => (
                <>
                  {value.slice(0, MAX_TAGS_INLINE).map((option, index) => {
                    const { key, ...chipProps } = getTagProps({ index });
                    return (
                      <Chip
                        {...chipProps}
                        key={option.id}
                        label={getEntraUserDisplayName(option)}
                        size="small"
                        onDelete={() => setPendingRemoveUser(option)}
                      />
                    );
                  })}
                  {value.length > MAX_TAGS_INLINE && (
                    <Chip key="more-selected" label="..." size="small" variant="outlined" />
                  )}
                </>
              )}
              componentsProps={{
                paper: {
                  elevation: 8,
                  sx: {
                    mt: 1,
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: theme.palette.background.paper,
                    boxShadow: `0 20px 50px ${alpha(theme.palette.common.black, 0.14)}`,
                    overflow: 'hidden',
                    '& .MuiAutocomplete-listbox': {
                      py: 0.75,
                      '& .MuiAutocomplete-option': {
                        py: 1.35,
                        px: 2,
                      },
                      '& .MuiAutocomplete-option.Mui-focused': {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                      },
                    },
                  },
                },
              }}
              ListboxProps={{ style: { maxHeight: 300 } }}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box sx={{ py: 0.25 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {getEntraUserDisplayName(option)}
                    </Typography>
                    {!!getEntraUserSecondaryText(option) && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {getEntraUserSecondaryText(option)}
                      </Typography>
                    )}
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search and select users"
                  placeholder="Type to search the directory - select multiple from the list"
                />
              )}
            />
          </Box>

          {formData.employeeIds.length > 0 && (
            <AppCard sx={{ p: 2, borderStyle: 'dashed', bgcolor: 'grey.50', boxShadow: 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2">Selected users</Typography>
                <AppButton
                  variant="text"
                  color="error"
                  size="small"
                  disabled={!selectedUsers.length}
                  onClick={() => setPendingClearAllUsers(true)}
                >
                  Clear all
                </AppButton>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedUsers.map((emp) => (
                  <Chip
                    key={emp.id}
                    label={getEntraUserDisplayName(emp)}
                    onDelete={() => setPendingRemoveUser(emp)}
                  />
                ))}
              </Box>
            </AppCard>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack direction="row" spacing={1}>
              <StatusChip status={isSaving || importing ? 'In Progress' : 'Pending'} />
            </Stack>
            <AppButton
              onClick={handleAssign}
              loading={isSaving}
              startIcon={<AssignmentTurnedInIcon />}
              disabled={
                !formData.financialYearId ||
                !formData.reviewFormId ||
                !formData.employeeIds.length ||
                !configFetchSettled ||
                !timelineComplete
              }
            >
              Assign Review Form
            </AppButton>
          </Box>
          {(importSummary || syncSummary) && (
            <Alert severity={(importSummary ?? syncSummary).errors?.length ? 'warning' : 'success'}>
              Added: {(importSummary ?? syncSummary).addedCount} | Updated: {(importSummary ?? syncSummary).updatedCount}
              {(importSummary ?? syncSummary).errors?.length
                ? ` | Errors: ${(importSummary ?? syncSummary).errors
                    .map((err) => err.message || `Row ${typeof err.index === 'number' ? err.index + 1 : 'Unknown'}`)
                    .join('; ')}`
                : ''}
            </Alert>
          )}
        </Stack>
      </AppCard>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={clearSuccess}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={clearSuccess}>
          {successMessage}
        </Alert>
      </Snackbar>

      <ConfirmDialog
        open={!!pendingRemoveUser}
        title="Remove user"
        message={
          <>
            Remove <strong>{getEntraUserDisplayName(pendingRemoveUser) || ''}</strong> from the assignment selection?
          </>
        }
        confirmText="Remove"
        cancelText="Cancel"
        confirmColor="error"
        onClose={() => setPendingRemoveUser(null)}
        onConfirm={() => {
          if (!pendingRemoveUser) return;
          syncSelection(selectedUsers.filter((u) => u.id !== pendingRemoveUser.id));
          setPendingRemoveUser(null);
        }}
      />

      <ConfirmDialog
        open={pendingClearAllUsers}
        title="Clear all selected users"
        message="Remove all selected users from this assignment?"
        confirmText="Clear all"
        cancelText="Cancel"
        confirmColor="error"
        onClose={() => setPendingClearAllUsers(false)}
        onConfirm={() => {
          syncSelection([]);
          setUserSearchInput('');
          setDebouncedSearch('');
          setPendingClearAllUsers(false);
        }}
      />
    </Box>
  );
};

export default AssignReviewForm;
