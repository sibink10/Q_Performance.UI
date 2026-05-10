// @ts-nocheck
// Admin: employees assigned under a review form + financial year ID (from query string).

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  IconButton,
  CircularProgress,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import EditCalendarOutlinedIcon from '@mui/icons-material/EditCalendarOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppButton from '../common/AppButton';
import { AppCard, AppLoader, AppSnackbar, PageHeader } from '../common';
import {
  getAssignmentEmployeesPaged,
  exportAssignmentEmployeesExcel,
  patchAssignmentEvaluationWindows,
} from '../../services/assignReviewFormService';
import performanceService from '../../services/performanceService';
import EditEvaluationDatesModal from './EditEvaluationDatesModal';
import {
  formatBulkAssignmentPublishSummary,
  formatDate,
  getApiErrorMessage,
  isAssignmentResultsPublishedToEmployee,
  readBulkAssignmentPublishResult,
} from '../../utils/helpers';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';

const parseFilenameFromContentDisposition = (contentDisposition) => {
  const raw = String(contentDisposition || '');
  if (!raw) return '';

  // RFC 5987: filename*=UTF-8''...
  const star = raw.match(/filename\*\s*=\s*(?:UTF-8'')?([^;]+)/i);
  if (star?.[1]) {
    const v = String(star[1]).trim().replace(/^"(.*)"$/, '$1');
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  }

  const normal = raw.match(/filename\s*=\s*("?)([^";]+)\1/i);
  if (normal?.[2]) return String(normal[2]).trim();
  return '';
};

const triggerBrowserDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'assigned-employees.xlsx';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

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

const readRow = (row) => ({
  id: row?.id ?? row?.Id,
  selfEvalStatus: row?.selfEvalStatus ?? row?.SelfEvalStatus,
  managerEvalStatus: row?.managerEvalStatus ?? row?.ManagerEvalStatus,
  hrReviewStatus: row?.hrReviewStatus ?? row?.HrReviewStatus,
  publishedStatus: row?.publishedStatus ?? row?.PublishedStatus,
  publishedDate: row?.publishedDate ?? row?.PublishedDate,
  selfEvalStart: row?.selfEvalStart ?? row?.SelfEvalStart,
  selfEvalEnd: row?.selfEvalEnd ?? row?.SelfEvalEnd,
  managerEvalStart: row?.managerEvalStart ?? row?.ManagerEvalStart,
  managerEvalEnd: row?.managerEvalEnd ?? row?.ManagerEvalEnd,
  hrReviewStart: row?.hrReviewStart ?? row?.HrReviewStart,
  hrReviewEnd: row?.hrReviewEnd ?? row?.HrReviewEnd,
  selfOverallScore: row?.selfOverallScore ?? row?.SelfOverallScore,
  managerOverallScore: row?.managerOverallScore ?? row?.ManagerOverallScore,
  hrOverallScore: row?.hrOverallScore ?? row?.HrOverallScore,
  overallRating: row?.overallRating ?? row?.OverallRating,
  employee: row?.employee ?? row?.Employee ?? null,
});

const readEmployee = (emp) => {
  if (!emp) return null;
  const first = emp.firstName ?? emp.FirstName ?? '';
  const last = emp.lastName ?? emp.LastName ?? '';
  const name = `${first} ${last}`.trim();
  return {
    name: name || (emp.email ?? emp.Email ?? ''),
    employeeId: emp.employeeId ?? emp.EmployeeId ?? '',
    department: emp.department ?? emp.Department ?? '',
  };
};

const formatOverallScore = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
};

/** MUI Chip `color` for appraisal phase / publish status. */
const phaseStatusChipColor = (status) => {
  const s = String(status ?? '')
    .trim()
    .toLowerCase();
  if (!s) return 'default';
  if (['completed', 'complete', 'submitted', 'published', 'active'].includes(s)) return 'success';
  if (['in progress', 'inprogress', 'in_review', 'in review'].includes(s)) return 'info';
  if (['pending', 'draft', 'draft saved', 'skipped'].includes(s)) return 'warning';
  if (['not started', 'notstarted', 'unpublished', 'withdrawn'].includes(s) || s.startsWith('unpublish')) {
    return 'default';
  }
  return 'default';
};

const PhaseStatusChip = ({ status, score }) => {
  const labelText = String(status ?? '').trim() || '-';
  const scoreText = isPhaseFinal(status) ? formatOverallScore(score) : null;
  const label = scoreText != null ? `${labelText} · ${scoreText}` : labelText;
  return (
    <Chip
      label={label}
      size="small"
      variant="filled"
      color={phaseStatusChipColor(status)}
      sx={{ fontSize: 11, height: 24, maxWidth: '100%', '& .MuiChip-label': { px: 1 } }}
    />
  );
};

const PublishedStatusChip = ({ status }) => {
  const label = String(status ?? '').trim() || '-';
  const published = isAssignmentResultsPublishedToEmployee(status);
  return (
    <Chip
      label={label}
      size="small"
      variant="filled"
      color={published ? 'success' : 'default'}
      sx={{ fontSize: 11, height: 24 }}
    />
  );
};

const isPhaseFinal = (status) =>
  ['submitted', 'complete', 'completed'].includes(String(status ?? '').trim().toLowerCase());

/** Bulk publish/unpublish selection only when self, manager, and HR phases are completed. */
const allThreeEvaluationsComplete = (row) =>
  !!row &&
  isPhaseFinal(row.selfEvalStatus) &&
  isPhaseFinal(row.managerEvalStatus) &&
  isPhaseFinal(row.hrReviewStatus);

const AssignedReviewFormEmployees = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const financialYearId = searchParams.get('financialYearId') || '';
  const financialYear = searchParams.get('financialYear') || '';
  const reviewFormId = searchParams.get('reviewFormId') || '';
  const reviewFormName = searchParams.get('reviewFormName') || '';

  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selected, setSelected] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkUnpublishOpen, setBulkUnpublishOpen] = useState(false);
  /** `{ id, mode }` while a publish/unpublish request runs for one row */
  const [rowBusy, setRowBusy] = useState(() => ({ id: '', mode: '' }));
  const [bulkSnack, setBulkSnack] = useState(null);
  /** When set, show confirm before unpublishing one assignment */
  const [singleUnpublishId, setSingleUnpublishId] = useState(null);

  const [editDatesOpen, setEditDatesOpen] = useState(false);
  const [editDatesRow, setEditDatesRow] = useState(null);
  const [editDatesSaving, setEditDatesSaving] = useState(false);
  const [editDatesError, setEditDatesError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, financialYearId, reviewFormId]);

  useEffect(() => {
    setSelected(new Set());
  }, [page, debouncedSearch, financialYearId, reviewFormId]);

  const fetchPage = useCallback(async () => {
    if (!financialYearId || !reviewFormId) {
      setLoading(false);
      setRows([]);
      setTotalCount(0);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const raw = await getAssignmentEmployeesPaged({
        financialYearId,
        reviewFormId,
        page: page + 1,
        pageSize: rowsPerPage,
        search: debouncedSearch || undefined,
      });
      if (raw && raw.success === false) {
        setRows([]);
        setTotalCount(0);
        setError(raw.message || 'Could not load employees.');
        return;
      }
      const p = readPaged(raw);
      setRows((p.data || []).map(readRow));
      setTotalCount(p.totalCount);
    } catch (e) {
      setRows([]);
      setTotalCount(0);
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, financialYearId, reviewFormId, debouncedSearch]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const subtitle = useMemo(() => {
    if (!financialYearId || !reviewFormId) {
      return 'Missing review period or review form in the URL.';
    }
    if (reviewFormName) {
      return `${reviewFormName} · ${financialYear}`;
    }
    return financialYear;
  }, [financialYearId, financialYear, reviewFormId, reviewFormName]);

  const handleChangePage = (_e, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const missingParams = !financialYearId || !reviewFormId;

  const runExport = async () => {
    if (missingParams || exporting) return;
    setExporting(true);
    try {
      const res = await exportAssignmentEmployeesExcel({
        financialYearId,
        reviewFormId,
        search: debouncedSearch || undefined,
      });
      const headers = res?.headers || {};
      const cd = headers['content-disposition'] || headers['Content-Disposition'];
      const filename = parseFilenameFromContentDisposition(cd) || 'assigned-employees.xlsx';
      triggerBrowserDownload(res?.data, filename);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 413) {
        setBulkSnack({
          severity: 'warning',
          message: 'Too many rows to export. Please narrow filters and try again.',
        });
      } else {
        setBulkSnack({ severity: 'error', message: 'Export failed. Please try again.' });
      }
    } finally {
      setExporting(false);
    }
  };

  const bulkSelectableIdsOnPage = useMemo(
    () => rows.filter((r) => r?.id && allThreeEvaluationsComplete(r)).map((r) => r.id),
    [rows]
  );

  useEffect(() => {
    const eligible = new Set(bulkSelectableIdsOnPage);
    setSelected((prev) => {
      let changed = false;
      const next = new Set();
      prev.forEach((id) => {
        if (eligible.has(id)) next.add(id);
        else changed = true;
      });
      return changed || next.size !== prev.size ? next : prev;
    });
  }, [bulkSelectableIdsOnPage]);

  const allPageSelected =
    bulkSelectableIdsOnPage.length > 0 && bulkSelectableIdsOnPage.every((id) => selected.has(id));

  const toggleRowSelected = (id, row) => {
    if (!id || !allThreeEvaluationsComplete(row)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllOnPage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        bulkSelectableIdsOnPage.forEach((id) => next.delete(id));
      } else {
        bulkSelectableIdsOnPage.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const bulkIds = () => [...selected];

  const runBulkPublish = async () => {
    const ids = bulkIds();
    if (!ids.length) return;
    setBulkBusy(true);
    try {
      const raw = await performanceService.publishAssignmentsBulk(ids);
      const r = readBulkAssignmentPublishResult(raw);
      const severity = r.failedCount > 0 || r.rowErrors.length ? 'warning' : 'success';
      setBulkSnack({
        severity,
        message: formatBulkAssignmentPublishSummary('publish', raw),
      });
      await fetchPage();
      setSelected(new Set());
    } catch (e) {
      setBulkSnack({ severity: 'error', message: getApiErrorMessage(e) });
    } finally {
      setBulkBusy(false);
    }
  };

  const runBulkUnpublish = async () => {
    setBulkUnpublishOpen(false);
    const ids = bulkIds();
    if (!ids.length) return;
    setBulkBusy(true);
    try {
      const raw = await performanceService.unpublishAssignmentsBulk(ids);
      const r = readBulkAssignmentPublishResult(raw);
      const severity = r.failedCount > 0 || r.rowErrors.length ? 'warning' : 'success';
      setBulkSnack({
        severity,
        message: formatBulkAssignmentPublishSummary('unpublish', raw),
      });
      await fetchPage();
      setSelected(new Set());
    } catch (e) {
      setBulkSnack({ severity: 'error', message: getApiErrorMessage(e) });
    } finally {
      setBulkBusy(false);
    }
  };

  const runRowPublish = async (id) => {
    if (!id) return;
    const sid = String(id);
    setRowBusy({ id: sid, mode: 'publish' });
    try {
      await performanceService.publishRatings(id);
      setBulkSnack({
        severity: 'success',
        message: 'Results published - visible to the employee.',
      });
      await fetchPage();
    } catch (e) {
      setBulkSnack({ severity: 'error', message: getApiErrorMessage(e) });
    } finally {
      setRowBusy({ id: '', mode: '' });
    }
  };

  const runRowUnpublish = async (id) => {
    if (!id) return;
    const sid = String(id);
    setRowBusy({ id: sid, mode: 'unpublish' });
    try {
      await performanceService.unpublishAssignmentResults(id);
      setBulkSnack({
        severity: 'success',
        message: 'Results unpublished - employee will no longer see this result.',
      });
      await fetchPage();
    } catch (e) {
      setBulkSnack({ severity: 'error', message: getApiErrorMessage(e) });
    } finally {
      setRowBusy({ id: '', mode: '' });
    }
  };

  const openEditDates = (row, employeeName) => {
    if (!row?.id) return;
    setEditDatesError('');
    setEditDatesRow({ ...row, employeeName });
    setEditDatesOpen(true);
  };

  const closeEditDates = () => {
    if (editDatesSaving) return;
    setEditDatesOpen(false);
    setEditDatesRow(null);
    setEditDatesError('');
  };

  const saveEditDates = async (payload) => {
    const assignmentId = editDatesRow?.id;
    if (!assignmentId) return;
    setEditDatesSaving(true);
    setEditDatesError('');
    try {
      await patchAssignmentEvaluationWindows(String(assignmentId), payload);
      setBulkSnack({ severity: 'success', message: 'Evaluation dates updated.' });
      setEditDatesOpen(false);
      setEditDatesRow(null);
      await fetchPage();
    } catch (e) {
      const status = e?.response?.status;
      if (status === 404) {
        setBulkSnack({ severity: 'warning', message: 'Assignment not found. Refreshing list…' });
        setEditDatesOpen(false);
        setEditDatesRow(null);
        await fetchPage();
        return;
      }
      if (status === 409) {
        setEditDatesError(
          e?.response?.data?.message || 'This assignment is Published and evaluation dates cannot be edited.'
        );
        return;
      }
      if (status === 400) {
        setEditDatesError(e?.response?.data?.message || getApiErrorMessage(e));
        return;
      }
      setEditDatesError(getApiErrorMessage(e));
    } finally {
      setEditDatesSaving(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Assigned employees"
        subtitle={subtitle}
        actions={
          <AppButton variant="outlined" onClick={() => navigate('/operations/performance/assignments')}>
            Back to summary
          </AppButton>
        }
      />

      {missingParams && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Open this page from the assignments list using &quot;View employees&quot;, or add{' '}
          <code>financialYearId</code> and <code>reviewFormId</code> to the query string.
        </Alert>
      )}

      {!missingParams && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          alignItems={{ sm: 'center' }}
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <TextField
            size="small"
            fullWidth
            sx={{ maxWidth: 400 }}
            label="Search employees"
            placeholder="Name, email, or employee id…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <AppButton
            variant="outlined"
            onClick={runExport}
            loading={exporting}
            disabled={exporting}
            startIcon={<FileDownloadOutlinedIcon />}
          >
            Export to Excel
          </AppButton>
        </Stack>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {missingParams ? null : loading && !rows.length ? (
        <AppLoader />
      ) : (
        <AppCard sx={{ overflow: 'hidden', p: 0 }}>
          {selected.size > 0 ? (
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems={{ sm: 'center' }}
              sx={{
                px: 2,
                py: 1.5,
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: 'action.hover',
              }}
            >
              <Typography variant="body2" fontWeight={600}>
                {selected.size} selected
              </Typography>
              <AppButton size="small" onClick={runBulkPublish} loading={bulkBusy} disabled={bulkBusy}>
                Publish results
              </AppButton>
              <AppButton
                size="small"
                variant="outlined"
                color="warning"
                onClick={() => setBulkUnpublishOpen(true)}
                disabled={bulkBusy}
              >
                Unpublish
              </AppButton>
              <AppButton size="small" variant="text" onClick={() => setSelected(new Set())}>
                Clear selection
              </AppButton>
            </Stack>
          ) : null}
          <TableContainer sx={{ maxWidth: '100%' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      indeterminate={
                        selected.size > 0 &&
                        !(allPageSelected && bulkSelectableIdsOnPage.length > 0)
                      }
                      checked={allPageSelected && bulkSelectableIdsOnPage.length > 0}
                      onChange={toggleSelectAllOnPage}
                      disabled={!bulkSelectableIdsOnPage.length}
                      inputProps={{ 'aria-label': 'Select all eligible on this page' }}
                    />
                  </TableCell>
                  <TableCell>Employee</TableCell>
                  <TableCell>Self window</TableCell>
                  <TableCell>Manager window</TableCell>
                  <TableCell>HR window</TableCell>
                  <TableCell>Self</TableCell>
                  <TableCell>Manager</TableCell>
                  <TableCell>HR</TableCell>
                  <TableCell>Overall rating</TableCell>
                  <TableCell align="right">Actions</TableCell>
                  <TableCell>Published</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!missingParams && rows.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={14}>
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        No employees match the current search.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => {
                    const emp = readEmployee(r.employee);
                    const employeeName = emp?.name || '-';
                    const rowPublished = isAssignmentResultsPublishedToEmployee(r.publishedStatus);
                    const hrDone = isPhaseFinal(r.hrReviewStatus);
                    const canBulkSelect = Boolean(r.id && allThreeEvaluationsComplete(r));
                    const sid = r.id ? String(r.id) : '';
                    const rowBusyHere = sid && rowBusy.id === sid;
                    return (
                      <TableRow key={r.id || `${emp?.employeeId}-${r.selfEvalStatus}`} hover>
                        <TableCell padding="checkbox">
                          <Tooltip
                            title={
                              canBulkSelect
                                ? 'Select for bulk publish or unpublish'
                                : 'Bulk actions require Self, Manager, and HR evaluations to be completed'
                            }
                          >
                            <span>
                              <Checkbox
                                size="small"
                                checked={r.id ? selected.has(r.id) : false}
                                onChange={() => toggleRowSelected(r.id, r)}
                                disabled={!canBulkSelect}
                                inputProps={{
                                  'aria-label': `Select ${emp?.name || 'employee'} for bulk publish`,
                                }}
                              />
                            </span>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {employeeName}
                          </Typography>
                          {emp?.department ? (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {emp.department}
                            </Typography>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" display="block" sx={{ lineHeight: 1.2 }}>
                            {formatDate(r.selfEvalStart, 'DD/MM/YYYY HH:mm')}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                            {formatDate(r.selfEvalEnd, 'DD/MM/YYYY HH:mm')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" display="block" sx={{ lineHeight: 1.2 }}>
                            {formatDate(r.managerEvalStart, 'DD/MM/YYYY HH:mm')}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                            {formatDate(r.managerEvalEnd, 'DD/MM/YYYY HH:mm')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" display="block" sx={{ lineHeight: 1.2 }}>
                            {formatDate(r.hrReviewStart, 'DD/MM/YYYY HH:mm')}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                            {formatDate(r.hrReviewEnd, 'DD/MM/YYYY HH:mm')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <PhaseStatusChip status={r.selfEvalStatus} score={r.selfOverallScore} />
                        </TableCell>
                        <TableCell>
                          <PhaseStatusChip status={r.managerEvalStatus} score={r.managerOverallScore} />
                        </TableCell>
                        <TableCell>
                          <PhaseStatusChip status={r.hrReviewStatus} score={r.hrOverallScore} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>
                            {formatOverallScore(r.overallRating) ?? '-'}
                          </Typography>
                        </TableCell>
                       
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
                            <Tooltip
                              title="Edit evaluation dates"
                            >
                              <span>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  aria-label="Edit evaluation dates"
                                  disabled={!r.id}
                                  onClick={() => openEditDates(r, employeeName)}
                                >
                                  <EditCalendarOutlinedIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title={hrDone ? 'View HR' : 'Open HR'}>
                              <span>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  aria-label={hrDone ? 'View HR' : 'Open HR'}
                                  disabled={!r.id}
                                  onClick={() =>
                                    navigate(
                                      `/performance/review/${encodeURIComponent(String(r.id))}?mode=hr`
                                    )
                                  }
                                >
                                  <VisibilityOutlinedIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            {hrDone && rowPublished ? (
                              <Tooltip title="Unpublish - employee will no longer see this result">
                                <span>
                                  <IconButton
                                    size="small"
                                    color="warning"
                                    aria-label="Unpublish results"
                                    disabled={!r.id || rowBusyHere}
                                    onClick={() => {
                                      if (sid) setSingleUnpublishId(sid);
                                    }}
                                  >
                                    {rowBusyHere && rowBusy.mode === 'unpublish' ? (
                                      <CircularProgress color="inherit" size={18} thickness={5} />
                                    ) : (
                                      <CloudOffOutlinedIcon fontSize="small" />
                                    )}
                                  </IconButton>
                                </span>
                              </Tooltip>
                            ) :  (
                              <Tooltip
                                title={
                                  hrDone
                                    ? 'Publish results - visible to employee'
                                    : 'Complete HR review before publishing'
                                }
                              >
                                <span>
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    aria-label={
                                      hrDone ? 'Publish results' : 'Publish results (complete HR review first)'
                                    }
                                    disabled={!r.id || rowBusyHere || !hrDone}
                                    onClick={() => runRowPublish(r.id)}
                                  >
                                    {rowBusyHere && rowBusy.mode === 'publish' ? (
                                      <CircularProgress color="inherit" size={18} thickness={5} />
                                    ) : (
                                      <CloudUploadOutlinedIcon fontSize="small" />
                                    )}
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <PublishedStatusChip status={r.publishedStatus} />
                          {r.publishedDate ? (
                            <Typography variant="caption" display="block" color="text.secondary">
                              {formatDate(r.publishedDate)}
                            </Typography>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {!missingParams && (
            <TablePagination
              component="div"
              rowsPerPageOptions={[10, 20, 50]}
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          )}
        </AppCard>
      )}

      {!missingParams && loading && rows.length > 0 ? (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Updating…
        </Typography>
      ) : null}

      <Dialog
        open={bulkUnpublishOpen}
        onClose={() => !bulkBusy && setBulkUnpublishOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Unpublish selected?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Employees will no longer see these results in Published reviews ({selected.size} assignment
            {selected.size === 1 ? '' : 's'}). You can publish again later.
          </Typography>
        </DialogContent>
        <DialogActions>
          <AppButton variant="outlined" startIcon={null} onClick={() => setBulkUnpublishOpen(false)} disabled={bulkBusy}>
            Cancel
          </AppButton>
          <AppButton color="warning" startIcon={null} onClick={runBulkUnpublish} loading={bulkBusy}>
            Unpublish
          </AppButton>
        </DialogActions>
      </Dialog>

      <Dialog open={singleUnpublishId != null} onClose={() => setSingleUnpublishId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Unpublish results?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            The employee will no longer see this result in Published reviews. You can publish again later.
          </Typography>
        </DialogContent>
        <DialogActions>
          <AppButton variant="outlined" startIcon={null} onClick={() => setSingleUnpublishId(null)}>
            Cancel
          </AppButton>
          <AppButton
            color="warning"
            startIcon={null}
            onClick={() => {
              const id = singleUnpublishId;
              setSingleUnpublishId(null);
              if (id) void runRowUnpublish(id);
            }}
          >
            Unpublish
          </AppButton>
        </DialogActions>
      </Dialog>

      <AppSnackbar
        open={!!bulkSnack}
        onClose={() => setBulkSnack(null)}
        severity={bulkSnack?.severity || 'info'}
        autoHideDuration={bulkSnack?.message?.includes('\n') ? 12000 : 6000}
        message={
          <Typography component="div" sx={{ whiteSpace: 'pre-wrap', fontSize: 'inherit' }}>
            {bulkSnack?.message}
          </Typography>
        }
      />

      <EditEvaluationDatesModal
        open={editDatesOpen}
        row={editDatesRow}
        saving={editDatesSaving}
        error={editDatesError}
        onClose={closeEditDates}
        onSave={saveEditDates}
        clearError={() => setEditDatesError('')}
      />
    </Box>
  );
};

export default AssignedReviewFormEmployees;
