// Employee: Published performance results - list by financial year,
// detailed view via GET /performance/my-results/:assignmentId

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Typography, Grid, Divider, Chip, Stack,
  Alert, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  Avatar, IconButton, Tooltip, Rating,
  Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
} from 'recharts';
import usePerformance from '../../hooks/usePerformance';
import { AppCard, AppLoader, EmptyState, PageHeader } from '../../components/common/index.jsx';
import TableDotStatus from '../../components/common/TableDotStatus';
import { modernTableSx } from '../../utils/floatingPanelSx';
import { REVIEW_STATUSES } from '../../utils/constants';
import { getRatingLabel, getRatingColor, formatDate } from '../../utils/helpers';
import { normalizeQuestionTextToHtml, sanitizeRichTextHtml } from '../../utils/richText';
import useFinancialYears from '../../hooks/useFinancialYears';

/** Self-eval lifecycle: typically no published ratings until submission. */
function canOpenResultsReview(row) {
  return row?.status === REVIEW_STATUSES.SUBMITTED || row?.status === REVIEW_STATUSES.COMPLETED;
}

const questionRowAltSx = (qIdx: number) => {
  const isOdd = qIdx % 2 === 1;
  return {
    bgcolor: isOdd ? 'rgba(2, 136, 209, 0.06)' : 'rgba(46, 125, 50, 0.05)',
    borderLeft: '4px solid',
    borderLeftColor: isOdd ? 'info.light' : 'success.light',
  };
};

const weightChipSx = {
  flexShrink: 0,
  fontWeight: 700,
  bgcolor: 'rgba(2, 136, 209, 0.12)',
  borderColor: 'info.main',
  color: 'info.dark',
  '& .MuiChip-label': { px: 1.25, whiteSpace: 'nowrap' },
};

/** AccordionSummary is a flex row; chips default to shrinking and squash label text */
const accordionSummaryChipSx = {
  flexShrink: 0,
  '& .MuiChip-label': { whiteSpace: 'nowrap' },
};

function PublishedPhaseReadout({
  label,
  snapshot,
  scale,
  accentColor,
}: {
  label: string;
  snapshot: { rating: number; comment: string } | null;
  scale: number;
  accentColor: string;
}) {
  const has =
    snapshot &&
    ((Number(snapshot.rating) || 0) > 0 || String(snapshot.comment || '').trim() !== '');
  return (
    <Box>
      {label ? (
        <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          {label}
        </Typography>
      ) : null}
      {!has ? (
        <Typography variant="caption" color="text.secondary">-</Typography>
      ) : (
        <>
          {scale !== 10 ? (
            <Rating
              value={Math.min(scale, Math.max(0, Number(snapshot.rating) || 0))}
              max={scale}
              readOnly
              precision={0.1}
              size="small"
              sx={{
                mb: 0.5,
                '& .MuiRating-iconFilled': { color: accentColor },
                '& .MuiRating-iconEmpty': { color: 'action.disabledBackground' },
              }}
            />
          ) : null}
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            Rating:{' '}
            <strong>
              {Number(snapshot.rating || 0).toFixed(1)} / {scale}
            </strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
            {String(snapshot.comment || '').trim() || '-'}
          </Typography>
        </>
      )}
    </Box>
  );
}

function PublishedResultPanels({ result }) {
  const ratingLabel = getRatingLabel(result.finalRating, result.ratingScale);
  const ratingColor = getRatingColor(ratingLabel);

  const scale = Number(result.ratingScale) || 5;
  const areas = result.focusAreas || [];

  const radarRatingTicks =
    Number.isFinite(scale) &&
    Number.isInteger(scale) &&
    scale > 0 &&
    scale <= 10
      ? Array.from({ length: scale + 1 }, (_, i) => i)
      : undefined;

  type RadarDatum = { subject: string; Self: number; Manager: number };
  const radarData: RadarDatum[] = areas.map((fa) => {
    const subject =
      typeof fa.name === 'string' && fa.name.length > 28 ? `${fa.name.slice(0, 26)}…` : fa.name;
    return {
      subject,
      Self: Number(fa.selfScore) || 0,
      Manager: Number(fa.managerScore) || 0,
    };
  });

  const n = result.focusAreas?.length ?? 0;

  const avgSelf =
    n > 0 ? (result.focusAreas.reduce((a, fa) => a + fa.selfScore, 0) / n).toFixed(1) : null;
  const avgMgr =
    n > 0 ? (result.focusAreas.reduce((a, fa) => a + fa.managerScore, 0) / n).toFixed(1) : null;
  const avgHr =
    n > 0 && result.focusAreas.some((fa) => fa.hrScore != null && Number.isFinite(Number(fa.hrScore)))
      ? (
          result.focusAreas.reduce(
            (sum, fa) => sum + (fa.hrScore != null ? Number(fa.hrScore) || 0 : 0),
            0,
          ) /
          result.focusAreas.filter(
            (fa) => fa.hrScore != null && Number.isFinite(Number(fa.hrScore)),
          ).length
        ).toFixed(1)
      : null;

  const summarySelf =
    result.selfOverallScore != null && Number.isFinite(Number(result.selfOverallScore))
      ? Number(result.selfOverallScore).toFixed(1)
      : avgSelf;
  const summaryMgr =
    result.managerOverallScore != null && Number.isFinite(Number(result.managerOverallScore))
      ? Number(result.managerOverallScore).toFixed(1)
      : avgMgr;
  const summaryHr =
    result.hrOverallScore != null && Number.isFinite(Number(result.hrOverallScore))
      ? Number(result.hrOverallScore).toFixed(1)
      : avgHr;
  const summaryFinal =
    result.hrOverallScore != null && Number.isFinite(Number(result.hrOverallScore))
      ? Number(result.hrOverallScore).toFixed(1)
      : Number(result.finalRating || 0).toFixed(1);

  return (
    <>
      <AppCard
        sx={{
          p: 4, mb: 3,
          background: `linear-gradient(135deg, ${ratingColor}15 0%, transparent 60%)`,
          borderLeft: `4px solid ${ratingColor}`,
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar sx={{ width: 72, height: 72, bgcolor: ratingColor, fontSize: 28 }}>
              <EmojiEventsIcon fontSize="large" />
            </Avatar>
          </Grid>
          <Grid item flex={1}>
            <Typography variant="h3" fontWeight={800} sx={{ color: ratingColor, lineHeight: 1 }}>
              {Number(result.finalRating).toFixed(1)}{' '}
              <Typography component="span" variant="h5" color="text.secondary">
                / {result.ratingScale}
              </Typography>
            </Typography>
            <Typography variant="h6" fontWeight={600} sx={{ color: ratingColor }}>
              {ratingLabel}
            </Typography>
            {scale !== 10 ? (
              <Rating
                value={Math.min(scale, Math.max(0, Number(result.finalRating) || 0))}
                max={scale}
                readOnly
                precision={0.1}
                size="large"
                sx={{
                  mt: 1,
                  '& .MuiRating-iconFilled': { color: ratingColor },
                  '& .MuiRating-iconEmpty': { color: 'action.disabledBackground' },
                }}
              />
            ) : null}
            <Typography variant="body2" color="text.secondary" sx={{ mt: scale !== 10 ? 1 : 0 }}>
              {result.formName} • Published {formatDate(result.publishedDate)}
            </Typography>
          </Grid>
          <Grid item>
            <Stack spacing={1}>
              <Chip label={`Period: ${result.period}`} variant="outlined" size="small" />
              <Chip label={`Reviewed by: ${result.managerName}`} variant="outlined" size="small" />
            </Stack>
          </Grid>
        </Grid>
      </AppCard>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <AppCard sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Radar: ratings by focus area
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              Each axis is a focus area; distance from centre is the score from 0 to {scale}.
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {radarData.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No focus area breakdown returned for this result.
                </Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="75%"
                  data={radarData}
                  margin={{ top: 8, right: 24, bottom: 8, left: 24 }}
                >
                  <PolarGrid radialLines />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, scale]}
                    ticks={radarRatingTicks?.map((n) => ({ value: String(n), coordinate: n }))}
                    tick={{ fontSize: 10 }}
                  />
                  <Radar
                    name="Self"
                    dataKey="Self"
                    stroke="#9c27b0"
                    fill="#9c27b0"
                    fillOpacity={0.12}
                  />
                  <Radar
                    name="Manager"
                    dataKey="Manager"
                    stroke="#1976d2"
                    fill="#1976d2"
                    fillOpacity={0.12}
                  />
                  <RechartsTooltip
                    formatter={(value, name) => [`${Number(value).toFixed(1)} / ${scale}`, String(name)]}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </AppCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <AppCard sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>HR / Admin Feedback</Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" sx={{ lineHeight: 1.8, fontStyle: result.hrComments !== '-' ? 'italic' : 'normal', color: 'text.secondary' }}>
              {result.hrComments !== '-' ? `“${result.hrComments}”` : 'No overall HR comments for this result.'}
            </Typography>
            <Typography variant="caption" color="text.secondary" mt={1} display="block">
              - {result.hrName}
            </Typography>
          </AppCard>

          {n > 0 && (
            <Grid container spacing={1.5} sx={{ mt: 1.5 }}>
              {[
                { label: 'Self (overall)', value: summarySelf, color: '#9c27b0' },
                { label: 'Manager (overall)', value: summaryMgr, color: '#1976d2' },
                { label: 'HR (overall)', value: summaryHr, color: '#ed6c02' },
                { label: 'Final rating', value: summaryFinal, color: ratingColor },
              ].map((stat) => (
                <Grid item xs={6} sm={3} key={stat.label}>
                  <AppCard sx={{ textAlign: 'center', p: 1.5 }}>
                    <Typography variant="h5" fontWeight={800} sx={{ color: stat.color }}>{stat.value}</Typography>
                    <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                  </AppCard>
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>
      </Grid>

      <AppCard sx={{ mt: 3, overflow: 'hidden', p: 0 }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'rgba(248,250,252,0.92)' }}>
          <Typography variant="subtitle1" fontWeight={700}>Focus area breakdown</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Each focus area lists its evaluation questions with your answers, manager answers, and ratings (same layout as the review form editor).
          </Typography>
        </Box>
        {n === 0 ? (
          <Box sx={{ p: 4 }}>
            <Typography variant="body2" color="text.secondary">No rows to display.</Typography>
          </Box>
        ) : (
          <Box sx={{ px: 2, py: 2 }}>
            {result.focusAreas.map((fa) => {
              const qs = Array.isArray(fa.questions) ? fa.questions : [];
              const w =
                fa.weightage != null && fa.weightage !== ''
                  ? (() => {
                      const num = Number(fa.weightage);
                      return Number.isFinite(num) ? `${num}x` : String(fa.weightage);
                    })()
                  : null;
              return (
                <Accordion
                  key={fa.rowId || fa.name}
                  defaultExpanded={false}
                  disableGutters
                  sx={{
                    mb: 1.5,
                    '&:before': { display: 'none' },
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ bgcolor: 'grey.50', px: 2 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', flex: 1, pr: 1 }}>
                      <Typography fontWeight={700}>{fa.name}</Typography>
                      {qs.length > 0 ? (
                        <Chip label={`${qs.length} questions`} size="small" sx={accordionSummaryChipSx} />
                      ) : null}
                      {w ? (
                        <Chip label={w} size="small" variant="outlined" sx={weightChipSx} />
                      ) : null}
                      <Chip
                        label={`Self (area): ${fa.selfScore} / ${scale}`}
                        size="small"
                        sx={{
                          bgcolor: '#9c27b015',
                          color: '#6a1b9a',
                          fontWeight: 600,
                          ...accordionSummaryChipSx,
                        }}
                      />
                      <Chip
                        label={`Manager (area): ${fa.managerScore} / ${scale}`}
                        size="small"
                        sx={{
                          bgcolor: '#1976d215',
                          color: '#0d47a1',
                          fontWeight: 600,
                          ...accordionSummaryChipSx,
                        }}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 2.5, pt: 0 }}>
                    {qs.length > 0 ? (
                      <Stack spacing={2}>
                        {qs.map((q, qIdx) => {
                          const html = sanitizeRichTextHtml(
                            normalizeQuestionTextToHtml(q?.text ?? '')
                          );
                          const qw =
                            q.weightage != null && q.weightage !== ''
                              ? (() => {
                                  const num = Number(q.weightage);
                                  return Number.isFinite(num) ? `${num}x` : String(q.weightage);
                                })()
                              : null;
                          return (
                            <Box
                              key={q.id || qIdx}
                              sx={{
                                p: 2,
                                borderRadius: 1.5,
                                border: '1px solid',
                                borderColor: 'divider',
                                ...questionRowAltSx(qIdx),
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: 1.5,
                                  mb: 2,
                                }}
                              >
                                <Chip label={`Q${qIdx + 1}`} size="small" sx={{ flexShrink: 0, mt: 0.2 }} />
                                <Box
                                  sx={{
                                    flex: 1,
                                    minWidth: 0,
                                    '& p': { m: 0 },
                                    '& ul, & ol': { mt: 0, mb: 0, pl: 2.25 },
                                    '& li': { mt: 0.25 },
                                  }}
                                  dangerouslySetInnerHTML={{ __html: html }}
                                />
                                {qw ? (
                                  <Chip label={qw} size="small" variant="outlined" sx={{ ...weightChipSx, flexShrink: 0 }} />
                                ) : null}
                              </Box>
                              <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                  <PublishedPhaseReadout
                                    label="Your response"
                                    snapshot={q.selfReview}
                                    scale={scale}
                                    accentColor="#9c27b0"
                                  />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <PublishedPhaseReadout
                                    label="Manager review"
                                    snapshot={q.managerReview}
                                    scale={scale}
                                    accentColor="#1976d2"
                                  />
                                </Grid>
                              </Grid>
                            </Box>
                          );
                        })}
                      </Stack>
                    ) : (
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                          No per-question breakdown returned; showing focus area summary only.
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <PublishedPhaseReadout
                              label="Your response"
                              snapshot={
                                fa.selfScore > 0 || String(fa.selfComment || '').trim()
                                  ? {
                                      rating: Number(fa.selfScore) || 0,
                                      comment: String(fa.selfComment || ''),
                                    }
                                  : null
                              }
                              scale={scale}
                              accentColor="#9c27b0"
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <PublishedPhaseReadout
                              label="Manager review"
                              snapshot={
                                fa.managerScore > 0 || String(fa.managerComment || '').trim()
                                  ? {
                                      rating: Number(fa.managerScore) || 0,
                                      comment: String(fa.managerComment || ''),
                                    }
                                  : null
                              }
                              scale={scale}
                              accentColor="#1976d2"
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        )}
      </AppCard>
    </>
  );
}

const MyResults = () => {
  const navigate = useNavigate();
  const { assignmentId } = useParams();
  const {
    myPublishedReviews,
    myPublishedReviewsLoading,
    myResultDetail,
    myResultDetailLoading,
    error,
    loadMyPublishedReviews,
    loadMyResultDetail,
    resetMyResultDetail,
    clearError,
  } = usePerformance();
  const { financialYears, activeFinancialYear, financialYearsLoading } = useFinancialYears();

  const [financialYearId, setFinancialYearId] = useState('');

  const assignmentRows = useMemo(
    () => [...(myPublishedReviews.pending || []), ...(myPublishedReviews.submitted || [])],
    [myPublishedReviews.pending, myPublishedReviews.submitted]
  );

  const fyBootstrapPending =
    financialYearsLoading || (financialYears.length > 0 && !financialYearId);
  const listViewInitialLoading =
    fyBootstrapPending ||
    (Boolean(financialYearId) && myPublishedReviewsLoading && assignmentRows.length === 0);

  useEffect(() => {
    if (activeFinancialYear?.id && !financialYearId) {
      setFinancialYearId(activeFinancialYear.id);
    }
  }, [activeFinancialYear, financialYearId]);

  useEffect(() => {
    if (assignmentId || !financialYearId) return;
    loadMyPublishedReviews(financialYearId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [financialYearId, assignmentId]);

  useEffect(() => {
    if (!assignmentId) {
      resetMyResultDetail();
      return undefined;
    }
    clearError();
    loadMyResultDetail(assignmentId);
    return () => {
      resetMyResultDetail();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  if (assignmentId) {
    if (myResultDetailLoading) return <AppLoader message="Loading result..." />;
    return (
      <Box>
        <PageHeader
          title="My Results"
          subtitle="Published ratings and feedback for this assignment"
          startAdornment={
            <IconButton
              size="small"
              aria-label="Back to assignments"
              onClick={() => navigate('/performance/results')}
            >
              <ArrowBackIcon />
            </IconButton>
          }
        />

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {!error && !myResultDetail && (
          <Alert severity="info">Unable to load this result.</Alert>
        )}
        {myResultDetail && <PublishedResultPanels result={myResultDetail} />}
      </Box>
    );
  }

  if (listViewInitialLoading) return <AppLoader message="Loading your assignments..." />;

  return (
    <Box>
      <PageHeader
        title="My Results"
        subtitle="Your assignments for the year - open a submission to view published ratings when available"
        actions={
          <FormControl
            size="small"
            sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { xs: 0, sm: 168 } }}
          >
            <InputLabel>Review Period</InputLabel>
            <Select
              fullWidth
              value={financialYearId}
              label="Review Period"
              onChange={(e) => setFinancialYearId(e.target.value)}
            >
              {financialYears.map((y) => (
                <MenuItem key={y.id} value={y.id}>{y.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <AppCard sx={{}} variant="table">
        {!assignmentRows.length ? (
          <EmptyState variant="noContent" message="No review assignments found for this review period." minHeight={260} />
        ) : (
          <TableContainer>
            <Table sx={modernTableSx}>
              <TableHead>
                <TableRow>
                  <TableCell>Review form</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell>Your status</TableCell>
                  <TableCell>Manager</TableCell>
                  <TableCell>HR</TableCell>
                  <TableCell align="right">View</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignmentRows.map((row) => (
                  <TableRow key={row.id} hover sx={{ '&:hover': { bgcolor: 'rgba(79,70,229,0.035)' } }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>{row.formName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                        {formatDate(row.startDate)} - {formatDate(row.endDate)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <TableDotStatus label={row.status} />
                    </TableCell>
                    <TableCell>
                      <TableDotStatus label={row.managerStatus || 'Pending'} />
                    </TableCell>
                    <TableCell>
                      <TableDotStatus label={row.hrStatus || 'Pending'} />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip
                        title={
                          canOpenResultsReview(row)
                            ? 'View published result details'
                            : 'Submit your self-evaluation before viewing results'
                        }
                      >
                        <span>
                          <IconButton
                            size="small"
                            color="primary"
                            aria-label={`View ${row.formName}`}
                            disabled={!canOpenResultsReview(row)}
                            onClick={() =>
                              navigate(`/performance/results/${row.assignmentId}`)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </AppCard>
    </Box>
  );
};

export default MyResults;
