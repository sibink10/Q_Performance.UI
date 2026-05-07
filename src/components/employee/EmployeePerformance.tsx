// src/pages/employee/EmployeePerformance.jsx
// Employee: Performance dashboard with 3 tabs:
//   - Pending Reviews (self-evaluation cards)
//   - Submitted Reviews
//   - Others' Reviews (managed assignments — GET /performance/managed-assignments)

import { useEffect, useState } from 'react';
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
  Avatar,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import usePerformance from '../../hooks/usePerformance';
import useAuth from '../../hooks/useAuth';
import AppButton from '../../components/common/AppButton';
import { AppLoader, StatusChip } from '../../components/common';
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

  if (!hasReview) return { disabled: true as const, label: '—' as const, path: null as string | null };
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
  return { disabled: true as const, label: 'Completed' as const, path: null };
};

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
        transition: 'box-shadow 0.2s, border-color 0.2s',
        '&:hover': { boxShadow: 3, borderColor: 'primary.light' },
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
          {formatDate(review.startDate)} — {formatDate(review.endDate)}
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
    loadMyPublishedReviews,
    loadManagerTeam,
    loadReviewForms,
  } = usePerformance();
  const { financialYears, activeFinancialYear } = useFinancialYears();
  const { isAdmin } = useAuth();

  const pageLoading = myReviewsLoading;

  const [tab, setTab] = useState(0);
  const [financialYearId, setFinancialYearId] = useState('');
  const [othersPage, setOthersPage] = useState(0);
  const [othersRowsPerPage, setOthersRowsPerPage] = useState(20);
  const [othersSearchInput, setOthersSearchInput] = useState('');
  const [debouncedOthersSearch, setDebouncedOthersSearch] = useState('');
  const [othersReviewFormId, setOthersReviewFormId] = useState('');

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
      loadMyPublishedReviews(financialYearId);
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
    <Box>
      <AppCard
        variant="glass"
        sx={{
          ...mainLayoutStickySubheaderBandSx(theme),
          mx: 0,
          px: 2,
          py: 2,
          mb: 2.5,
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
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons={'auto'}
            allowScrollButtonsMobile
            sx={{
              order: { xs: 2, sm: 1 },
              width: { xs: '100%', sm: 'max-content' },
              maxWidth: '100%',
              flexShrink: 0,
              minHeight: 44,
              '& .MuiTabs-flexContainer': { gap: 0.5 },
            }}
          >
            {tabs.map((t, i) => (
              <Tab
                key={i}
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {t.icon}
                    <Box component="span" sx={{ whiteSpace: 'nowrap' }}>
                      {t.label}
                    </Box>
                    {t.count > 0 && (
                      <Chip label={t.count} size="small" color="primary" sx={{ height: 18, fontSize: 10 }} />
                    )}
                  </Stack>
                }
              />
            ))}
          </Tabs>
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
            <InputLabel id="perf-fy-label">Financial Year</InputLabel>
            <Select
              labelId="perf-fy-label"
              label="Financial Year"
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
            <AppCard sx={{ p: 6, textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography fontWeight={600}>All caught up!</Typography>
              <Typography variant="body2" color="text.secondary">
                No pending reviews for selected financial year
              </Typography>
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
            <AppCard sx={{ p: 6, textAlign: 'center' }}>
              <Typography color="text.secondary">No submitted reviews for selected financial year</Typography>
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
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Submitted on</TableCell>
                      <TableCell>Self eval</TableCell>
                      <TableCell>Manager</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>HR</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {myReviews.submitted.map((r) => (
                      <TableRow key={r.id} hover sx={{ '&:hover': { bgcolor: 'rgba(79,70,229,0.035)' } }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>
                            {r.formName}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                            {formatDate(r.startDate)} — {formatDate(r.endDate)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                          <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                            {formatDate(r.submittedAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <TableDotStatus label="Submitted" tone="positive" />
                        </TableCell>
                        <TableCell>
                          <TableDotStatus label={r.managerStatus || 'Pending'} />
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                          <TableDotStatus label={r.hrStatus || 'Pending'} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AppCard>
          )}
        </Box>
      )}

      {/* Tab 2: Others' Reviews — GET /performance/managed-assignments */}
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
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <Typography color="text.secondary">No managed reviews match the current filters.</Typography>
              </Box>
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
                                  <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: 'text.secondary' }} noWrap>
                                    {emp.designation || '—'}
                                  </Typography>
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                              <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: 'text.secondary', fontWeight: 500 }}>
                                {emp.formName}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <TableDotStatus label={emp.selfEvalStatus} />
                            </TableCell>
                            <TableCell>
                              <TableDotStatus label={emp.managerReviewStatus || 'Pending'} />
                            </TableCell>
                            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                              <TableDotStatus label={emp.hrReviewStatus || 'Pending'} />
                            </TableCell>
                            <TableCell align="right">
                              <AppButton
                                startIcon={null}
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
