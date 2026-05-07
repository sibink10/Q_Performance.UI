// src/pages/employee/SelfEvaluationForm.jsx
// Employee: self-evaluation; Manager: team review; Admin: HR review (mode=hr).
// Assignment detail: progressive reveal via allReviewsSubmitted + per-question phase snapshots.
// @ts-nocheck

import { useEffect, useState, useCallback } from 'react';
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
    Snackbar,
    IconButton,
    Divider,
    Rating,
    FormHelperText,
  } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import CheckIcon from '@mui/icons-material/Check';
import usePerformance from '../../hooks/usePerformance';
import useAuth from '../../hooks/useAuth';
import AppButton from '../../components/common/AppButton';
import { AppCard } from '../../components/common';
import { AppLoader, RatingInput, PageHeader } from '../../components/common/index.jsx';
import {
  calculateCompletionPercentage,
  isFormComplete,
  mapAssignmentForSelfEvaluation,
  isAssignmentPhaseSubmitted,
  getApiErrorMessage,
} from '../../utils/helpers';
import performanceService from '../../services/performanceService';
import { validateHrSubmitInput } from '../../utils/performanceSubmission';
import {
  fetchAssignmentById,
  saveEvaluation,
  submitEvaluation,
  submitManagerEvaluation,
  submitHrReview,
} from '../../app/state/slices/performanceThunks';
import { clearError as clearPerformanceError } from '../../app/state/slices/performanceSlice';

/** Read-only snapshot (self / manager / HR). */
const PhaseSnapshotDisplay = ({ label, snapshot, ratingScale }) => {
  if (!snapshot) return null;
  return (
    <Box sx={{ pt: 0.5 }}>
      {label ? (
        <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
          {label}
        </Typography>
      ) : null}
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        Rating:{' '}
        <strong>
          {snapshot.rating}/{ratingScale}
        </strong>
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
        {snapshot.comment?.trim() ? snapshot.comment : '—'}
      </Typography>
    </Box>
  );
};

const SelfEvaluationForm = () => {
  const { reviewId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAdmin } = useAuth();

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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(() => !!reviewId);
  const [loadError, setLoadError] = useState(null);
  /** Locks UI after 409 Conflict (phase already submitted). */
  const [phaseConflict, setPhaseConflict] = useState({ self: false, manager: false, hr: false });
  const [mutationToast, setMutationToast] = useState(null);
  const [hrOverallRating, setHrOverallRating] = useState('');
  const [hrComments, setHrComments] = useState('');
  const [hrValidation, setHrValidation] = useState({});
  const [publishBusy, setPublishBusy] = useState(false);
  const [unpublishConfirmOpen, setUnpublishConfirmOpen] = useState(false);

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
        const resultAction = await dispatch(fetchAssignmentById(reviewId));
        if (cancelled) return;
        if (fetchAssignmentById.fulfilled.match(resultAction)) {
          const mapped = mapAssignmentForSelfEvaluation(resultAction.payload);
          if (mapped) {
            setReview(mapped);
          } else {
            setLoadError('Invalid assignment or review form data.');
          }
        } else {
          const p = resultAction.payload;
          const rej = typeof p === 'string' ? p : p?.message;
          setLoadError(rej || 'Failed to load assignment.');
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
    setHrOverallRating(
      review.hrOverallRating != null && review.hrOverallRating !== ''
        ? String(review.hrOverallRating)
        : ''
    );
    setHrComments(
      review.hrComments != null && String(review.hrComments).trim() !== ''
        ? String(review.hrComments)
        : ''
    );
    setHrValidation({});
  }, [review, pickInitialAnswers, modeManager, modeHr]);

  const allQuestions = review ? review.sections.flatMap((s) => s.questions) : [];
  const hrRatingScale =
    Number.isFinite(Number(review?.ratingScale)) && Number(review?.ratingScale) > 0
      ? Number(review.ratingScale)
      : 10;
  const completionPct = calculateCompletionPercentage(answers, allQuestions);
  const hrCompletionPct =
    hrOverallRating !== '' && Number.isFinite(Number(hrOverallRating)) ? 100 : 0;
  const effectiveCompletionPct = isHrMode ? hrCompletionPct : completionPct;
  const canSubmit = isHrMode
    ? Object.keys(validateHrSubmitInput({ hrOverallRating, hrComments }, hrRatingScale)).length === 0
    : isFormComplete(answers, allQuestions);

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

  const selfFieldsReadOnly =
    !isManagerMode && !isHrMode && (selfPhaseComplete || phaseConflict.self);

  const managerFieldsReadOnly = isManagerMode && (managerPhaseComplete || phaseConflict.manager);
  const hrFieldsReadOnly = isHrMode && (hrPhaseComplete || phaseConflict.hr);

  const showSaveDraft = !isManagerMode && !isHrMode && !selfFieldsReadOnly;

  const reloadAssignment = useCallback(async () => {
    if (!reviewId) return;
    const resultAction = await dispatch(fetchAssignmentById(reviewId));
    if (fetchAssignmentById.fulfilled.match(resultAction)) {
      const mapped = mapAssignmentForSelfEvaluation(resultAction.payload);
      if (mapped) setReview(mapped);
    }
  }, [reviewId, dispatch]);

  const updateAnswer = (questionId, field, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], [field]: value },
    }));
  };

  const handleSaveDraft = async () => {
    if (!reviewId || isManagerMode || isHrMode) return;
    clearError();
    try {
      await dispatch(saveEvaluation({ reviewId, answers })).unwrap();
    } catch (e) {
      const status = e?.status;
      const msg = e?.message ?? 'Could not save draft.';
      setMutationToast({ severity: 'error', message: msg });
      if (status === 409) setPhaseConflict((p) => ({ ...p, self: true }));
    }
  };

  const handleSubmit = () => {
    if (isManagerMode && !effectiveEmployeeId) return;
    if (isHrMode) {
      const nextErrors = validateHrSubmitInput({ hrOverallRating, hrComments }, hrRatingScale);
      setHrValidation(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;
    }
    if (!canSubmit) return;
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
            answers,
          })
        ).unwrap();
      } else {
        await dispatch(submitEvaluation({ reviewId, answers })).unwrap();
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
      await performanceService.publishRatings(reviewId);
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
      await performanceService.unpublishAssignmentResults(reviewId);
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

  const renderRevealPlaceholder = () => (
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
      Other reviews will appear after everyone submits.
    </Typography>
  );

  const renderNonEditablePhase = (snapshot) => {
    if (snapshot) {
      return <PhaseSnapshotDisplay label="" snapshot={snapshot} ratingScale={review.ratingScale} />;
    }
    if (review.allReviewsSubmitted) {
      return (
        <Typography variant="caption" color="text.secondary">
          —
        </Typography>
      );
    }
    return renderRevealPlaceholder();
  };

  const renderSelfColumn = (question, qAns) => {
    if (isManagerMode || isHrMode) {
      const snap = question.selfReview;
      if (snap || review.allReviewsSubmitted) {
        return renderNonEditablePhase(snap);
      }
      return renderRevealPlaceholder();
    }

    if (selfFieldsReadOnly) {
      const snap =
        question.selfReview ||
        (qAns?.rating
          ? { rating: Number(qAns.rating), comment: String(qAns.comment || '') }
          : null);
      if (snap?.rating || String(snap?.comment || '').trim()) {
        return <PhaseSnapshotDisplay label="Your response" snapshot={snap} ratingScale={review.ratingScale} />;
      }
      return (
        <Typography variant="caption" color="text.secondary">
          No saved response.
        </Typography>
      );
    }

    return (
      <>
        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>
          Your response
        </Typography>
        <Box sx={{ mb: 2 }}>
          <RatingInput
            label={`Rating (${review.ratingScale}-point scale)`}
            value={qAns?.rating || 0}
            onChange={(v) => updateAnswer(question.id, 'rating', v)}
            scale={review.ratingScale}
            readOnly={false}
          />
        </Box>
        <TextField
          label="Comments "
          placeholder="Provide specific examples and justification for your rating..."
          value={qAns?.comment || ''}
          onChange={(e) => updateAnswer(question.id, 'comment', e.target.value)}
          fullWidth
          multiline
          minRows={2}
          size="small"
          required
          error={!!(qAns?.rating && !qAns?.comment?.trim())}
          helperText={
            qAns?.rating && !qAns?.comment?.trim() ? 'Comment is required before submission' : ''
          }
        />
      </>
    );
  };

  const renderManagerColumn = (question, qAns) => {
    if (!isManagerMode) {
      return renderNonEditablePhase(question.managerReview);
    }
    if (!managerFieldsReadOnly) {
      return (
        <>
          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>
            Manager review
          </Typography>
          <Box sx={{ mb: 2 }}>
            <RatingInput
              label={`Rating (${review.ratingScale}-point scale)`}
              value={qAns?.rating || 0}
              onChange={(v) => updateAnswer(question.id, 'rating', v)}
              scale={review.ratingScale}
              readOnly={false}
            />
          </Box>
          <TextField
            label="Comments "
            value={qAns?.comment || ''}
            onChange={(e) => updateAnswer(question.id, 'comment', e.target.value)}
            fullWidth
            multiline
            minRows={2}
            size="small"
            required
            error={!!(qAns?.rating && !qAns?.comment?.trim())}
            helperText={
              qAns?.rating && !qAns?.comment?.trim() ? 'Comment is required before submission' : ''
            }
          />
        </>
      );
    }
    return renderNonEditablePhase(
      question.managerReview ||
        (qAns?.rating ? { rating: Number(qAns.rating), comment: String(qAns.comment || '') } : null)
    );
  };

  const renderHrColumn = (question, qAns) => {
    if (!isHrMode) {
      return renderNonEditablePhase(question.hrReview);
    }
    if (!hrFieldsReadOnly) return renderNonEditablePhase(question.hrReview);
    return renderNonEditablePhase(
      question.hrReview ||
        (qAns?.rating ? { rating: Number(qAns.rating), comment: String(qAns.comment || '') } : null)
    );
  };

  const submitDisabled =
    !canSubmit ||
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

  const pageTitle = isHrMode ? 'HR Review' : isManagerMode ? 'Manager Evaluation' : 'Self Evaluation';

  const subtitleExtra =
    `${review.formName}${isManagerMode ? ' — Provide your assessment for this team member' : ''}${
      isHrMode ? ' — Record HR evaluation for this assignment' : ''
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
      {isManagerMode && effectiveEmployeeId && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2, mt: -2 }}>
          Employee id (assignment):{' '}
          <Box component="span" sx={{ fontFamily: 'monospace' }}>
            {effectiveEmployeeId}
          </Box>
        </Typography>
      )}

      <AppCard sx={{ p: 2.5, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="body2" fontWeight={500}>
            {isHrMode
              ? `Progress: ${hrCompletionPct === 100 ? 'Overall rating provided' : 'Overall rating pending'}`
              : `Progress: ${
                  Object.keys(answers).filter((k) => answers[k]?.rating && answers[k]?.comment?.trim())
                    .length
                } of ${allQuestions.length} questions answered`}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Chip
              label={`${effectiveCompletionPct}% complete`}
              color={effectiveCompletionPct === 100 ? 'success' : 'primary'}
              size="small"
              variant="outlined"
            />
            <Chip label={`Rating scale: ${review.ratingScale}-point`} size="small" variant="outlined" />
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
            ? 'You can edit your manager review below. Self and HR responses stay hidden until everyone has submitted.'
            : isHrMode
              ? 'Provide overall HR rating and final comments. Per-question HR inputs are no longer required.'
              : 'Manager and HR reviews stay hidden until everyone has submitted. You always see your own responses below.'}
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

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isManagerMode && !effectiveEmployeeId && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Missing employee id for this assignment — open this review from the team list so the assignment employee is
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

      {managerFieldsReadOnly && isManagerMode && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This manager review was already submitted. Fields are read-only.
        </Alert>
      )}

      {hrFieldsReadOnly && isHrMode && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This HR review was already submitted. Fields are read-only.
        </Alert>
      )}

      {phaseConflict.self && !isManagerMode && !isHrMode && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This phase can no longer be edited (it may have been submitted from another session).
        </Alert>
      )}
      {phaseConflict.manager && isManagerMode && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Manager review can no longer be edited.
        </Alert>
      )}
      {phaseConflict.hr && isHrMode && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          HR review can no longer be edited.
        </Alert>
      )}
      {review.sections.map((section, sIdx) => {
        const sectionAnswered = section.questions.filter(
          (q) => answers[q.id]?.rating && answers[q.id]?.comment?.trim()
        ).length;

        return (
          <Accordion
            key={section.focusAreaId}
            defaultExpanded={sIdx === 0}
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                <Typography fontWeight={600}>{section.focusAreaName}</Typography>
                <Chip
                  label={`${sectionAnswered} / ${section.questions.length}`}
                  size="small"
                  color={sectionAnswered === section.questions.length ? 'success' : 'default'}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 3 }}>
              {section.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                  {section.description}
                </Typography>
              )}
              <Stack spacing={3}>
                {section.questions.map((question, qIdx) => {
                  const qAns = answers[question.id] || {};
                  const isAnswered = qAns.rating && qAns.comment?.trim();

                  return (
                    <Box
                      key={question.id}
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: isAnswered ? 'success.light' : 'divider',
                        bgcolor: isAnswered ? 'success.50' : 'background.paper',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
                        <Chip
                          label={`Q${qIdx + 1}`}
                          size="small"
                          color={isAnswered ? 'success' : 'default'}
                          sx={{ flexShrink: 0, mt: 0.3 }}
                        />
                        <Typography variant="body2" fontWeight={500}>
                          {question.text}
                        </Typography>
                      </Box>

                      <Stack spacing={0} divider={<Divider flexItem sx={{ borderColor: 'divider' }} />}>
                        <Box sx={{ pt: 0, pb: 2 }}>
                          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            Self
                          </Typography>
                          {renderSelfColumn(question, qAns)}
                        </Box>
                        <Box sx={{ py: 2 }}>
                          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            Manager
                          </Typography>
                          {renderManagerColumn(question, qAns)}
                        </Box>
                        <Box sx={{ pt: 2, pb: 0 }}>
                          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            HR
                          </Typography>
                          {renderHrColumn(question, qAns)}
                        </Box>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            </AccordionDetails>
          </Accordion>
        );
      })}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
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
          {isHrMode ? 'Submit HR Review' : isManagerMode ? 'Submit Manager Evaluation' : 'Submit Self-Evaluation'}
        </AppButton>
      </Box>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Submission</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {isHrMode
              ? 'Submit the HR review for this assignment? This action cannot be undone.'
              : isManagerMode
                ? 'Are you sure you want to submit your manager evaluation? This action cannot be undone.'
                : 'Are you sure you want to submit your self-evaluation? Once submitted, you will not be able to make changes.'}
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

      <Snackbar
        open={!!mutationToast}
        autoHideDuration={5000}
        onClose={() => setMutationToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={mutationToast?.severity || 'info'}
          onClose={() => setMutationToast(null)}
        >
          {mutationToast?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SelfEvaluationForm;
