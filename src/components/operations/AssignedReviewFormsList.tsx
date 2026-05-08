// @ts-nocheck
// Admin: paged list of performance assignments with optional financial year / review form filters.

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  IconButton,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';
import AppButton from '../common/AppButton';
import { AppCard, AppLoader, EmptyState, PageHeader } from '../common';
import { getAssignmentsPaged } from '../../services/assignReviewFormService';
import performanceService from '../../services/performanceService';
import { formatDate, getApiErrorMessage, toArrayFromPayload } from '../../utils/helpers';
import useFinancialYears from '../../hooks/useFinancialYears';

const emptyFyFilter = { label: 'All review periods', value: '' };
const emptyFormFilter = { id: '', name: 'All review forms' };

/** Supports API envelope `{ success, data: { data, totalCount, page, pageSize } }` or a flat paged object. */
const readPaged = (res) => {
  const inner = res?.data;
  const paged =
    inner &&
    typeof inner === 'object' &&
    !Array.isArray(inner) &&
    (Array.isArray(inner.data) ||
      Array.isArray(inner.Data) ||
      typeof inner.totalCount === 'number' ||
      typeof inner.TotalCount === 'number')
      ? inner
      : res && typeof res === 'object' && (Array.isArray(res.data) || typeof res.totalCount === 'number')
        ? res
        : {};

  const data = paged?.data ?? paged?.Data ?? [];
  const totalCount = Number(paged?.totalCount ?? paged?.TotalCount ?? 0) || 0;
  const page = Number(paged?.page ?? paged?.Page ?? 1) || 1;
  const pageSize = Number(paged?.pageSize ?? paged?.PageSize ?? 20) || 20;
  return { data, totalCount, page, pageSize };
};

/** Grouped assignment summary row from GET /performance/assignments */
const readSummaryRow = (row) => ({
  reviewFormId: row?.reviewFormId ?? row?.ReviewFormId,
  reviewFormName: row?.reviewFormName ?? row?.ReviewFormName,
  financialYear: row?.financialYear ?? row?.FinancialYear,
  financialYearId: row?.financialYearId ?? row?.FinancialYearId,
  employeeCount: Number(row?.employeeCount ?? row?.EmployeeCount ?? 0) || 0,
  selfEvalStart: row?.selfEvalStart ?? row?.SelfEvalStart,
  selfEvalEnd: row?.selfEvalEnd ?? row?.SelfEvalEnd,
  managerEvalStart: row?.managerEvalStart ?? row?.ManagerEvalStart,
  managerEvalEnd: row?.managerEvalEnd ?? row?.ManagerEvalEnd,
  hrReviewStart: row?.hrReviewStart ?? row?.HrReviewStart,
  hrReviewEnd: row?.hrReviewEnd ?? row?.HrReviewEnd,
  lastAssignedAt: row?.lastAssignedAt ?? row?.LastAssignedAt,
});

const formatWindow = (start, end) => {
  if (!start && !end) return '—';
  return `${formatDate(start)} – ${formatDate(end)}`;
};

const AssignedReviewFormsList = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [fyFilter, setFyFilter] = useState(emptyFyFilter);
  const [formFilter, setFormFilter] = useState(emptyFormFilter);
  const [reviewFormOptions, setReviewFormOptions] = useState([emptyFormFilter]);
  const { financialYears } = useFinancialYears();

  useEffect(() => {
    let cancelled = false;
    performanceService
      .getReviewForms()
      .then((list) => {
        if (cancelled) return;
        const forms = toArrayFromPayload(list);
        setReviewFormOptions([
          emptyFormFilter,
          ...forms.map((f) => ({
            id: f.id ?? f._id,
            name: f.name ?? f.title ?? 'Untitled',
          })),
        ]);
      })
      .catch(() => {
        if (!cancelled) setReviewFormOptions([emptyFormFilter]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fyAutocompleteOptions = useMemo(
    () => [emptyFyFilter, ...financialYears.map((y) => ({ label: y.name, value: y.id }))],
    [financialYears]
  );

  const fetchPage = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const raw = await getAssignmentsPaged({
        page: page + 1,
        pageSize: rowsPerPage,
        financialYearId: fyFilter.value || undefined,
        reviewFormId: formFilter.id || undefined,
      });
      if (raw && raw.success === false) {
        setRows([]);
        setTotalCount(0);
        setError(raw.message || 'Could not load assignments.');
        return;
      }
      const p = readPaged(raw);
      setRows((p.data || []).map(readSummaryRow));
      setTotalCount(p.totalCount);
    } catch (e) {
      setRows([]);
      setTotalCount(0);
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, fyFilter.value, formFilter.id]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const handleChangePage = (_e, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const onFyChange = (_e, value) => {
    setFyFilter(value || emptyFyFilter);
    setPage(0);
  };

  const onFormChange = (_e, value) => {
    setFormFilter(value || emptyFormFilter);
    setPage(0);
  };

  const openEmployeesForRow = (r) => {
    const qs = new URLSearchParams({
      reviewFormId: r.reviewFormId,
      financialYearId: r.financialYearId,
    });
    if (r.reviewFormName) qs.set('reviewFormName', r.reviewFormName);
    navigate(`/operations/performance/assignments/employees?${qs.toString()}`);
  };

  return (
    <Box>
      <PageHeader
        title="Assigned review forms"
        subtitle="Summary by review form and review period. Open the employee roster (eye icon) to submit HR reviews, then publish results to employees (visible in their Published reviews)."
        actions={
          <AppButton variant="outlined" onClick={() => navigate('/operations/performance/assign')}>
            Back to assign
          </AppButton>
        }
      />

      <AppCard sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <Autocomplete
            sx={{ minWidth: 260, flex: 1 }}
            size="small"
            options={fyAutocompleteOptions}
            value={fyFilter}
            onChange={onFyChange}
            getOptionLabel={(o) => o.label}
            isOptionEqualToValue={(a, b) => a.value === b.value}
            filterSelectedOptions={false}
            renderInput={(params) => (
              <TextField {...params} label="Review period" placeholder="Search period…" />
            )}
          />
          <Autocomplete
            sx={{ minWidth: 280, flex: 1 }}
            size="small"
            options={reviewFormOptions}
            value={formFilter}
            onChange={onFormChange}
            getOptionLabel={(o) => o.name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            filterSelectedOptions={false}
            renderInput={(params) => (
              <TextField {...params} label="Review form" placeholder="Search form…" />
            )}
          />
        </Stack>
      </AppCard>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading && !rows.length ? (
        <AppLoader />
      ) : (
        <AppCard sx={{ overflow: 'hidden', p: 0 }}>
          <TableContainer sx={{ maxWidth: '100%' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Review form</TableCell>
                  <TableCell>Review period</TableCell>
                  <TableCell align="right">Employees</TableCell>
                  <TableCell>Self evaluation</TableCell>
                  <TableCell>Manager evaluation</TableCell>
                  <TableCell>HR review</TableCell>
                  <TableCell>Last assigned</TableCell>
                  <TableCell align="right"> </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <EmptyState variant="noContent" message="No assignments match the current filters." minHeight={220} />
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={`${r.reviewFormId}-${r.financialYear}`} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {r.reviewFormName || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>{r.financialYear ?? '—'}</TableCell>
                      <TableCell align="right">{r.employeeCount}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatWindow(r.selfEvalStart, r.selfEvalEnd)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatWindow(r.managerEvalStart, r.managerEvalEnd)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatWindow(r.hrReviewStart, r.hrReviewEnd)}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(r.lastAssignedAt)}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="View employees">
                          <span>
                            <IconButton
                              size="small"
                              aria-label="View employees"
                              onClick={() => openEmployeesForRow(r)}
                              disabled={!r.reviewFormId || !r.financialYearId}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            rowsPerPageOptions={[10, 20, 50]}
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </AppCard>
      )}

      {loading && rows.length > 0 ? (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Updating…
        </Typography>
      ) : null}
    </Box>
  );
};

export default AssignedReviewFormsList;
