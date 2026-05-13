// src/pages/employee/EmployeePerformance.jsx
// Employee: Performance dashboard with 3 tabs:
//   - Pending Reviews (self-evaluation cards)
//   - Submitted Reviews
//   - Others' Reviews (managed assignments - GET /performance/managed-assignments)

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  CardActions,
  LinearProgress,
  Chip,
  Stack,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  TextField,
  TablePagination,
  useTheme,
  useMediaQuery,
  Avatar,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  IconButton,
  CircularProgress,
  FormHelperText,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import usePerformance from '../../hooks/usePerformance';
import usePerformanceApi from '../../hooks/usePerformanceApi';
import useAuth from '../../hooks/useAuth';
import AppButton from '../../components/common/AppButton';
import { AppLoader, AppSnackbar, EmptyState, StatusChip } from '../../components/common';
import AppCard from '../../components/common/AppCard';
import TableDotStatus from '../../components/common/TableDotStatus';
import { mainLayoutStickySubheaderBandSx } from '../../components/common/PageHeader';
import { modernTableSx } from '../../utils/floatingPanelSx';
import {
  getDaysRemaining,
  getDeadlineColor,
  formatDate,
  isAssignmentPhaseSubmitted,
  isAssignmentResultsPublishedToEmployee,
  getApiErrorMessage,
  parseRatingScaleMax,
  parseFilenameFromContentDisposition,
  downloadBlobAsFile,
} from '../../utils/helpers';
import useFinancialYears from '../../hooks/useFinancialYears';
import SubmitConfirmationDialog from './self-evaluation/SubmitConfirmationDialog';
import PublishResultsConfirmDialog from '../operations/PublishResultsConfirmDialog';
import { validateHrSubmitInput } from '../../utils/performanceSubmission';

/** Single action for "Others' Reviews": manager phase first, then HR for admins when manager is done. */
const othersManagedReviewAction = (
  emp: { selfEvalStatus?: string; managerReviewStatus?: string; hrReviewStatus?: string; reviewId?: string; id?: string },
  isAdmin: boolean
) => {
  const selfOk = emp.selfEvalStatus === 'Submitted';
  const managerDone = isAssignmentPhaseSubmitted(emp.managerReviewStatus);
  const hrDone = isAssignmentPhaseSubmitted(emp.hrReviewStatus);
  const hasReview = Boolean(emp.reviewId);

  if (!hasReview) return { disabled: true as const, label: '-' as const, path: null as string | null };
  if (!selfOk) return { disabled: true as const, label: 'Awaiting self-eval' as const, path: null };
  if (!managerDone) {
    return {
      disabled: false as const,
      label: 'Open review' as const,
      path: `/performance/review/${emp.reviewId}?mode=manager&employeeId=${emp.id}`,
    };
  }
  if (isAdmin && !hrDone) {
    return {
      disabled: false as const,
      label: 'Open review' as const,
      path: `/performance/review/${emp.reviewId}?mode=hr&employeeId=${emp.id}`,
    };
  }
  const viewPath = isAdmin
    ? `/performance/review/${emp.reviewId}?mode=hr&employeeId=${emp.id}`
    : `/performance/review/${emp.reviewId}?mode=manager&employeeId=${emp.id}`;
  return { disabled: false as const, label: 'View' as const, path: viewPath };
};

/** Self, manager, and HR phases finalized — required before publishing results to the employee. */
const othersRowAllReviewsComplete = (emp: {
  selfEvalStatus?: string;
  managerReviewStatus?: string;
  hrReviewStatus?: string;
}) =>
  isAssignmentPhaseSubmitted(emp.selfEvalStatus) &&
  isAssignmentPhaseSubmitted(emp.managerReviewStatus) &&
  isAssignmentPhaseSubmitted(emp.hrReviewStatus);

/** Admins can record HR overall rating here when manager review is done and HR is still pending. */
const othersRowHrRatingEditable = (
  emp: { selfEvalStatus?: string; managerReviewStatus?: string; hrReviewStatus?: string; reviewId?: string },
  isAdmin: boolean
) => {
  if (!isAdmin || emp.reviewId == null || String(emp.reviewId).trim() === '') return false;
  if (!isAssignmentPhaseSubmitted(emp.selfEvalStatus)) return false;
  if (!isAssignmentPhaseSubmitted(emp.managerReviewStatus)) return false;
  if (isAssignmentPhaseSubmitted(emp.hrReviewStatus)) return false;
  return true;
};

const managedScoreLabel = (value: number | null | undefined): string | null => {
  if (value == null) return null;
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
};

/** Compact green rating pill; renders nothing when score is absent. */
const ManagedRatingChip = ({ score }: { score?: number | null }) => {
  const theme = useTheme();
  const label = managedScoreLabel(score);
  if (!label) return null;
  const green = theme.palette.success.main;
  return (
    <Chip
      label={
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.35 }}>
          {label}
          <StarRoundedIcon sx={{ fontSize: '0.7rem', color: 'inherit', flexShrink: 0 }} />
        </Box>
      }
      size="small"
      sx={{
        height: 19,
        minWidth: 32,
        fontWeight: 700,
        fontSize: '0.6875rem',
        lineHeight: 1,
        bgcolor: alpha(green, 0.14),
        color: theme.palette.success.dark,
        border: `1px solid ${alpha(green, 0.32)}`,
        boxShadow: 'none',
        '& .MuiChip-label': { px: 0.65, py: 0, lineHeight: 1.15 },
      }}
    />
  );
};

/** Status row and score sit on one horizontal line (parallel), email below. */
const ManagedPhaseStatusWithScore = ({
  statusLabel,
  score,
  subline,
}: {
  statusLabel: string;
  score?: number | null;
  subline?: ReactNode;
}) => (
  <Stack spacing={0.5} alignItems="flex-start">
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 0.75,
        flexWrap: 'nowrap',
      }}
    >
      <TableDotStatus label={statusLabel} />
      <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        <ManagedRatingChip score={score} />
      </Box>
    </Box>
    {subline}
  </Stack>
);

// ── Review Card ───────────────────────────────────────────────────────────────
const ReviewCard = ({ review, onStart }) => {
  const daysLeft = getDaysRemaining(review.endDate);
  const hasDeadline = daysLeft != null;
  const deadlineColor = getDeadlineColor(review.endDate);
  const isOverdue = hasDeadline && daysLeft < 0;

  return (
    <Card
      elevation={0}
      sx={{
        borderColor: isOverdue ? 'error.light' : 'divider',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.2s, background-color 0.2s',
        '&:hover': { borderColor: 'primary.light', bgcolor: 'grey.50' },
      }}
    >
      <CardContent sx={{ flex: 1 }}>
        {/* Form name + status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={700} flex={1} pr={1}>
            {review.formName}
          </Typography>
          <StatusChip status={review.status} />
        </Box>

        {/* Period */}
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          {formatDate(review.startDate)} - {formatDate(review.endDate)}
        </Typography>

        {/* Progress bar */}
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">Completion</Typography>
            <Typography variant="caption" fontWeight={600}>{review.completionPct || 0}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={review.completionPct || 0}
            sx={{ borderRadius: 1, height: 7, backgroundColor: 'grey.100' }}
            color={review.completionPct === 100 ? 'success' : 'primary'}
          />
        </Box>

        {/* Days remaining */}
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <AccessTimeIcon fontSize="small" color={isOverdue ? 'error' as const : deadlineColor as any} />
          <Typography
            variant="caption"
            color={isOverdue ? 'error' : hasDeadline ? `${deadlineColor}.main` : 'text.secondary'}
            fontWeight={500}
          >
            {!hasDeadline
              ? 'No deadline'
              : isOverdue
                ? `Overdue by ${Math.abs(daysLeft)} days`
                : daysLeft === 0
                  ? 'Due today'
                  : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`}
          </Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <AppButton
          startIcon={null}
          fullWidth
          variant="contained"
          color={review.status === 'Not Started' ? 'primary' : 'success'}
          onClick={() => onStart(review.id)}
          disabled={isOverdue && review.status === 'Not Started'}
        >
          {review.status === 'Not Started' ? 'Start Review' : 'Continue Review'}
        </AppButton>
      </CardActions>
    </Card>
  );
};

const EmployeePerformance = () => {
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const {
    myReviews,
    managerTeam,
    managerTeamTotalCount,
    myReviewsLoading,
    managerTeamLoading,
    reviewForms,
    error,
    successMessage,
    clearSuccess,
    loadMyReviews,
    loadManagerTeam,
    loadReviewForms,
    submitHrEval,
    clearError,
  } = usePerformance();
  const { financialYears, activeFinancialYear, financialYearsLoading } = useFinancialYears();
  const { isAdmin, isHr, user } = useAuth();
  const { publishRatings, unpublishAssignmentResults, exportManagedAssignmentsExcel } =
    usePerformanceApi();

  const hasMyReviews =
    (Array.isArray(myReviews?.pending) && myReviews.pending.length > 0) ||
    (Array.isArray(myReviews?.submitted) && myReviews.submitted.length > 0);

  const [tab, setTab] = useState(0);
  const [financialYearId, setFinancialYearId] = useState('');
  const [othersPage, setOthersPage] = useState(0);
  const [othersRowsPerPage, setOthersRowsPerPage] = useState(20);
  const [othersSearchInput, setOthersSearchInput] = useState('');
  const [debouncedOthersSearch, setDebouncedOthersSearch] = useState('');
  const [othersReviewFormId, setOthersReviewFormId] = useState('');
  const [othersPublishSnack, setOthersPublishSnack] = useState<{
    severity: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);
  /** `{ id, mode }` while publish/unpublish runs for one managed-assignment row */
  const [rowPublishBusy, setRowPublishBusy] = useState<{ id: string; mode: 'publish' | 'unpublish' } | null>(
    null
  );
  const [singleUnpublishAssignmentId, setSingleUnpublishAssignmentId] = useState<string | null>(null);
  /** When set, confirm before publishing one managed assignment (Others' Reviews tab). */
  const [singlePublishAssignmentId, setSinglePublishAssignmentId] = useState<string | null>(null);
  /** Inline HR overall rating (Others' Reviews tab, admin, HR pending). */
  const [hrQuickInline, setHrQuickInline] = useState<{
    assignmentId: string;
    draft: string;
    scale: number;
  } | null>(null);
  const [hrQuickInlineError, setHrQuickInlineError] = useState<string | null>(null);
  const [hrQuickConfirm, setHrQuickConfirm] = useState<{
    assignmentId: string;
    rating: number;
    caption: string;
  } | null>(null);
  const [hrQuickSubmitting, setHrQuickSubmitting] = useState(false);
  const [othersExporting, setOthersExporting] = useState(false);

  const resolveRatingScaleForManagedRow = useCallback(
    (emp: { formName?: string; appraisalRatingScale?: number | null }) => {
      const fromAssignment = parseRatingScaleMax(emp?.appraisalRatingScale);
      if (fromAssignment) return fromAssignment;
      if (othersReviewFormId) {
        const f = reviewForms.find((x) => String(x?.id ?? x?._id ?? '') === String(othersReviewFormId));
        const s = parseRatingScaleMax(f?.ratingScale ?? f?.RatingScale ?? f?.scale ?? f?.maxRating);
        if (s) return s;
      }
      const nameKey = String(emp.formName ?? '').trim().toLowerCase();
      const matchName = reviewForms.find(
        (x) => String(x?.name ?? x?.Name ?? '').trim().toLowerCase() === nameKey
      );
      const s2 = parseRatingScaleMax(
        matchName?.ratingScale ?? matchName?.RatingScale ?? matchName?.scale ?? matchName?.maxRating
      );
      return s2 ?? 5;
    },
    [reviewForms, othersReviewFormId]
  );

  useEffect(() => {
    if (tab !== 2) {
      setHrQuickInline(null);
      setHrQuickConfirm(null);
      setHrQuickInlineError(null);
    }
  }, [tab]);

  const refetchManagedAssignments = useCallback(() => {
    if (!financialYearId) return;
    loadManagerTeam({
      financialYearId,
      page: othersPage + 1,
      pageSize: othersRowsPerPage,
      search: debouncedOthersSearch,
      reviewFormId: othersReviewFormId || undefined,
    });
  }, [
    financialYearId,
    othersPage,
    othersRowsPerPage,
    debouncedOthersSearch,
    othersReviewFormId,
    loadManagerTeam,
  ]);

  const runOthersExport = async () => {
    if (!financialYearId || othersExporting) return;
    setOthersExporting(true);
    try {
      const res = await exportManagedAssignmentsExcel({
        financialYearId,
        search: debouncedOthersSearch,
        ...(othersReviewFormId != null && String(othersReviewFormId).trim() !== ''
          ? { reviewFormId: othersReviewFormId }
          : {}),
      });
      const headers = res?.headers || {};
      const cd = headers['content-disposition'] || headers['Content-Disposition'];
      const filename =
        parseFilenameFromContentDisposition(cd) || 'managed-assignments.xlsx';
      downloadBlobAsFile(res?.data, filename);
    } catch (e) {
      const status = e?.status;
      if (status === 413) {
        setOthersPublishSnack({
          severity: 'warning',
          message: 'Too many rows to export. Narrow filters and try again.',
        });
      } else {
        setOthersPublishSnack({ severity: 'error', message: getApiErrorMessage(e) });
      }
    } finally {
      setOthersExporting(false);
    }
  };

  /** Avoid empty UI before FY list + default year are ready, then avoid empty → full-screen loader when fetch starts. */
  const fyBootstrapPending =
    financialYearsLoading || (financialYears.length > 0 && !financialYearId);
  const pageLoading =
    fyBootstrapPending || (Boolean(financialYearId) && myReviewsLoading && !hasMyReviews);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedOthersSearch(othersSearchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [othersSearchInput]);

  useEffect(() => {
    if (activeFinancialYear?.id && !financialYearId) {
      setFinancialYearId(activeFinancialYear.id);
    }
  }, [activeFinancialYear, financialYearId]);

  useEffect(() => {
    setOthersPage(0);
  }, [financialYearId, debouncedOthersSearch, othersReviewFormId]);

  useEffect(() => {
    if (tab === 2) {
      loadReviewForms();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (financialYearId) {
      loadMyReviews(financialYearId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [financialYearId]);

  useEffect(() => {
    if (financialYearId) {
      loadManagerTeam({
        financialYearId,
        page: othersPage + 1,
        pageSize: othersRowsPerPage,
        search: debouncedOthersSearch,
        reviewFormId: othersReviewFormId || undefined,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [financialYearId, othersPage, othersRowsPerPage, debouncedOthersSearch, othersReviewFormId]);

  const runOthersRowPublish = async (assignmentId: string) => {
    if (!assignmentId) return;
    const sid = String(assignmentId);
    setRowPublishBusy({ id: sid, mode: 'publish' });
    try {
      await publishRatings(sid);
      setOthersPublishSnack({
        severity: 'success',
        message: 'Results published - visible to the employee.',
      });
      refetchManagedAssignments();
    } catch (e) {
      setOthersPublishSnack({ severity: 'error', message: getApiErrorMessage(e) });
    } finally {
      setRowPublishBusy(null);
      setSinglePublishAssignmentId(null);
    }
  };

  const runOthersRowUnpublish = async (assignmentId: string) => {
    if (!assignmentId) return;
    const sid = String(assignmentId);
    setSingleUnpublishAssignmentId(null);
    setRowPublishBusy({ id: sid, mode: 'unpublish' });
    try {
      await unpublishAssignmentResults(sid);
      setOthersPublishSnack({
        severity: 'success',
        message: 'Results unpublished - employee will no longer see this result.',
      });
      refetchManagedAssignments();
    } catch (e) {
      setOthersPublishSnack({ severity: 'error', message: getApiErrorMessage(e) });
    } finally {
      setRowPublishBusy(null);
    }
  };

  const handleHrQuickConfirmSubmit = async () => {
    if (!hrQuickConfirm) return;
    clearError();
    setHrQuickSubmitting(true);
    try {
      /** `usePerformance` / thunk modules are `@ts-nocheck`; RTK `.unwrap()` is not visible to TS otherwise. */
      await (
        submitHrEval as unknown as (
          assignmentId: string,
          hrOverallRating: number,
          hrComments: string
        ) => { unwrap: () => Promise<unknown> }
      )(hrQuickConfirm.assignmentId, hrQuickConfirm.rating, '').unwrap();
      setHrQuickConfirm(null);
      setHrQuickInline(null);
      setHrQuickInlineError(null);
      refetchManagedAssignments();
    } catch (e) {
      setOthersPublishSnack({ severity: 'error', message: getApiErrorMessage(e) });
    } finally {
      setHrQuickSubmitting(false);
    }
  };

  if (pageLoading) return <AppLoader message="Loading your reviews..." />;

  const tabs = [
    { label: 'Pending Reviews', icon: <AssignmentIcon fontSize="small" />, count: myReviews.pending?.length || 0 },
    { label: 'Submitted Reviews', icon: <CheckCircleIcon fontSize="small" />, count: myReviews.submitted?.length || 0 },
    {
      label: "Others' Reviews",
      icon: <PeopleIcon fontSize="small" />,
      count: managerTeamTotalCount || 0,
    },
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      <AppCard
        variant="glass"
        sx={{
          ...mainLayoutStickySubheaderBandSx(theme),
          mx: 0,
          px: 2,
          py: 2,
          mb: 2.5,
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
        }}
      >
        <Box sx={{ mb: 2, position: 'relative', zIndex: 1 }}>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            My reviews
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            Manage your reviews and track evaluation progress
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 2,
            rowGap: 1.5,
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
          }}
        >
          {/* minWidth:0 + shrink so tab row is viewport-bound; MUI can detect overflow and show scroll controls */}
          <Box
            sx={{
              order: { xs: 2, sm: 1 },
              flex: { xs: '1 1 100%', sm: '0 1 auto' },
              width: { xs: '100%', sm: 'auto' },
              minWidth: 0,
              maxWidth: '100%',
              // Do not use overflow:hidden here — it clips MUI’s right TabScrollButton when the
              // strip is wider than the viewport; minWidth:0 + scroller minWidth below keeps layout correct.
            }}
          >
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="scrollable"
              scrollButtons={isSmDown ? true : 'auto'}
              allowScrollButtonsMobile
              sx={{
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
                minHeight: 36,
                display: 'flex',
                '& .MuiTabs-indicator': { display: 'none' },
                '& .MuiTabs-flexContainer': { gap: 0.75 },
                '& .MuiTabs-scrollButtons': {
                  width: { xs: 36, sm: 32 },
                  flexShrink: 0,
                  color: 'text.secondary',
                },
                '& .MuiTabs-scrollButtons.Mui-disabled': { opacity: 0.35 },
                '& .MuiTabScrollButton-root': {
                  bgcolor: { xs: 'rgba(255,255,255,0.72)', sm: 'transparent' },
                  borderRadius: 1,
                  border: { xs: '1px solid', sm: 'none' },
                  borderColor: { xs: 'divider', sm: 'transparent' },
                },
                '& .MuiTabs-scroller': {
                  minWidth: 0,
                  flexGrow: 1,
                  WebkitOverflowScrolling: 'touch',
                },
              }}
            >
              {tabs.map((t, i) => (
                <Tab
                  key={i}
                  label={
                    <Stack direction="row" alignItems="center" spacing={isSmDown ? 0.5 : 1}>
                      {t.icon}
                      <Box component="span" sx={{ whiteSpace: 'nowrap' }}>
                        {t.label}
                      </Box>
                      {t.count > 0 && (
                        <Chip
                          label={t.count}
                          size="small"
                          color="primary"
                          sx={{ height: 18, fontSize: 10, flexShrink: 0 }}
                        />
                      )}
                    </Stack>
                  }
                  disableRipple
                  sx={{
                    minHeight: 34,
                    px: { xs: 1, sm: 1.25 },
                    py: 0.5,
                    borderRadius: 999,
                    textTransform: 'none',
                    fontSize: { xs: '0.72rem', sm: '0.78rem' },
                    fontWeight: 600,
                    color: 'text.secondary',
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'rgba(255,255,255,0.65)',
                    backdropFilter: 'blur(10px)',
                    flexShrink: 0,
                    '& .MuiChip-root': { ml: 0.25 },
                    '&.Mui-selected': {
                      color: 'primary.dark',
                      borderColor: 'rgba(34,197,94,0.35)',
                      bgcolor: 'rgba(34,197,94,0.12)',
                      boxShadow: '0 10px 22px -18px rgba(34,197,94,0.55)',
                    },
                    '&:hover': { bgcolor: 'rgba(2,6,23,0.04)' },
                  }}
                />
              ))}
            </Tabs>
          </Box>
          <FormControl
            size="small"
            sx={{
              minWidth: 168,
              width: { xs: '100%', sm: 'auto' },
              order: { xs: 1, sm: 2 },
              flex: '0 0 auto',
              ml: { sm: 'auto' },
            }}
          >
            <InputLabel id="perf-fy-label">Review Period</InputLabel>
            <Select
              labelId="perf-fy-label"
              label="Review Period"
              value={financialYearId}
              onChange={(e) => setFinancialYearId(e.target.value)}
            >
              {financialYears.map((y) => (
                <MenuItem key={y.id} value={y.id}>{y.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </AppCard>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Tab 0: Pending Reviews */}
      {tab === 0 && (
        <Box>
          {(!myReviews.pending || myReviews.pending.length === 0) ? (
            <AppCard sx={{ p: 0 }}>
              <EmptyState
                variant="empty"
                title="All caught up!"
                message="No pending reviews for selected Review Period."
                minHeight={260}
              />
            </AppCard>
          ) : (
            <Grid container spacing={2.5}>
              {myReviews.pending.map((review) => (
                <Grid item xs={12} sm={6} md={4} key={review.id}>
                  <ReviewCard
                    review={review}
                    onStart={(id) => navigate(`/performance/review/${id}`)}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Tab 1: Submitted Reviews */}
      {tab === 1 && (
        <Box>
          {(!myReviews.submitted || myReviews.submitted.length === 0) ? (
            <AppCard sx={{ p: 0 }}>
              <EmptyState variant="noContent" message="No submitted reviews for selected Review Period." minHeight={260} />
            </AppCard>
          ) : (
            <AppCard variant="table">
              <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
                <Table
                  sx={{
                    ...modernTableSx,
                    '& th, & td': { whiteSpace: 'nowrap' },
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell>Review form</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Period</TableCell>
                      <TableCell>Self eval</TableCell>
                      <TableCell>Manager</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>HR</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {myReviews.submitted.map((r) => {
                      const assignmentId = r.assignmentId || r.id;
                      return (
                        <TableRow key={r.id} hover sx={{ '&:hover': { bgcolor: 'rgba(79,70,229,0.035)' } }}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>
                              {r.formName}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                            <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                              {formatDate(r.startDate)} - {formatDate(r.endDate)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <TableDotStatus label="Submitted" tone="positive" />
                          </TableCell>
                          <TableCell>
                            <Stack spacing={0.5} alignItems="flex-start">
                              <TableDotStatus label={r.managerStatus || 'Pending'} />
                              {r.managerEmail ? (
                                <Typography
                                  variant="body2"
                                  sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}
                                  noWrap
                                  title={r.managerEmail}
                                >
                                  {r.managerEmail}
                                </Typography>
                              ) : null}
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                            <TableDotStatus label={r.hrStatus || 'Pending'} />
                          </TableCell>
                          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                            <Tooltip title="View review">
                              <IconButton
                                size="small"
                                color="primary"
                                aria-label="View review"
                                onClick={() => navigate(`/performance/review/${assignmentId}`)}
                              >
                                <VisibilityOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </AppCard>
          )}
        </Box>
      )}

      {/* Tab 2: Others' Reviews - GET /performance/managed-assignments */}
      {tab === 2 && (
        <Box>
          <AppCard variant="table">
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 2,
                py: 2,
                px: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'rgba(248,250,252,0.92)',
              }}
            >
              <FormControl size="small" sx={{ minWidth: 200, flex: { xs: '1 1 100%', sm: '0 1 220px' } }}>
                <InputLabel id="others-form-filter">Review form</InputLabel>
                <Select
                  labelId="others-form-filter"
                  label="Review form"
                  value={othersReviewFormId}
                  onChange={(e) => setOthersReviewFormId(e.target.value)}
                >
                  <MenuItem value="">All forms</MenuItem>
                  {reviewForms.map((f) => (
                    <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                size="small"
                placeholder="Search…"
                value={othersSearchInput}
                onChange={(e) => setOthersSearchInput(e.target.value)}
                sx={{
                  flex: '0 1 auto',
                  width: { xs: '100%', sm: 200 },
                  minWidth: { sm: 180 },
                  maxWidth: { sm: 220 },
                  '& .MuiInputBase-root': { fontSize: '0.8125rem' },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
              {(isAdmin || isHr) && (
                <Box
                  sx={{
                    ml: { xs: 0, sm: 'auto' },
                    width: { xs: '100%', sm: 'auto' },
                    display: 'flex',
                    justifyContent: { xs: 'flex-end', sm: 'flex-start' },
                  }}
                >
                  <AppButton
                    variant="outlined"
                    size="small"
                    loading={othersExporting}
                    disabled={!financialYearId || othersExporting}
                    startIcon={<FileDownloadOutlinedIcon />}
                    onClick={runOthersExport}
                  >
                    Export to Excel
                  </AppButton>
                </Box>
              )}
            </Box>
            {managerTeamLoading ? <LinearProgress /> : null}
            {managerTeamLoading && (!managerTeam || managerTeam.length === 0) && (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <Typography color="text.secondary">Loading managed reviews…</Typography>
              </Box>
            )}
            {!managerTeamLoading && (!managerTeam || managerTeam.length === 0) && (
              <EmptyState variant="noContent" message="No managed reviews match the current filters." minHeight={260} />
            )}
            {managerTeam && managerTeam.length > 0 && (
              <>
                <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
                  <Table
                    sx={{
                      ...modernTableSx,
                      '& th, & td': { whiteSpace: 'nowrap' },
                    }}
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Review form</TableCell>
                        <TableCell>Self eval</TableCell>
                        <TableCell>Manager review</TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>HR review</TableCell>
                        <TableCell align="center">Overall rating</TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Published</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {managerTeam.map((emp) => {
                        const rowAction = othersManagedReviewAction(emp, isAdmin);
                        const assignmentIdStr = emp.reviewId != null ? String(emp.reviewId) : '';
                        const rowBusyHere =
                          assignmentIdStr !== '' &&
                          !!rowPublishBusy &&
                          rowPublishBusy.id === assignmentIdStr;
                        const rowPublished = isAssignmentResultsPublishedToEmployee(emp.publishedStatus);
                        const viewerEmailNorm = String(user?.email ?? '').trim().toLowerCase();
                        const managerEmailNorm = String(emp.managerEmail ?? '').trim().toLowerCase();
                        const highlightAsMyManagedAssignment =
                          (isAdmin || isHr) &&
                          Boolean(viewerEmailNorm) &&
                          Boolean(managerEmailNorm) &&
                          viewerEmailNorm === managerEmailNorm;
                        return (
                          <TableRow
                            key={`${emp.id}-${emp.reviewId}`}
                            hover
                            sx={{
                              ...(highlightAsMyManagedAssignment
                                ? {
                                    bgcolor: alpha(
                                      theme.palette.primary.main,
                                      theme.palette.mode === 'dark' ? 0.14 : 0.08
                                    ),
                                    boxShadow: `inset 3px 0 0 ${theme.palette.primary.main}`,
                                  }
                                : {}),
                              '&:hover': {
                                bgcolor: highlightAsMyManagedAssignment
                                  ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.12)
                                  : 'rgba(79,70,229,0.035)',
                              },
                            }}
                          >
                            <TableCell>
                              <Stack direction="row" spacing={1.5} alignItems="center">
                                <Avatar
                                  sx={{
                                    width: 40,
                                    height: 40,
                                    fontWeight: 800,
                                    fontSize: '0.9rem',
                                    background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                                  }}
                                >
                                  {emp.name?.[0] || '?'}
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography variant="body2" fontWeight={700} noWrap sx={{ color: 'text.primary' }}>
                                    {emp.name}
                                  </Typography>
                                  {emp.selfEmail ? (
                                    <Typography
                                      variant="body2"
                                      sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}
                                      noWrap
                                      title={emp.selfEmail}
                                    >
                                      {emp.selfEmail}
                                    </Typography>
                                  ) : null}
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                              <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: 'text.secondary', fontWeight: 500 }}>
                                {emp.formName}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <ManagedPhaseStatusWithScore
                                statusLabel={emp.selfEvalStatus}
                                score={emp.selfOverallScore ?? null}
                              />
                            </TableCell>
                            <TableCell>
                              <ManagedPhaseStatusWithScore
                                statusLabel={emp.managerReviewStatus || 'Pending'}
                                score={emp.managerOverallScore ?? null}
                                subline={
                                  emp.managerEmail ? (
                                    <Typography
                                      variant="body2"
                                      sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}
                                      noWrap
                                      title={emp.managerEmail}
                                    >
                                      {emp.managerEmail}
                                    </Typography>
                                  ) : undefined
                                }
                              />
                            </TableCell>
                            <TableCell
                              sx={{
                                display: { xs: 'none', sm: 'table-cell' },
                                ...(hrQuickInline?.assignmentId === assignmentIdStr
                                  ? {
                                      '&&': {
                                        whiteSpace: 'normal',
                                        verticalAlign: 'middle',
                                        minWidth: 220,
                                      },
                                    }
                                  : {}),
                              }}
                            >
                              {(() => {
                                const hrEditable = othersRowHrRatingEditable(emp, isAdmin);
                                const isEditing = hrQuickInline?.assignmentId === assignmentIdStr;
                                if (isEditing && hrQuickInline) {
                                  return (
                                    <Stack spacing={0.5} alignItems="flex-start" onClick={(e) => e.stopPropagation()}>
                                      <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
                                        <TextField
                                          size="small"
                                          value={hrQuickInline.draft}
                                          onChange={(e) => {
                                            setHrQuickInline((p) => (p ? { ...p, draft: e.target.value } : p));
                                            setHrQuickInlineError(null);
                                          }}
                                          placeholder={`0–${hrQuickInline.scale}`}
                                          type="text"
                                          inputProps={{
                                            inputMode: 'decimal',
                                            'aria-label': 'HR overall rating',
                                          }}
                                          InputProps={{
                                            sx: {
                                              py: 0.25,
                                              '& input': { fontSize: '0.8125rem', py: 0.5, width: 72 },
                                            },
                                          }}
                                          error={Boolean(hrQuickInlineError)}
                                        />
                                        <Tooltip title="Confirm (opens submission dialog)">
                                          <span>
                                            <IconButton
                                              size="small"
                                              color="primary"
                                              aria-label="Confirm HR rating"
                                              onClick={() => {
                                                const errs = validateHrSubmitInput(
                                                  { hrOverallRating: hrQuickInline.draft, hrComments: '' },
                                                  hrQuickInline.scale
                                                );
                                                const msg = errs.hrOverallRating || errs.hrComments || null;
                                                if (msg) {
                                                  setHrQuickInlineError(msg);
                                                  return;
                                                }
                                                const n = Number(hrQuickInline.draft);
                                                const rounded = Math.round(n * 10) / 10;
                                                setHrQuickConfirm({
                                                  assignmentId: hrQuickInline.assignmentId,
                                                  rating: n,
                                                  caption: `${rounded.toFixed(1)} / ${hrQuickInline.scale}`,
                                                });
                                              }}
                                            >
                                              <CheckIcon fontSize="small" />
                                            </IconButton>
                                          </span>
                                        </Tooltip>
                                        <Tooltip title="Cancel">
                                          <IconButton
                                            size="small"
                                            aria-label="Cancel HR rating edit"
                                            onClick={() => {
                                              setHrQuickInline(null);
                                              setHrQuickInlineError(null);
                                            }}
                                          >
                                            <CloseIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      </Stack>
                                      {hrQuickInlineError ? (
                                        <FormHelperText error sx={{ mx: 0 }}>
                                          {hrQuickInlineError}
                                        </FormHelperText>
                                      ) : null}
                                    </Stack>
                                  );
                                }
                                return (
                                  <Tooltip
                                    title={
                                      hrEditable
                                        ? 'Double-click to enter HR overall rating'
                                        : `${emp.hrReviewStatus || 'Pending'}`
                                    }
                                  >
                                    <Box
                                      onDoubleClick={(e) => {
                                        e.preventDefault();
                                        if (!hrEditable || !assignmentIdStr) return;
                                        const scale = resolveRatingScaleForManagedRow(emp);
                                        const seed =
                                          emp.hrOverallScore != null && Number.isFinite(Number(emp.hrOverallScore))
                                            ? String(Number(emp.hrOverallScore))
                                            : '';
                                        setHrQuickInlineError(null);
                                        setHrQuickInline({
                                          assignmentId: assignmentIdStr,
                                          draft: seed,
                                          scale,
                                        });
                                      }}
                                      sx={{
                                        cursor: hrEditable ? 'pointer' : 'default',
                                        display: 'inline-block',
                                        minWidth: 0,
                                        maxWidth: '100%',
                                      }}
                                    >
                                      <ManagedPhaseStatusWithScore
                                        statusLabel={emp.hrReviewStatus || 'Pending'}
                                        score={emp.hrOverallScore ?? null}
                                      />
                                    </Box>
                                  </Tooltip>
                                );
                              })()}
                            </TableCell>
                            <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <ManagedRatingChip score={emp.overallRating ?? null} />
                              </Box>
                            </TableCell>
                            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                              <Stack spacing={0.25} alignItems="flex-start">
                                <Chip
                                  label={rowPublished ? 'Published' : 'Pending'}
                                  size="small"
                                  color={rowPublished ? 'success' : 'default'}
                                  sx={{ fontSize: 11, height: 24 }}
                                />
                                {emp.publishedDate ? (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    display="block"
                                    sx={{ whiteSpace: 'normal', maxWidth: 140 }}
                                  >
                                    {formatDate(emp.publishedDate)}
                                  </Typography>
                                ) : null}
                              </Stack>
                            </TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
                                <Tooltip
                                  title={
                                    rowAction.label === 'View'
                                      ? 'View review'
                                      : rowAction.label === 'Open review'
                                        ? 'Open review'
                                        : rowAction.label === 'Awaiting self-eval'
                                          ? 'Awaiting employee self-evaluation'
                                          : 'No assignment'
                                  }
                                >
                                  <span>
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      aria-label={
                                        rowAction.label === 'View'
                                          ? 'View review'
                                          : rowAction.label === 'Open review'
                                            ? 'Open review'
                                            : String(rowAction.label)
                                      }
                                      disabled={rowAction.disabled}
                                      onClick={() => rowAction.path && navigate(rowAction.path)}
                                    >
                                      {rowAction.label === 'View' ? (
                                        <VisibilityOutlinedIcon fontSize="small" />
                                      ) : rowAction.label === 'Open review' ? (
                                        <RateReviewOutlinedIcon fontSize="small" />
                                      ) : rowAction.label === 'Awaiting self-eval' ? (
                                        <HourglassEmptyOutlinedIcon fontSize="small" />
                                      ) : (
                                        <BlockOutlinedIcon fontSize="small" />
                                      )}
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                {isAdmin && assignmentIdStr ? (
                                  rowPublished ? (
                                    <Tooltip title="Unpublish - employee will no longer see this result">
                                      <span>
                                        <IconButton
                                          size="small"
                                          color="warning"
                                          aria-label="Unpublish results"
                                          disabled={!assignmentIdStr || rowBusyHere}
                                          onClick={() => setSingleUnpublishAssignmentId(assignmentIdStr)}
                                        >
                                          {rowBusyHere && rowPublishBusy?.mode === 'unpublish' ? (
                                            <CircularProgress color="inherit" size={18} thickness={5} />
                                          ) : (
                                            <CloudOffOutlinedIcon fontSize="small" />
                                          )}
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                  ) : (
                                    <Tooltip
                                      title={
                                        othersRowAllReviewsComplete(emp)
                                          ? 'Publish results - visible to employee'
                                          : 'Complete self, manager, and HR reviews before publishing'
                                      }
                                    >
                                      <span>
                                        <IconButton
                                          size="small"
                                          color="primary"
                                          aria-label="Publish results"
                                          disabled={
                                            !assignmentIdStr ||
                                            rowBusyHere ||
                                            !othersRowAllReviewsComplete(emp)
                                          }
                                          onClick={() => setSinglePublishAssignmentId(assignmentIdStr)}
                                        >
                                          {rowBusyHere && rowPublishBusy?.mode === 'publish' ? (
                                            <CircularProgress color="inherit" size={18} thickness={5} />
                                          ) : (
                                            <CloudUploadOutlinedIcon fontSize="small" />
                                          )}
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                  )
                                ) : null}
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  rowsPerPageOptions={[10, 20, 50]}
                  count={managerTeamTotalCount}
                  rowsPerPage={othersRowsPerPage}
                  page={othersPage}
                  onPageChange={(_, p) => setOthersPage(p)}
                  onRowsPerPageChange={(e) => {
                    setOthersRowsPerPage(parseInt(e.target.value, 10));
                    setOthersPage(0);
                  }}
                  sx={{ borderTop: '1px solid', borderColor: 'divider', px: 2 }}
                />
              </>
            )}
          </AppCard>
        </Box>
      )}
      <AppSnackbar open={!!successMessage} onClose={clearSuccess} message={successMessage} />
      <AppSnackbar
        open={!!othersPublishSnack}
        onClose={() => setOthersPublishSnack(null)}
        message={othersPublishSnack?.message}
        severity={othersPublishSnack?.severity || 'success'}
        autoHideDuration={5000}
      />
      <PublishResultsConfirmDialog
        open={singlePublishAssignmentId != null}
        onClose={() => setSinglePublishAssignmentId(null)}
        onConfirm={() => {
          const id = singlePublishAssignmentId;
          if (id) void runOthersRowPublish(id);
        }}
        loading={
          Boolean(rowPublishBusy?.mode === 'publish') &&
          String(rowPublishBusy?.id ?? '') === String(singlePublishAssignmentId ?? '')
        }
        mode="single"
      />
      <Dialog
        open={singleUnpublishAssignmentId != null}
        onClose={() => !rowPublishBusy && setSingleUnpublishAssignmentId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Unpublish results?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            The employee will no longer see this result in Published reviews. You can publish again later.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <AppButton
            variant="outlined"
            startIcon={null}
            onClick={() => !rowPublishBusy && setSingleUnpublishAssignmentId(null)}
            disabled={!!rowPublishBusy}
          >
            Cancel
          </AppButton>
          <AppButton
            color="warning"
            startIcon={null}
            onClick={() => {
              const id = singleUnpublishAssignmentId;
              if (id) void runOthersRowUnpublish(id);
            }}
            loading={Boolean(rowPublishBusy?.mode === 'unpublish')}
            disabled={Boolean(rowPublishBusy)}
          >
            Unpublish
          </AppButton>
        </DialogActions>
      </Dialog>
      <SubmitConfirmationDialog
        open={hrQuickConfirm != null}
        onClose={() => {
          if (!hrQuickSubmitting) setHrQuickConfirm(null);
        }}
        onConfirm={() => void handleHrQuickConfirmSubmit()}
        isSaving={hrQuickSubmitting}
        isHrMode
        isManagerMode={false}
        preview={null}
        hrOverallRatingCaption={hrQuickConfirm?.caption ?? ''}
        hrCommentsPlain=""
      />
    </Box>
  );
};

export default EmployeePerformance;
