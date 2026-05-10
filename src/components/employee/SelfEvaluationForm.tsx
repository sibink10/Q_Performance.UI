// src/pages/employee/SelfEvaluationForm.jsx
// Employee: self-evaluation; Manager: team review; Admin: HR review (mode=hr).
// Assignment detail: progressive reveal via allReviewsSubmitted + per-question phase snapshots.
// @ts-nocheck

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
    Box,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    TextField,
    LinearProgress,
    Alert,
    Chip,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Rating,
    FormHelperText,
  } from '@mui/material';
import { alpha } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import CheckIcon from '@mui/icons-material/Check';
import usePerformance from '../../hooks/usePerformance';
import usePerformanceApi from '../../hooks/usePerformanceApi';
import useAuth from '../../hooks/useAuth';
import AppButton from '../../components/common/AppButton';
import { AppCard, AppSnackbar } from '../../components/common';
import { AppLoader, PageHeader } from '../../components/common/index.jsx';
import {
  calculateCompletionPercentage,
  isFormComplete,
  mapAssignmentForSelfEvaluation,
  isAssignmentPhaseSubmitted,
  getApiErrorMessage,
} from '../../utils/helpers';
import { normalizeQuestionTextToHtml, richTextHtmlToPlainText, sanitizeRichTextHtml } from '../../utils/richText';
import { validateHrSubmitInput } from '../../utils/performanceSubmission';
import {
  saveEvaluation,
  submitEvaluation,
  submitManagerEvaluation,
  submitHrReview,
} from '../../app/state/slices/performanceThunks';
import { clearError as clearPerformanceError } from '../../app/state/slices/performanceSlice';
import EvaluationQuestionCard from './self-evaluation/EvaluationQuestionCard';

const SELF_EVAL_MIN_ANSWER_LEN = 50;
const getTextLen = (value) => richTextHtmlToPlainText(String(value ?? '')).length;

const SelfEvaluationForm = () => {
  const { reviewId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAdmin } = useAuth();
  const {
    getAssignmentById,
    publishRatings,
    unpublishAssignmentResults,
    saveManagerEvaluationDraft,
  } = usePerformanceApi();

  const modeManager = searchParams.get('mode') === 'manager';
  const modeHr = searchParams.get('mode') === 'hr';
  const isManagerMode = modeManager;
  const isHrMode = modeHr && isAdmin;
  const targetEmployeeId = searchParams.get('employeeId');

  const {
    isSaving,
    error,
    successMessage,
    clearSuccess,
    clearError,
  } = usePerformance();

  const [review, setReview] = useState(null);
  const [answers, setAnswers] = useState({});
  /** Bumped when answers are reset from the server so question rows remount/sync draft text. */
  const [answersHydrationKey, setAnswersHydrationKey] = useState(0);
  const commentDraftGettersRef = useRef(new Map());
  const [expandedFocusAreaId, setExpandedFocusAreaId] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(() => !!reviewId);
  const [loadError, setLoadError] = useState(null);
  /** Locks UI after 409 Conflict (phase already submitted). */
  const [phaseConflict, setPhaseConflict] = useState({ self: false, manager: false, hr: false });
  const [mutationToast, setMutationToast] = useState(null);
  const [selfSubmitValidationOn, setSelfSubmitValidationOn] = useState(false);
  const [hrOverallRating, setHrOverallRating] = useState('');
  const [hrComments, setHrComments] = useState('');
  const [hrValidation, setHrValidation] = useState({});
  const [publishBusy, setPublishBusy] = useState(false);
  const [unpublishConfirmOpen, setUnpublishConfirmOpen] = useState(false);

  // Manager draft save UX (manual-only; does not submit).
  const [managerDraftSaveStatus, setManagerDraftSaveStatus] = useState('idle'); // idle | saving | saved | failed
  const managerDraftSaveSeqRef = useRef(0);

  const pickInitialAnswers = useCallback((mapped) => {
    if (isHrMode) return mapped.hrInitialAnswers && typeof mapped.hrInitialAnswers === 'object' ? mapped.hrInitialAnswers : {};
    if (isManagerMode) {
      return mapped.managerInitialAnswers && typeof mapped.managerInitialAnswers === 'object'
        ? mapped.managerInitialAnswers
        : {};
    }
    return mapped.initialAnswers && typeof mapped.initialAnswers === 'object' ? mapped.initialAnswers : {};
  }, [isHrMode, isManagerMode]);

  useEffect(() => {
    if (!reviewId) {
      setIsLoading(false);
      setLoadError('Missing assignment id.');
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError(null);
      setPhaseConflict({ self: false, manager: false, hr: false });
      dispatch(clearPerformanceError());
      try {
        if (cancelled) return;
        const assignment = await getAssignmentById(reviewId);
        const mapped = mapAssignmentForSelfEvaluation(assignment);
        if (mapped) {
          setReview(mapped);
        } else {
          setLoadError('Invalid assignment or review form data.');
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(typeof e === 'string' ? e : e?.message ?? 'Failed to load assignment.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // dispatch + thunk are stable; avoid usePerformance’s inline wrappers (new ref each render).
  }, [reviewId, dispatch, pickInitialAnswers]);

  useEffect(() => {
    if (!review) return;
    setAnswers(pickInitialAnswers(review));
    setAnswersHydrationKey((k) => k + 1);
    setExpandedFocusAreaId((prev) => {
      const firstId = review?.sections?.[0]?.focusAreaId;
      if (!firstId) return false;
      // If current expanded panel is still valid, keep it; otherwise expand the first section.
      return prev && review.sections.some((s) => s.focusAreaId === prev) ? prev : firstId;
    });
    setHrOverallRating(
      review.hrOverallScore != null && review.hrOverallScore !== ''
        ? String(review.hrOverallScore)
        : ''
    );
    setHrComments(
      review.hrComments != null && String(review.hrComments).trim() !== ''
        ? String(review.hrComments)
        : ''
    );
    setSelfSubmitValidationOn(false);
    setHrValidation({});
    setManagerDraftSaveStatus('idle');
  }, [review, pickInitialAnswers, modeManager, modeHr]);

  const allQuestions = review ? review.sections.flatMap((s) => s.questions) : [];
  const questionHtmlById = useMemo(() => {
    if (!review?.sections) return {};
    const map = {};
    for (const s of review.sections) {
      for (const q of s.questions) {
        map[q.id] = sanitizeRichTextHtml(normalizeQuestionTextToHtml(q?.text));
      }
    }
    return map;
  }, [review]);
  const hrRatingScale =
    Number.isFinite(Number(review?.ratingScale)) && Number(review?.ratingScale) > 0
      ? Number(review.ratingScale)
      : 5;
  const selfAnsweredCountMinLen = allQuestions.filter((q) => {
    const a = answers[q.id] || {};
    return Boolean(a?.rating) && getTextLen(a?.comment) >= SELF_EVAL_MIN_ANSWER_LEN;
  }).length;
  const completionPct =
    isManagerMode || isHrMode
      ? calculateCompletionPercentage(answers, allQuestions)
      : allQuestions.length
        ? Math.round((selfAnsweredCountMinLen / allQuestions.length) * 100)
        : 0;
  const hrCompletionPct =
    hrOverallRating !== '' && Number.isFinite(Number(hrOverallRating)) ? 100 : 0;
  const effectiveCompletionPct = isHrMode ? hrCompletionPct : completionPct;
  const canSubmit = isHrMode
    ? Object.keys(validateHrSubmitInput({ hrOverallRating, hrComments }, hrRatingScale)).length === 0
    : isManagerMode
      ? isFormComplete(answers, allQuestions)
      : allQuestions.every((q) => {
          const a = answers[q.id] || {};
          return Boolean(a?.rating) && getTextLen(a?.comment) >= SELF_EVAL_MIN_ANSWER_LEN;
        });

  const hrOverallRatingNum = Number(hrOverallRating);
  const hrOverallRatingStarValue =
    hrOverallRating === '' || !Number.isFinite(hrOverallRatingNum)
      ? null
      : hrOverallRatingNum >= 0 && hrOverallRatingNum <= hrRatingScale
        ? Math.round(hrOverallRatingNum * 10) / 10
        : null;
  const hrOverallRatingStarCaption =
    hrOverallRatingStarValue != null
      ? `${hrOverallRatingStarValue.toFixed(1)} / ${hrRatingScale}`
      : 'Select a rating';

  const effectiveEmployeeId =
    (targetEmployeeId && String(targetEmployeeId).trim()) ||
    (review?.assignmentEmployeeId && String(review.assignmentEmployeeId).trim()) ||
    '';

  const selfStatusForLock =
    review?.selfEvalStatus ?? review?.selfEvaluationStatus ?? null;
  const selfPhaseComplete = isAssignmentPhaseSubmitted(selfStatusForLock);
  const managerPhaseComplete = isAssignmentPhaseSubmitted(review?.managerEvalStatus);
  const hrPhaseComplete = isAssignmentPhaseSubmitted(review?.hrReviewStatus);
  const hrResultsVisible = Boolean(review?.resultsPublishedToEmployee);
  const overallRatingNum = Number(review?.overallRating);
  const hasOverallRating =
    review?.overallRating != null &&
    review.overallRating !== '' &&
    Number.isFinite(overallRatingNum);

  const formatWeightage = (value) => {
    if (value == null || value === '') return null;
    const n = Number(value);
    if (!Number.isFinite(n)) return String(value);
    // Keep integers clean, keep decimals when provided (e.g. 3.5)
    return Number.isInteger(n) ? String(n) : String(n);
  };

const weightageChipSx = {
  flexShrink: 0,
  fontWeight: 700,
  bgcolor: 'rgba(2, 136, 209, 0.12)', // info light background
  borderColor: 'info.main',
  color: 'info.dark',
  '& .MuiChip-label': {
    px: 1.25,
  },
};

/** Progress summary row chips: tinted fills; `height: auto` avoids MUI small chip’s fixed 24px clipping cramped label type. */
const progressCardChipShell = (theme) => ({
  height: 'auto',
  fontWeight: 500,
  borderRadius: 2,
  '& .MuiChip-label': {
    px: 1.25,
    py: 0.5,
    lineHeight: 1.5,
    letterSpacing: '0.01em',
  },
  boxShadow: `0 1px 0 ${alpha(theme.palette.common.black, theme.palette.mode === 'dark' ? 0.2 : 0.04)}`,
});

  const selfFieldsReadOnly =
    !isManagerMode && !isHrMode && (selfPhaseComplete || phaseConflict.self);

  const managerFieldsReadOnly = isManagerMode && (managerPhaseComplete || phaseConflict.manager);
  const hrFieldsReadOnly = isHrMode && (hrPhaseComplete || phaseConflict.hr);

  const showSaveDraft = !isManagerMode && !isHrMode && !selfFieldsReadOnly;
  const showManagerSaveDraft =
    isManagerMode && !!effectiveEmployeeId && !managerFieldsReadOnly && !phaseConflict.manager;

  const hasHrOverall =
    review?.hrOverallScore != null &&
    review.hrOverallScore !== '' &&
    Number.isFinite(Number(review.hrOverallScore));
  const hasHrOverallComments =
    review?.hrComments != null && String(review.hrComments).trim() !== '';
  /** Employees see HR overall only after publication; managers/HR see based on assignment data. */
  const showHrOverallSummary =
    (hasHrOverall || hasHrOverallComments) && (isHrMode || isManagerMode || hrResultsVisible);

  const reloadAssignment = useCallback(async () => {
    if (!reviewId) return;
    try {
      const assignment = await getAssignmentById(reviewId);
      const mapped = mapAssignmentForSelfEvaluation(assignment);
      if (mapped) setReview(mapped);
    } catch {
      // ignore refresh errors; page already has error UI
    }
  }, [reviewId, getAssignmentById]);

  const updateAnswer = useCallback((questionId, field, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], [field]: value },
    }));
  }, []);

  const registerCommentDraftGetter = useCallback((questionId, getDraft) => {
    commentDraftGettersRef.current.set(questionId, getDraft);
    return () => {
      commentDraftGettersRef.current.delete(questionId);
    };
  }, []);

  const flushCommentDraftsToAnswers = useCallback(() => {
    let merged = null;
    flushSync(() => {
      setAnswers((prev) => {
        let next = null;
        for (const [qid, getDraft] of commentDraftGettersRef.current) {
          const s = String(getDraft() ?? '');
          if (String(prev[qid]?.comment ?? '') === s) continue;
          if (next === null) next = { ...prev };
          next[qid] = { ...next[qid], comment: s };
        }
        merged = next ?? prev;
        return merged;
      });
    });
    return merged;
  }, []);

  const saveManagerDraftNow = useCallback(
    async ({ silent = false } = {}) => {
      if (!reviewId || !showManagerSaveDraft) return;

      const seq = ++managerDraftSaveSeqRef.current;
      if (!silent) clearError();
      setManagerDraftSaveStatus('saving');
      const mergedAnswers = flushCommentDraftsToAnswers();

      try {
        await saveManagerEvaluationDraft({
          employeeId: effectiveEmployeeId,
          assignmentId: reviewId,
          answers: mergedAnswers,
        });
        if (managerDraftSaveSeqRef.current === seq) setManagerDraftSaveStatus('saved');
      } catch (e) {
        const status = e?.status;
        if (managerDraftSaveSeqRef.current === seq) setManagerDraftSaveStatus('failed');
        if (!silent) {
          setMutationToast({ severity: 'error', message: e?.message ?? 'Could not save draft.' });
        }
        if (status === 409) setPhaseConflict((p) => ({ ...p, manager: true }));
      }
    },
    [clearError, effectiveEmployeeId, flushCommentDraftsToAnswers, reviewId, saveManagerEvaluationDraft, showManagerSaveDraft]
  );

  const handleSaveDraft = async () => {
    if (!reviewId || isManagerMode || isHrMode) return;
    clearError();
    const mergedAnswers = flushCommentDraftsToAnswers();
    try {
      await dispatch(saveEvaluation({ reviewId, answers: mergedAnswers })).unwrap();
    } catch (e) {
      const status = e?.status;
      const msg = e?.message ?? 'Could not save draft.';
      setMutationToast({ severity: 'error', message: msg });
      if (status === 409) setPhaseConflict((p) => ({ ...p, self: true }));
    }
  };

  const handleSubmit = () => {
    if (isManagerMode && !effectiveEmployeeId) return;
    const mergedAnswers = flushCommentDraftsToAnswers();
    const canSubmitMerged = isHrMode
      ? Object.keys(validateHrSubmitInput({ hrOverallRating, hrComments }, hrRatingScale)).length === 0
      : isManagerMode
        ? isFormComplete(mergedAnswers, allQuestions)
        : allQuestions.every((q) => {
            const a = mergedAnswers[q.id] || {};
            return Boolean(a?.rating) && getTextLen(a?.comment) >= SELF_EVAL_MIN_ANSWER_LEN;
          });

    if (isHrMode) {
      const nextErrors = validateHrSubmitInput({ hrOverallRating, hrComments }, hrRatingScale);
      setHrValidation(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;
    }
    if (!canSubmitMerged) {
      if (isHrMode) {
        setMutationToast({
          severity: 'warning',
          message: 'Please provide the required HR overall rating (and comments if applicable) before submitting.',
        });
        return;
      }

      if (!isManagerMode && !isHrMode) setSelfSubmitValidationOn(true);
      const unansweredCount = allQuestions.filter((q) => {
        const a = mergedAnswers[q.id] || {};
        if (isManagerMode) return !(a?.rating && String(a?.comment || '').trim());
        return !(a?.rating && getTextLen(a?.comment) >= SELF_EVAL_MIN_ANSWER_LEN);
      }).length;

      setMutationToast({
        severity: 'warning',
        message:
          unansweredCount > 0
            ? `Please complete ${unansweredCount} more question${unansweredCount === 1 ? '' : 's'} (rating + at least ${SELF_EVAL_MIN_ANSWER_LEN} characters) before submitting.`
            : 'Please complete all required fields before submitting.',
      });
      return;
    }
    setConfirmOpen(true);
  };

  const confirmSubmit = async () => {
    setConfirmOpen(false);
    if (isManagerMode && !effectiveEmployeeId) {
      setMutationToast({
        severity: 'error',
        message: 'Missing employee id for this assignment. Reload from the team list.',
      });
      return;
    }
    clearError();
    const mergedAnswers = flushCommentDraftsToAnswers();
    try {
      if (isHrMode) {
        await dispatch(
          submitHrReview({
            assignmentId: reviewId,
            hrOverallRating: Number(hrOverallRating),
            hrComments,
          })
        ).unwrap();
        setMutationToast({
          severity: 'success',
          message:
            'HR review submitted. Use “Publish results” when the employee should see their final result.',
        });
        await reloadAssignment();
        return;
      } else if (isManagerMode) {
        await dispatch(
          submitManagerEvaluation({
            employeeId: effectiveEmployeeId,
            reviewId,
            answers: mergedAnswers,
          })
        ).unwrap();
      } else {
        await dispatch(submitEvaluation({ reviewId, answers: mergedAnswers })).unwrap();
      }
      if (!isHrMode) navigate('/performance');
    } catch (e) {
      const status = e?.status;
      const msg = e?.message ?? 'Submission failed.';
      setMutationToast({ severity: 'error', message: msg });
      if (status === 409) {
        if (isHrMode) setPhaseConflict((p) => ({ ...p, hr: true }));
        else if (isManagerMode) setPhaseConflict((p) => ({ ...p, manager: true }));
        else setPhaseConflict((p) => ({ ...p, self: true }));
      }
    }
  };

  const handlePublishResults = async () => {
    if (!reviewId || publishBusy) return;
    setPublishBusy(true);
    try {
      await publishRatings(reviewId);
      setMutationToast({
        severity: 'success',
        message: 'Results are now visible to the employee.',
      });
      await reloadAssignment();
    } catch (e) {
      setMutationToast({ severity: 'error', message: getApiErrorMessage(e) });
    } finally {
      setPublishBusy(false);
    }
  };

  const handleUnpublishResults = async () => {
    if (!reviewId || publishBusy) return;
    setUnpublishConfirmOpen(false);
    setPublishBusy(true);
    try {
      await unpublishAssignmentResults(reviewId);
      setMutationToast({
        severity: 'success',
        message: 'Results are no longer visible to the employee.',
      });
      await reloadAssignment();
    } catch (e) {
      setMutationToast({ severity: 'error', message: getApiErrorMessage(e) });
    } finally {
      setPublishBusy(false);
    }
  };

  const submitDisabled =
    (isManagerMode && (!effectiveEmployeeId || managerFieldsReadOnly)) ||
    (!isManagerMode && !isHrMode && selfFieldsReadOnly) ||
    (isHrMode && hrFieldsReadOnly);

  if (isLoading) return <AppLoader message="Loading review form..." />;

  if (modeHr && !isAdmin) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
          HR Review
        </Typography>
        <Alert severity="error">HR review submission is restricted to administrators.</Alert>
      </Box>
    );
  }

  if (!review) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <IconButton size="small" onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" fontWeight={700}>
            {isManagerMode ? 'Manager Evaluation' : isHrMode ? 'HR Review' : 'Self Evaluation'}
          </Typography>
        </Box>
        <Alert severity="error">{loadError || 'Unable to load this review.'}</Alert>
      </Box>
    );
  }

  if (!review.sections.length) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <IconButton size="small" onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6">{review.formName}</Typography>
        </Box>
        <Alert severity="info">This review form has no focus areas or questions yet.</Alert>
      </Box>
    );
  }

  const pageTitle = isHrMode
    ? 'HR Review'
    : isManagerMode
      ? 'Manager Evaluation'
      : selfFieldsReadOnly
        ? 'My submission'
        : 'Self Evaluation';

  const subtitleExtra =
    `${review.formName}${isManagerMode ? ' - Provide your assessment for this team member' : ''}${
      isHrMode ? ' - Record HR evaluation for this assignment' : ''
    }`;

  return (
    <Box>
      <PageHeader
        title={pageTitle}
        subtitle={subtitleExtra}
        startAdornment={
          <IconButton size="small" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowBackIcon />
          </IconButton>
        }
      />
      

      <AppCard sx={{ p: 2.5, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="body2" fontWeight={500}>
            {isHrMode
              ? `Progress: ${hrCompletionPct === 100 ? 'Overall rating provided' : 'Overall rating pending'}`
              : `Progress: ${
                  isManagerMode
                    ? Object.keys(answers).filter(
                        (k) => answers[k]?.rating && getTextLen(answers[k]?.comment) > 0,
                      ).length
                    : selfAnsweredCountMinLen
                } of ${allQuestions.length} questions answered`}
          </Typography>
          <Stack direction="row" spacing={1}>
            {isManagerMode && showManagerSaveDraft && (
              <Chip
                label={
                  managerDraftSaveStatus === 'saving'
                    ? 'Saving…'
                    : managerDraftSaveStatus === 'saved'
                      ? 'Saved'
                      : managerDraftSaveStatus === 'failed'
                        ? 'Save failed'
                        : 'Draft'
                }
                size="small"
                variant="filled"
                sx={(theme) => ({
                  ...progressCardChipShell(theme),
                  ...(managerDraftSaveStatus === 'saved'
                    ? {
                        bgcolor: alpha(theme.palette.success.main, 0.16),
                        color: theme.palette.success.dark,
                        border: '1px solid',
                        borderColor: alpha(theme.palette.success.main, 0.42),
                      }
                    : managerDraftSaveStatus === 'failed'
                      ? {
                          bgcolor: alpha(theme.palette.error.main, 0.12),
                          color: theme.palette.error.dark,
                          border: '1px solid',
                          borderColor: alpha(theme.palette.error.main, 0.4),
                        }
                      : managerDraftSaveStatus === 'saving'
                        ? {
                            bgcolor: alpha(theme.palette.info.main, 0.14),
                            color: theme.palette.info.dark,
                            border: '1px solid',
                            borderColor: alpha(theme.palette.info.main, 0.38),
                          }
                        : {
                            bgcolor: alpha(theme.palette.grey[500], 0.12),
                            color: theme.palette.text.secondary,
                            border: '1px solid',
                            borderColor: alpha(theme.palette.grey[500], theme.palette.mode === 'dark' ? 0.35 : 0.28),
                          }),
                })}
              />
            )}
            {hasOverallRating && (isHrMode || isManagerMode || hrResultsVisible) && (
              <Chip
                label={`Overall rating: ${overallRatingNum.toFixed(2)}`}
                size="small"
                variant="filled"
                sx={(theme) => ({
                  ...progressCardChipShell(theme),
                  bgcolor: alpha(theme.palette.secondary.main, 0.15),
                  color: theme.palette.secondary.dark,
                  border: '1px solid',
                  borderColor: alpha(theme.palette.secondary.main, 0.4),
                })}
              />
            )}
            <Chip
              label={`${effectiveCompletionPct}% complete`}
              size="small"
              variant="filled"
              sx={(theme) => ({
                ...progressCardChipShell(theme),
                ...(effectiveCompletionPct === 100
                  ? {
                      bgcolor: alpha(theme.palette.success.main, 0.16),
                      color: theme.palette.success.dark,
                      border: '1px solid',
                      borderColor: alpha(theme.palette.success.main, 0.42),
                    }
                  : {
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      color: theme.palette.primary.dark,
                      border: '1px solid',
                      borderColor: alpha(theme.palette.primary.main, 0.38),
                    }),
              })}
            />
            <Chip
              label={`Rating scale: ${review.ratingScale}-point`}
              size="small"
              variant="filled"
              sx={(theme) => ({
                ...progressCardChipShell(theme),
                bgcolor: alpha(theme.palette.primary.main, 0.06),
                color: theme.palette.text.secondary,
                border: '1px solid',
                borderColor: alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.9 : 1),
              })}
            />
          </Stack>
        </Box>
        <LinearProgress
          variant="determinate"
          value={effectiveCompletionPct}
          sx={{ borderRadius: 1, height: 8 }}
          color={effectiveCompletionPct === 100 ? 'success' : 'primary'}
        />
      </AppCard>

      {!review.allReviewsSubmitted && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {isManagerMode
            ? 'You can edit your manager review below. Employee self responses are visible when submitted; HR results appear when available.'
            : isHrMode
              ? 'Provide overall HR rating and final comments. Per-question HR inputs are no longer required.'
              : 'Manager/HR reviews are visible to you only after results are published. You always see your own responses below.'}
        </Alert>
      )}

      {isHrMode && !hrFieldsReadOnly && (
        <AppCard sx={{ p: 2.5, mb: 2 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" color="text.secondary" component="label" display="block" sx={{ mb: 0.5 }}>
                HR Overall Rating (0–{hrRatingScale})
                <Box component="span" sx={{ color: 'error.main', ml: 0.25 }} aria-hidden>
                  *
                </Box>
              </Typography>
              <Rating
                name="hr-overall-rating"
                value={hrOverallRatingStarValue}
                onChange={(_, newValue) => {
                  const next =
                    newValue == null ? '' : String(Math.round(Number(newValue) * 10) / 10);
                  setHrOverallRating(next);
                  if (hrValidation.hrOverallRating) {
                    setHrValidation((prev) => ({
                      ...prev,
                      ...validateHrSubmitInput({ hrOverallRating: next, hrComments }, hrRatingScale),
                    }));
                  }
                }}
                max={hrRatingScale}
                precision={0.1}
                size="large"
                sx={{
                  '& .MuiRating-iconFilled': {
                    filter: 'drop-shadow(0 2px 4px rgba(79, 70, 229, 0.25))',
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                {hrOverallRatingStarCaption}
              </Typography>
              <FormHelperText error={!!hrValidation.hrOverallRating} sx={{ mx: 0 }}>
                {hrValidation.hrOverallRating ||
                  `Click the stars to set a score from 0 to ${hrRatingScale} (0.1 steps).`}
              </FormHelperText>
            </Box>
            <TextField
              label="Final HR Comments"
              value={hrComments}
              onChange={(e) => {
                const next = e.target.value;
                setHrComments(next);
                if (hrValidation.hrComments) {
                  setHrValidation((prev) => ({
                    ...prev,
                    ...validateHrSubmitInput({ hrOverallRating, hrComments: next }, hrRatingScale),
                  }));
                }
              }}
              fullWidth
              multiline
              minRows={3}
              size="small"
              inputProps={{ maxLength: 2000 }}
              error={!!hrValidation.hrComments}
              helperText={hrValidation.hrComments || `${hrComments.length}/2000`}
            />
          </Stack>
        </AppCard>
      )}

      {showHrOverallSummary && (!isHrMode || hrFieldsReadOnly) && (
        <AppCard sx={{ p: 2.5, mb: 2 }}>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            HR Overall
          </Typography>
          <Stack spacing={1}>
            {hasHrOverall && (
              <Rating
                name="hr-overall-summary-rating"
                value={Math.min(
                  hrRatingScale,
                  Math.max(0, Math.round(Number(review.hrOverallScore) * 10) / 10),
                )}
                max={hrRatingScale}
                readOnly
                precision={0.1}
                size="large"
                sx={{
                  '& .MuiRating-iconFilled': {
                    filter: 'drop-shadow(0 2px 4px rgba(79, 70, 229, 0.25))',
                  },
                }}
              />
            )}
            <Typography variant="body2">
              Score:{' '}
              <strong>
                {hasHrOverall ? `${Number(review.hrOverallScore).toFixed(1)} / ${hrRatingScale}` : '-'}
              </strong>
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ whiteSpace: 'pre-wrap' }}
            >
              {hasHrOverallComments ? String(review.hrComments).trim() : '-'}
            </Typography>
          </Stack>
        </AppCard>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isManagerMode && !effectiveEmployeeId && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Missing employee id for this assignment - open this review from the team list so the assignment employee is
          set correctly.
        </Alert>
      )}

      {!isManagerMode && !isHrMode && !selfFieldsReadOnly && (
        <Alert severity="warning" sx={{ mb: 2 }} icon={false}>
          Once submitted, your self-review cannot be edited.
        </Alert>
      )}

      {selfFieldsReadOnly && !isManagerMode && !isHrMode && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Your self-evaluation is on file. Ratings and comments cannot be edited.
        </Alert>
      )}

      {managerFieldsReadOnly && isManagerMode && !error && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This manager review was already submitted. Fields are read-only.
        </Alert>
      )}

      {hrFieldsReadOnly && isHrMode && !error && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This HR review was already submitted. Fields are read-only.
        </Alert>
      )}

      {phaseConflict.self && !isManagerMode && !isHrMode && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This phase can no longer be edited (it may have been submitted from another session).
        </Alert>
      )}
      {phaseConflict.manager && isManagerMode && !error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Manager review can no longer be edited.
        </Alert>
      )}
      {phaseConflict.hr && isHrMode && !error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          HR review can no longer be edited.
        </Alert>
      )}
      {review.sections.map((section, sIdx) => {
        const sectionAnswered = section.questions.filter(
          (q) => answers[q.id]?.rating && getTextLen(answers[q.id]?.comment) > 0,
        ).length;
        const sectionWeight = formatWeightage(section.weightage);

        return (
          <Accordion
            key={section.focusAreaId}
            expanded={expandedFocusAreaId === section.focusAreaId}
            onChange={(_, isExpanded) =>
              setExpandedFocusAreaId(isExpanded ? section.focusAreaId : false)
            }
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '8px !important',
              mb: 2,
              '&:before': { display: 'none' },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ bgcolor: 'grey.50', borderRadius: '8px 8px 0 0' }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 2,
                  flex: 1,
                  minWidth: 0,
                  pr: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
                  <Typography fontWeight={600} sx={{ wordBreak: 'break-word' }}>
                    {section.focusAreaName}
                  </Typography>
                  <Chip
                    label={`${sectionAnswered} / ${section.questions.length}`}
                    size="small"
                    color={sectionAnswered === section.questions.length ? 'success' : 'default'}
                    sx={{ flexShrink: 0 }}
                  />
                </Box>
                {sectionWeight != null && (
                  <Chip
                    label={`Weightage: ${sectionWeight} x`}
                    size="small"
                    variant="outlined"
                    sx={weightageChipSx}
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 3 }}>
              {section.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                  {section.description}
                </Typography>
              )}
              <Stack spacing={3}>
                {section.questions.map((question, qIdx) => (
                  <EvaluationQuestionCard
                    key={question.id}
                    question={question}
                    qAns={answers[question.id] || {}}
                    questionHtml={questionHtmlById[question.id] ?? ''}
                    qIdx={qIdx}
                    ratingScale={review.ratingScale}
                    isManagerMode={isManagerMode}
                    isHrMode={isHrMode}
                    selfFieldsReadOnly={selfFieldsReadOnly}
                    managerFieldsReadOnly={managerFieldsReadOnly}
                    hrResultsVisible={hrResultsVisible}
                    selfSubmitValidationOn={selfSubmitValidationOn}
                    hydrationKey={answersHydrationKey}
                    registerCommentDraftGetter={registerCommentDraftGetter}
                    onUpdateAnswer={updateAnswer}
                  />
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        );
      })}

      <Box
        sx={{
          position: 'sticky',
          bottom: 0,
          zIndex: 2,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 2,
          mt: 3,
          py: 2,
          bgcolor: 'background.default',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        {showManagerSaveDraft && (
          <AppButton
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={() => saveManagerDraftNow({ silent: false })}
            disabled={managerFieldsReadOnly}
          >
            Save Draft
          </AppButton>
        )}
        {showSaveDraft && (
          <AppButton
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={handleSaveDraft}
            loading={isSaving}
            disabled={selfFieldsReadOnly}
          >
            Save as Draft
          </AppButton>
        )}
        <AppButton
          startIcon={<CheckIcon />}
          onClick={handleSubmit}
          disabled={submitDisabled}
          loading={isSaving}
        >
          {isHrMode ? 'Submit HR Review' : isManagerMode ? 'Submit Manager Evaluation' : 'Submit Self Evaluation'}
        </AppButton>
      </Box>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Submission</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {isHrMode ? (
              <>
                Submit the <strong>HR Review</strong> for this assignment? This action cannot be undone.
              </>
            ) : isManagerMode ? (
              <>
                Are you sure you want to submit your <strong>Manager Evaluation</strong>? This action cannot be undone.
              </>
            ) : (
              <>
                Are you sure you want to submit your <strong>Self Evaluation</strong>? Once submitted, you will not be
                able to make changes.
              </>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <AppButton variant="outlined" startIcon={null} onClick={() => setConfirmOpen(false)}>
            Cancel
          </AppButton>
          <AppButton startIcon={null} onClick={confirmSubmit} loading={isSaving}>
            Yes, Submit
          </AppButton>
        </DialogActions>
      </Dialog>

      <AppSnackbar
        open={!!successMessage}
        onClose={clearSuccess}
        message={successMessage}
      />

      <AppSnackbar
        open={!!mutationToast}
        onClose={() => setMutationToast(null)}
        message={mutationToast?.message}
        severity={mutationToast?.severity || 'info'}
        autoHideDuration={5000}
      />
    </Box>
  );
};

export default SelfEvaluationForm;
