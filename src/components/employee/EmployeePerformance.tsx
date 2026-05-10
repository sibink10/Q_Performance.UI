// src/pages/employee/EmployeePerformance.jsx
// Employee: Performance dashboard with 3 tabs:
//   - Pending Reviews (self-evaluation cards)
//   - Submitted Reviews
//   - Others' Reviews (managed assignments - GET /performance/managed-assignments)

import { useEffect, useState, type ReactNode } from 'react';
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
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import usePerformance from '../../hooks/usePerformance';
import useAuth from '../../hooks/useAuth';
import AppButton from '../../components/common/AppButton';
import { AppLoader, EmptyState, StatusChip } from '../../components/common';
import AppCard from '../../components/common/AppCard';
import TableDotStatus from '../../components/common/TableDotStatus';
import { mainLayoutStickySubheaderBandSx } from '../../components/common/PageHeader';
import { modernTableSx } from '../../utils/floatingPanelSx';
import { getDaysRemaining, getDeadlineColor, formatDate, isAssignmentPhaseSubmitted } from '../../utils/helpers';
import useFinancialYears from '../../hooks/useFinancialYears';

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
          variant={review.status === 'Not Started' ? 'contained' : 'outlined'}
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
    loadMyReviews,
    loadManagerTeam,
    loadReviewForms,
  } = usePerformance();
  const { financialYears, activeFinancialYear, financialYearsLoading } = useFinancialYears();
  const { isAdmin } = useAuth();

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
                message="No pending reviews for selected review period."
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
              <EmptyState variant="noContent" message="No submitted reviews for selected review period." minHeight={260} />
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
                            <AppButton
                              size="small"
                              variant="outlined"
                              startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 18 }} />}
                              onClick={() => navigate(`/performance/review/${assignmentId}`)}
                            >
                              View
                            </AppButton>
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
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {managerTeam.map((emp) => {
                        const rowAction = othersManagedReviewAction(emp, isAdmin);
                        return (
                          <TableRow key={`${emp.id}-${emp.reviewId}`} hover sx={{ '&:hover': { bgcolor: 'rgba(79,70,229,0.035)' } }}>
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
                            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                              <ManagedPhaseStatusWithScore
                                statusLabel={emp.hrReviewStatus || 'Pending'}
                                score={emp.hrOverallScore ?? null}
                              />
                            </TableCell>
                            <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <ManagedRatingChip score={emp.overallRating ?? null} />
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <AppButton
                                startIcon={
                                  rowAction.label === 'View' ? (
                                    <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                                  ) : null
                                }
                                size="small"
                                variant="outlined"
                                disabled={rowAction.disabled}
                                onClick={() => rowAction.path && navigate(rowAction.path)}
                              >
                                {rowAction.label}
                              </AppButton>
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
    </Box>
  );
};

export default EmployeePerformance;
