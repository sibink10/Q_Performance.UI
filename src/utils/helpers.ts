// @ts-nocheck
// src/utils/helpers.js
// Reusable utility functions used across the Performance module

import dayjs from 'dayjs';
import {
  resolveBandAccentColor,
  resolveBandIconKey,
  isValidHex6,
} from './ratingBandIcons';
import { richTextHtmlToPlainText } from './richText';

/**
 * Calculate the completion percentage of an evaluation form.
 * @param {Object} answers - Map of questionId → {rating, comment}
 * @param {Array}  questions - Full list of questions in the form
 */
export const calculateCompletionPercentage = (answers = {}, questions = []) => {
  if (!questions.length) return 0;
  const answered = questions.filter(
    (q) => answers[q.id]?.rating && answers[q.id]?.comment?.trim()
  ).length;
  return Math.round((answered / questions.length) * 100);
};

/**
 * Calculate days remaining until a deadline.
 * Returns negative if deadline has passed.
 * Returns null if there is no deadline or the value is not a valid date (avoids NaN in UI).
 */
export const getDaysRemaining = (deadline) => {
  if (deadline == null || deadline === '') return null;
  const d = dayjs(deadline);
  if (!d.isValid()) return null;
  return d.startOf('day').diff(dayjs().startOf('day'), 'day');
};

/**
 * Get urgency color for deadline display.
 * - Red if < 3 days
 * - Amber if < 7 days
 * - Default otherwise
 */
export const getDeadlineColor = (deadline) => {
  const days = getDaysRemaining(deadline);
  if (days == null) return 'default';
  if (days < 3) return 'error';
  if (days < 7) return 'warning';
  return 'default';
};

/**
 * Calculate overall performance score from evaluation answers.
 * Formula:
 *   Question score = rating × questionWeightage
 *   Focus Area score = sum(questionScores) × focusAreaWeightage
 *   Overall = weighted sum of all focus area scores
 */
export const calculateOverallScore = (focusAreas, answers, ratingScale) => {
  let totalWeightedScore = 0;
  let totalWeight = 0;

  focusAreas.forEach((fa) => {
    let focusAreaScore = 0;

    fa.questions.forEach((q) => {
      const answer = answers[q.id];
      if (answer?.rating) {
        focusAreaScore += answer.rating * (q.weightage || 1);
      }
    });

    totalWeightedScore += focusAreaScore * (fa.weightage || 1);
    totalWeight += (fa.weightage || 1) * fa.questions.length * ratingScale;
  });

  if (!totalWeight) return 0;
  return parseFloat(((totalWeightedScore / totalWeight) * ratingScale).toFixed(2));
};

/**
 * Weighted average of ratings by question weightage:
 *   sum(rating × weightage) / sum(weightage)
 * Questions without a rating are omitted. Missing or invalid weightage defaults to 1.
 */
export const calculateQuestionWeightedOverallRating = (questions, answers) => {
  let totalWeightedScore = 0;
  let totalWeight = 0;
  for (const q of questions) {
    const a = answers?.[q.id];
    const r = a?.rating;
    if (r == null || r === '') continue;
    const rating = Number(r);
    if (!Number.isFinite(rating)) continue;
    const wRaw = q?.weightage ?? q?.Weightage;
    const w =
      wRaw != null && wRaw !== '' && Number.isFinite(Number(wRaw)) && Number(wRaw) > 0
        ? Number(wRaw)
        : 1;
    totalWeightedScore += rating * w;
    totalWeight += w;
  }
  if (totalWeight === 0) {
    return { overall: null, totalWeightedScore: 0, totalWeight: 0 };
  }
  return {
    overall: totalWeightedScore / totalWeight,
    totalWeightedScore,
    totalWeight,
  };
};

/**
 * Format a date string for display.
 */
export const formatDate = (date, format = 'DD/MM/YYYY') =>
  date ? dayjs(date).format(format) : '-';

/**
 * Get a rating label based on score and scale.
 * e.g., 4.5/5 → "Exceeds Expectations"
 */
export const getRatingLabel = (score, scale) => {
  const percentage = (score / scale) * 100;
  if (percentage >= 90) return 'Outstanding';
  if (percentage >= 75) return 'Exceeds Expectations';
  if (percentage >= 60) return 'Meets Expectations';
  if (percentage >= 40) return 'Needs Improvement';
  return 'Unsatisfactory';
};

/**
 * Get color for a rating label.
 */
export const getRatingColor = (label) => {
  const map = {
    Outstanding: '#1b5e20',
    'Exceeds Expectations': '#2e7d32',
    'Meets Expectations': '#1565c0',
    'Needs Improvement': '#e65100',
    Unsatisfactory: '#b71c1c',
    'FAR EXCEEDS': '#00695c',
    EXCEEDS: '#2e7d32',
    MEETS: '#1565c0',
    BELOW: '#e65100',
  };
  return map[label] || '#333';
};

const SCORE_TOLERANCE = 0.001;

/** Default result bands for a rating scale (mirrors backend AppraisalRatingBandHelper). */
export const getDefaultRatingBands = (scale) => {
  const n = Number(scale) || 5;
  if (n === 4) {
    return [
      {
        minScore: 0.1,
        maxScore: 1.0,
        shortLabel: 'BELOW',
        title: 'Improvement Needed',
        description:
          'Performance gaps in results, behaviours, or adherence requiring focused improvement and support.',
        iconKey: 'trending_down',
        accentColor: '#e65100',
      },
      {
        minScore: 1.1,
        maxScore: 2.0,
        shortLabel: 'MEETS',
        title: 'Solid Contributor',
        description:
          'Consistently fulfills responsibilities, dependable execution, and adherence to processes.',
        iconKey: 'thumb_up',
        accentColor: '#1565c0',
      },
      {
        minScore: 2.1,
        maxScore: 3.0,
        shortLabel: 'EXCEEDS',
        title: 'Strong Performer',
        description:
          'High-quality results, reliability, effective collaboration and meaningful team contribution.',
        iconKey: 'workspace_premium',
        accentColor: '#2e7d32',
      },
      {
        minScore: 3.1,
        maxScore: 4.0,
        shortLabel: 'FAR EXCEEDS',
        title: 'Exceptional Performer',
        description:
          'Exceptional results, strong ownership, innovation & major positive impact beyond responsibilities.',
        iconKey: 'emoji_events',
        accentColor: '#00695c',
      },
    ];
  }

  const stepIconKeys = [
    'trending_down', 'thumb_up', 'show_chart', 'workspace_premium', 'emoji_events',
    'star', 'verified', 'rocket_launch', 'grade', 'military_tech',
  ];
  const stepColors = [
    '#e65100', '#1565c0', '#2e7d32', '#00695c', '#6a1b9a',
    '#c62828', '#ef6c00', '#00838f', '#4527a0', '#558b2f',
  ];
  const bands = [];
  for (let i = 0; i < n; i += 1) {
    const min = i === 0 ? 0.1 : Math.round((i + 0.1) * 10) / 10;
    const max = Math.round((i + 1) * 10) / 10;
    bands.push({
      minScore: min,
      maxScore: max,
      shortLabel: `LEVEL ${i + 1}`,
      title: `Rating level ${i + 1}`,
      description: `Overall score from ${min.toFixed(1)} to ${max.toFixed(1)} on the ${n}-point scale.`,
      iconKey: stepIconKeys[i % stepIconKeys.length],
      accentColor: stepColors[i % stepColors.length],
    });
  }
  return bands;
};

export const normalizeRatingBandRow = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  const minScore = Number(raw.minScore ?? raw.MinScore);
  const maxScore = Number(raw.maxScore ?? raw.MaxScore);
  if (!Number.isFinite(minScore) || !Number.isFinite(maxScore)) return null;
  return {
    minScore,
    maxScore,
    shortLabel: String(raw.shortLabel ?? raw.ShortLabel ?? '').trim(),
    title: String(raw.title ?? raw.Title ?? '').trim(),
    description: String(raw.description ?? raw.Description ?? '').trim(),
    iconKey: String(raw.iconKey ?? raw.IconKey ?? '').trim() || undefined,
    accentColor: String(raw.accentColor ?? raw.AccentColor ?? '').trim() || undefined,
  };
};

/** Validate rating bands client-side (same rules as backend). Returns error string or null. */
export const validateRatingBands = (bands, ratingScale) => {
  const scale = Number(ratingScale) || 5;
  const minAllowed = 0.1;

  if (!Array.isArray(bands) || bands.length === 0) {
    return 'At least one rating band is required.';
  }
  if (bands.length !== scale) {
    return `Rating bands count (${bands.length}) must match the rating scale (${scale}).`;
  }

  const ordered = [...bands].sort((a, b) => a.minScore - b.minScore);

  for (let i = 0; i < ordered.length; i += 1) {
    const band = ordered[i];
    if (!band.shortLabel) return `Band ${i + 1}: short label is required.`;
    if (!band.title) return `Band ${i + 1}: title is required.`;
    if (!band.description) return `Band ${i + 1}: description is required.`;
    if (band.accentColor && !isValidHex6(band.accentColor)) {
      return `Band ${i + 1}: accent color must be a valid #rrggbb hex value.`;
    }
    if (band.minScore > band.maxScore + SCORE_TOLERANCE) {
      return `Band ${i + 1}: min score cannot exceed max score.`;
    }
    if (band.minScore < minAllowed - SCORE_TOLERANCE || band.maxScore > scale + SCORE_TOLERANCE) {
      return `Band ${i + 1}: scores must stay within ${minAllowed} and ${scale}.`;
    }
    if (i > 0) {
      const prev = ordered[i - 1];
      if (band.minScore <= prev.maxScore - SCORE_TOLERANCE) {
        return `Band ${i + 1}: ranges must not overlap.`;
      }
      const expectedMin = Math.round((prev.maxScore + 0.1) * 10) / 10;
      if (Math.abs(band.minScore - expectedMin) > SCORE_TOLERANCE) {
        return `Band ${i + 1}: min score should be ${expectedMin.toFixed(1)} (previous max + 0.1).`;
      }
    }
  }

  if (Math.abs(ordered[0].minScore - minAllowed) > SCORE_TOLERANCE) {
    return `First band must start at ${minAllowed}.`;
  }
  if (Math.abs(ordered[ordered.length - 1].maxScore - scale) > SCORE_TOLERANCE) {
    return `Last band must end at ${scale}.`;
  }

  return null;
};

/**
 * Resolve configured rating band for an overall score.
 * Falls back to percentage-based label when no band matches.
 */
export const resolveRatingBand = (score, bands, scale) => {
  const numScore = Number(score);
  const numScale = Number(scale) || 5;
  const normalizedBands = (Array.isArray(bands) ? bands : [])
    .map(normalizeRatingBandRow)
    .filter(Boolean)
    .sort((a, b) => a.minScore - b.minScore);

  if (Number.isFinite(numScore) && normalizedBands.length > 0) {
    const matchIndex = normalizedBands.findIndex(
      (band) =>
        numScore + SCORE_TOLERANCE >= band.minScore &&
        numScore <= band.maxScore + SCORE_TOLERANCE
    );
    const match = matchIndex >= 0 ? normalizedBands[matchIndex] : null;
    if (match) {
      return {
        shortLabel: match.shortLabel,
        title: match.title,
        description: match.description,
        iconKey: resolveBandIconKey(match, matchIndex),
        color: resolveBandAccentColor(match, matchIndex, getRatingColor),
        isConfigured: true,
      };
    }
  }

  const fallbackLabel = getRatingLabel(numScore, numScale);
  return {
    shortLabel: fallbackLabel,
    title: fallbackLabel,
    description: '',
    iconKey: 'emoji_events',
    color: getRatingColor(fallbackLabel),
    isConfigured: false,
  };
};

export const getRatingBandColor = (band) => {
  if (!band) return '#333';
  if (band.color) return band.color;
  return getRatingColor(band.shortLabel || band.title || '');
};

/**
 * Check if all questions in a form are answered.
 */
export const isFormComplete = (answers, questions) => {
  return questions.every(
    (q) => answers[q.id]?.rating && answers[q.id]?.comment?.trim()
  );
};

/**
 * Generate financial year options around current year.
 */
export const getFinancialYears = (count = 5) => {
  const current = new Date().getFullYear();
  return Array.from({ length: count }, (_, i) => {
    const y = current - 2 + i;
    return { value: `${y}-${y + 1}`, label: `FY ${y}-${y + 1}` };
  });
};

/**
 * Performance APIs expect financial year query values like `FY 2026-2027`.
 * Dropdown state often stores `2026-2027` only - normalize before sending.
 */
export const normalizeFinancialYearForApi = (fy) => {
  if (fy == null || String(fy).trim() === '') return fy;
  const s = String(fy).trim();
  const stripped = s.replace(/^fy\s+/i, '').trim();
  if (/^\d{4}-\d{4}$/.test(stripped)) return `FY ${stripped}`;
  return /^fy\s+/i.test(s) ? `FY ${stripped}` : `FY ${s}`;
};

/**
 * Normalize API payloads that may return array data directly
 * or nested under a "data" key.
 */
export const toArrayFromPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

/**
 * Unwrap single-entity API responses shaped like `{ success, data: { ... } }`.
 * Leaves list responses alone when `data` is an array, and passes through plain objects.
 */
export const toEntityFromPayload = (payload) => {
  if (payload == null || typeof payload !== 'object') return payload;
  const nested = payload.data;
  if (
    nested !== undefined &&
    nested !== null &&
    typeof nested === 'object' &&
    !Array.isArray(nested)
  ) {
    return nested;
  }
  return payload;
};

/** Loose match for hyphenated hex Guid strings (.NET parses these as Guid). */
const GUID_STRING_REGEX = /^[\da-f]{8}-([\da-f]{4}-){3}[\da-f]{12}$/i;

/** True when `value` looks like a server Guid string (omit client temp ids otherwise). */
export const isLikelyGuidString = (value) =>
  typeof value === 'string' && GUID_STRING_REGEX.test(value.trim());

/** Merge lazy-loaded snapshot into existing; preserve commentStatus when either side has it. */
export const mergePhaseSnapshot = (prev, next) => {
  if (!next) return prev ?? null;
  if (!prev) return next;
  const prevStatus = prev.commentStatus ?? prev.CommentStatus;
  const nextStatus = next.commentStatus ?? next.CommentStatus;
  return {
    ...prev,
    ...next,
    commentStatus: prevStatus === true || nextStatus === true,
  };
};

/** Plain-text length > 0 after stripping HTML (matches backend CommentPlainTextHelper). */
export const hasPlainTextComment = (value) =>
  richTextHtmlToPlainText(String(value ?? '')).length > 0;

/** Parses API phase snapshot `{ rating?, comment?, commentStatus? }` (camelCase or PascalCase). */
export const normalizePhaseSnapshot = (snap) => {
  if (snap == null || typeof snap !== 'object') return null;
  const ratingRaw = snap.rating ?? snap.Rating;
  const commentRaw = snap.comment ?? snap.Comment ?? '';
  const commentStatusRaw = snap.commentStatus ?? snap.CommentStatus;
  const hasRating = ratingRaw != null && ratingRaw !== '' && !Number.isNaN(Number(ratingRaw));
  const hasCommentText = hasPlainTextComment(commentRaw);
  const commentOmittedOnPayload = String(commentRaw).trim() === '';
  const trustedApiCommentStatus = commentStatusRaw === true && commentOmittedOnPayload;
  if (!hasRating && !hasCommentText && !trustedApiCommentStatus) return null;
  return {
    rating: hasRating ? Number(ratingRaw) : 0,
    comment: String(commentRaw || ''),
    commentStatus: hasCommentText || trustedApiCommentStatus,
  };
};

/** True when a phase snapshot has a valid rating and an existing comment (via commentStatus or comment text). */
export const isPhaseSnapshotCompleteForChip = (snap) => {
  if (!snap) return false;
  const ratingRaw = snap.rating ?? snap.Rating;
  const hasRating =
    ratingRaw != null &&
    ratingRaw !== '' &&
    Number.isFinite(Number(ratingRaw)) &&
    Number(ratingRaw) > 0;
  if (!hasRating) return false;
  const commentStatus = snap.commentStatus ?? snap.CommentStatus;
  const comment = snap.comment ?? snap.Comment ?? '';
  if (commentStatus === true && String(comment).trim() === '') return true;
  return hasPlainTextComment(comment);
};

const hasSnapshotRating = (snap) => {
  if (!snap) return false;
  const ratingRaw = snap.rating ?? snap.Rating;
  return (
    ratingRaw != null &&
    ratingRaw !== '' &&
    Number.isFinite(Number(ratingRaw)) &&
    Number(ratingRaw) > 0
  );
};

/** Submit gate: saved DB answer (commentStatus when comment omitted) or plain-text snapshot comment. */
export const isSnapshotCompleteForSubmit = (snap) => {
  if (!hasSnapshotRating(snap)) return false;
  const comment = snap.comment ?? snap.Comment ?? '';
  if (hasPlainTextComment(comment)) return true;
  const commentStatus = snap.commentStatus ?? snap.CommentStatus;
  return commentStatus === true && String(comment).trim() === '';
};

const getLocalAnswer = (answers, questionId) => {
  const qid = questionId ?? '';
  return answers?.[qid] ?? answers?.[String(qid)] ?? {};
};

const getLocalPlainCommentLength = (answers, questionId) => {
  const a = getLocalAnswer(answers, questionId);
  const comment = a?.comment ?? a?.Comment ?? '';
  return richTextHtmlToPlainText(String(comment)).length;
};

const hasLocalAnswerRating = (answers, questionId) => {
  const a = getLocalAnswer(answers, questionId);
  const ratingRaw = a?.rating ?? a?.Rating;
  return (
    ratingRaw != null &&
    ratingRaw !== '' &&
    Number.isFinite(Number(ratingRaw)) &&
    Number(ratingRaw) > 0
  );
};

/** Local form state has rating and non-empty comment plain-text length. */
export const isLocalAnswerCompleteForSubmit = (answers, questionId) =>
  hasLocalAnswerRating(answers, questionId) && getLocalPlainCommentLength(answers, questionId) > 0;

/** User has typed a rating or comment in local answers for this question. */
export const hasLocalAnswerEdits = (answers, questionId) =>
  hasLocalAnswerRating(answers, questionId) || getLocalPlainCommentLength(answers, questionId) > 0;

export const getQuestionSubmitCompletion = (question, { phase, answers, fieldsReadOnly }) => {
  const snap =
    phase === 'manager'
      ? question?.managerReview ?? question?.ManagerReview
      : question?.selfReview ?? question?.SelfReview;
  const qid = question?.id ?? question?.Id;
  const snapshotOk = isSnapshotCompleteForSubmit(snap);
  const localOk = isLocalAnswerCompleteForSubmit(answers, qid);

  if (fieldsReadOnly) {
    return { complete: snapshotOk, snapshotOk, localOk };
  }

  let complete = snapshotOk;
  if (hasLocalAnswerEdits(answers, qid)) {
    complete = snapshotOk || localOk;
  }

  return { complete, snapshotOk, localOk };
};

/**
 * True when a question is ready to submit (dual-path: commentStatus snapshot OR local answer length).
 * Does not enforce self-eval 50-character minimum (backend validates on submit).
 */
export const isQuestionCompleteForSubmit = (question, { phase, answers, fieldsReadOnly }) =>
  getQuestionSubmitCompletion(question, { phase, answers, fieldsReadOnly }).complete;

/** When incomplete: missing_rating | missing_comment; null when complete. */
export const getQuestionSubmitIncompleteReason = (question, { phase, answers, fieldsReadOnly }) => {
  const snap =
    phase === 'manager'
      ? question?.managerReview ?? question?.ManagerReview
      : question?.selfReview ?? question?.SelfReview;
  const qid = question?.id ?? question?.Id;
  const { complete, snapshotOk, localOk } = getQuestionSubmitCompletion(question, {
    phase,
    answers,
    fieldsReadOnly,
  });
  if (complete) return null;

  const hasLocalRating = hasLocalAnswerRating(answers, qid);
  const hasSnapshotRatingValue = hasSnapshotRating(snap);

  if (!hasLocalRating && !hasSnapshotRatingValue) return 'missing_rating';
  if (!snapshotOk && !localOk) return 'missing_comment';
  return 'missing_comment';
};

/** True when assignment phase status indicates the phase was finalized. */
export const isAssignmentPhaseSubmitted = (status) => {
  const n = String(status ?? '').trim().toLowerCase();
  return ['submitted', 'complete', 'completed'].includes(n);
};

/** True when HR has published results so the employee sees them (list/detail status flags). */
export const isAssignmentResultsPublishedToEmployee = (status) => {
  if (status === true) return true;
  if (status === false) return false;
  const s = String(status ?? '').trim().toLowerCase();
  return s === 'published' || s === 'visible';
};

/** Normalize POST publish-bulk / unpublish-bulk success payloads (camelCase or PascalCase). */
export const readBulkAssignmentPublishResult = (res) => {
  const e = toEntityFromPayload(res);
  return {
    publishedCount: Number(e?.publishedCount ?? e?.PublishedCount ?? 0) || 0,
    skippedAlreadyPublishedCount:
      Number(e?.skippedAlreadyPublishedCount ?? e?.SkippedAlreadyPublishedCount ?? 0) || 0,
    failedCount: Number(e?.failedCount ?? e?.FailedCount ?? 0) || 0,
    rowErrors: Array.isArray(e?.rowErrors) ? e.rowErrors : Array.isArray(e?.RowErrors) ? e.RowErrors : [],
  };
};

/**
 * Short summary for toast/alert after bulk publish or unpublish.
 * @param {'publish' | 'unpublish'} verb
 */
export const formatBulkAssignmentPublishSummary = (verb, result) => {
  const r = readBulkAssignmentPublishResult(result ?? {});
  const doneLabel = verb === 'unpublish' ? 'Unpublished' : 'Published';
  const skipLabel =
    verb === 'unpublish' ? 'already pending / not visible' : 'already published';
  const parts = [
    `${doneLabel}: ${r.publishedCount}`,
    `Skipped (${skipLabel}): ${r.skippedAlreadyPublishedCount}`,
  ];
  if (r.failedCount > 0) parts.push(`Failed: ${r.failedCount}`);
  let msg = parts.join(' · ');
  if (r.rowErrors.length) {
    const lines = r.rowErrors.slice(0, 8).map((x) => String(x));
    msg += `\n${lines.join('\n')}`;
    if (r.rowErrors.length > 8) msg += `\n… and ${r.rowErrors.length - 8} more`;
  }
  return msg;
};

/** Parses a positive numeric max rating (e.g. appraisal `ratingScale`); coerces strings from JSON APIs. */
export const parseRatingScaleMax = (raw) => {
  if (raw == null || raw === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

/** Best-effort employee display string from assignment DTO / nested employee (matches assignments list conventions). */
const resolveAssignmentEmployeeDisplayName = (assignLike, wrapperEmployee) => {
  const base = assignLike && typeof assignLike === 'object' ? assignLike : {};
  const emp =
    (base.employee && typeof base.employee === 'object' ? base.employee : null) ??
    (base.Employee && typeof base.Employee === 'object' ? base.Employee : null) ??
    (wrapperEmployee && typeof wrapperEmployee === 'object' ? wrapperEmployee : null) ??
    {};
  const first = emp.firstName ?? emp.FirstName ?? base.firstName ?? base.FirstName ?? '';
  const last = emp.lastName ?? emp.LastName ?? base.lastName ?? base.LastName ?? '';
  const full = `${first} ${last}`.trim();
  const explicit = base.employeeName ?? base.EmployeeName ?? '';
  const ex =
    explicit != null && String(explicit).trim() !== '' ? String(explicit).trim() : '';
  return ex || full;
};

/**
 * Maps GET /performance/assignments/:id (and similar) into the self-eval review shape.
 * Merges assignment-level timelines/status with nested `reviewForm` when present.
 */
export const mapAssignmentForSelfEvaluation = (assignment) => {
  if (!assignment || typeof assignment !== 'object') return null;

  const wrapperAppraisalConfig =
    assignment.appraisalConfig ?? assignment.AppraisalConfig ?? null;
  const ratingScaleFromAppraisal =
    wrapperAppraisalConfig && typeof wrapperAppraisalConfig === 'object'
      ? parseRatingScaleMax(
          wrapperAppraisalConfig.ratingScale ?? wrapperAppraisalConfig.RatingScale
        )
      : undefined;

  /**
   * GET /performance/assignments/:id returns `data` as:
   * `{ assignment: {...}, reviewForm: { sections, ... }, selfEvaluationStatus?: string }`
   * (after unwrap, sibling keys - not a single merged object).
   */
  let a = assignment;
  const rootSelfEvaluationStatus =
    a.selfEvaluationStatus ?? a.SelfEvaluationStatus ?? null;
  /** Wrapped GET detail responses often expose HR phase as `hrEvaluationStatus`; older payloads use `hrReviewStatus`. */
  const rootHrEvaluationStatus =
    a.hrEvaluationStatus ?? a.HrEvaluationStatus ?? null;
  const rootSelfOverallScore =
    a.selfOverallScore ?? a.SelfOverallScore ?? null;
  const rootManagerOverallScore =
    a.managerOverallScore ?? a.ManagerOverallScore ?? null;
  const rootOverallRating =
    a.overallRating ?? a.OverallRating ?? null;
  const rootHrOverallScore =
    a.hrOverallScore ??
    a.HrOverallScore ??
    a.hrOverallRating ??
    a.HrOverallRating ??
    null;
  const rootHrComments =
    a.hrComments ??
    a.hrFeedback ??
    a.hrRemark ??
    a.HrComments ??
    a.HrFeedback ??
    '';
  /** Wrapper DTO fields may sit beside `assignment` / `reviewForm`, not inside assignment. */
  const rootAllReviewsSubmitted =
    assignment?.allReviewsSubmitted ?? assignment?.AllReviewsSubmitted ?? null;
  const siblingAssign = a.assignment ?? a.Assignment;
  const siblingForm = a.reviewForm ?? a.ReviewForm;
  if (
    siblingAssign &&
    typeof siblingAssign === 'object' &&
    siblingForm != null &&
    typeof siblingForm === 'object'
  ) {
    a = {
      ...siblingAssign,
      reviewForm: siblingForm,
      selfEvaluationStatus:
        rootSelfEvaluationStatus ??
        siblingAssign.selfEvaluationStatus ??
        siblingAssign.SelfEvaluationStatus,
      allReviewsSubmitted:
        siblingAssign.allReviewsSubmitted ??
        siblingAssign.AllReviewsSubmitted ??
        rootAllReviewsSubmitted,
      selfOverallScore:
        siblingAssign.selfOverallScore ??
        siblingAssign.SelfOverallScore ??
        rootSelfOverallScore,
      managerOverallScore:
        siblingAssign.managerOverallScore ??
        siblingAssign.ManagerOverallScore ??
        rootManagerOverallScore,
      overallRating:
        siblingAssign.overallRating ??
        siblingAssign.OverallRating ??
        rootOverallRating,
      hrOverallScore:
        siblingAssign.hrOverallScore ??
        siblingAssign.HrOverallScore ??
        siblingAssign.hrOverallRating ??
        siblingAssign.HrOverallRating ??
        rootHrOverallScore,
      hrComments:
        siblingAssign.hrComments ??
        siblingAssign.hrFeedback ??
        siblingAssign.hrRemark ??
        siblingAssign.HrComments ??
        siblingAssign.HrFeedback ??
        rootHrComments,
    };
  } else if (rootSelfEvaluationStatus != null && a.selfEvaluationStatus == null) {
    a = { ...a, selfEvaluationStatus: rootSelfEvaluationStatus };
  }

  const nested =
    a.reviewForm ??
    a.ReviewForm ??
    a.reviewFormDetail ??
    a.form ??
    a.Form ??
    null;

  const nestedSections =
    nested && typeof nested === 'object' && Array.isArray(nested.sections) ? nested.sections : null;
  const rootSections = Array.isArray(a.sections) ? a.sections : null;
  const formSections =
    nestedSections?.length
      ? nestedSections
      : rootSections?.length
        ? rootSections
        : nestedSections ?? rootSections ?? [];

  const wrapEmp = assignment.employee ?? assignment.Employee ?? null;
  const assignmentEmployeeName =
    resolveAssignmentEmployeeDisplayName(
      siblingAssign && typeof siblingAssign === 'object' ? siblingAssign : null,
      wrapEmp,
    ) || resolveAssignmentEmployeeDisplayName(a, wrapEmp);

  const assignmentId = String(a.id ?? a._id ?? a.assignmentId ?? '');
  const formLike =
    nested && typeof nested === 'object'
      ? { ...nested, sections: formSections.length ? formSections : nested.sections ?? [] }
      : { sections: formSections };

  const merged = {
    ...formLike,
    id: assignmentId || String(formLike.id ?? formLike._id ?? ''),
    formName:
      formLike.formName ??
      formLike.name ??
      a.reviewFormName ??
      a.ReviewFormName ??
      'Review',
    ratingScale:
      ratingScaleFromAppraisal ??
      parseRatingScaleMax(formLike.ratingScale ?? formLike.scale ?? formLike.maxRating) ??
      parseRatingScaleMax(a.ratingScale ?? a.scale ?? a.maxRating),
    status:
      a.selfEvalStatus ??
      a.SelfEvalStatus ??
      a.status ??
      a.selfEvaluationStatus ??
      a.SelfEvaluationStatus ??
      formLike.status,
    selfEvaluationStatus:
      a.selfEvaluationStatus ??
      a.SelfEvaluationStatus ??
      rootSelfEvaluationStatus,
    endDate:
      a.selfEvalEnd ??
      a.SelfEvalEnd ??
      a.selfEvaluationEnd ??
      a.endDate ??
      formLike.endDate,
    allReviewsSubmitted: Boolean(
      a.allReviewsSubmitted ?? a.AllReviewsSubmitted ?? rootAllReviewsSubmitted ?? false
    ),
    selfEvalStatus: a.selfEvalStatus ?? a.SelfEvalStatus ?? null,
    managerEvalStatus: a.managerEvalStatus ?? a.ManagerEvalStatus ?? null,
    hrReviewStatus:
      a.hrReviewStatus ??
      a.HrReviewStatus ??
      a.hrEvaluationStatus ??
      a.HrEvaluationStatus ??
      rootHrEvaluationStatus ??
      null,
    publishedStatus: a.publishedStatus ?? a.PublishedStatus ?? null,
    resultsPublishedToEmployee: isAssignmentResultsPublishedToEmployee(
      a.resultsPublishedToEmployee ??
        a.ResultsPublishedToEmployee ??
        a.assignmentPublishedToEmployee ??
        a.publishedStatus ??
        a.PublishedStatus
    ),
    assignmentEmployeeId: String(
      ((siblingAssign && typeof siblingAssign === 'object'
        ? siblingAssign.employeeId ?? siblingAssign.EmployeeId
        : null) ??
        a.employeeId ??
        a.EmployeeId ??
        '') ||
        ''
    ),
    assignmentEmployeeName,
    selfOverallScore:
      a.selfOverallScore ??
      a.SelfOverallScore ??
      rootSelfOverallScore,
    managerOverallScore:
      a.managerOverallScore ??
      a.ManagerOverallScore ??
      rootManagerOverallScore,
    overallRating:
      a.overallRating ??
      a.OverallRating ??
      rootOverallRating,
    hrOverallScore:
      a.hrOverallScore ??
      a.HrOverallScore ??
      a.hrOverallRating ??
      a.HrOverallRating ??
      rootHrOverallScore,
    hrComments:
      a.hrComments ??
      a.hrFeedback ??
      a.hrRemark ??
      a.HrComments ??
      a.HrFeedback ??
      rootHrComments,
  };

  return mapReviewFormForSelfEvaluation(merged);
};

/**
 * Maps GET /performance/review-forms/:id payload into the shape used by the self-eval UI.
 * Tolerates common backend field aliases.
 */
export const mapReviewFormForSelfEvaluation = (payload) => {
  if (!payload || typeof payload !== 'object') return null;
  const id = String(payload.id ?? payload._id ?? '');
  const formName = payload.formName ?? payload.name ?? 'Review';
  const ratingScale =
    parseRatingScaleMax(payload.ratingScale) ??
    parseRatingScaleMax(payload.scale) ??
    parseRatingScaleMax(payload.maxRating) ??
    5;
  const status = payload.status ?? '-';
  const endDate =
    payload.endDate ?? payload.periodEnd ?? payload.evaluationEndDate ?? payload.deadline ?? payload.period ?? null;

  const sectionsSrc = Array.isArray(payload.sections) ? payload.sections : [];
  const initialAnswers = {};
  const managerInitialAnswers = {};
  const hrInitialAnswers = {};
  let hasPrefilledAnswersFromApi = false;
  let managerHasPrefilledAnswersFromApi = false;
  let hrHasPrefilledAnswersFromApi = false;

  const sections = sectionsSrc.map((s, idx) => {
    // `sectionId` (review form section id) is required for lazy section fetch endpoints.
    const sectionId = String(s?.id ?? `section-${idx}`);
    const focusAreaId = String(s?.focusAreaId ?? '');
    const focusAreaName = s?.focusAreaName ?? s?.name ?? s?.title ?? `Focus area ${idx + 1}`;
    const description = s?.description ?? s?.details ?? '';
    const weightage = s?.weightage ?? s?.Weightage ?? null;
    const questionsSrc = Array.isArray(s?.questions) ? s.questions : [];
    const questions = questionsSrc.map((q, qIdx) => {
      const qid = String(q?.id ?? `q-${idx}-${qIdx}`);
      const selfSnap = normalizePhaseSnapshot(q?.selfReview ?? q?.SelfReview);
      const mgrSnap = normalizePhaseSnapshot(q?.managerReview ?? q?.ManagerReview);
      const hrSnap = normalizePhaseSnapshot(q?.hrReview ?? q?.HrReview);

      const rawR = q?.answerRating ?? q?.AnswerRating;
      const hasRating =
        rawR != null && rawR !== '' && !Number.isNaN(Number(rawR));
      const rawC = q?.answerComment ?? q?.AnswerComment ?? '';
      const hasComment = String(rawC).trim() !== '';

      if (selfSnap) {
        hasPrefilledAnswersFromApi = true;
        initialAnswers[qid] = {
          rating: selfSnap.rating,
          comment: selfSnap.comment,
        };
      } else if (hasRating || hasComment) {
        hasPrefilledAnswersFromApi = true;
        initialAnswers[qid] = {
          rating: hasRating ? Number(rawR) : 0,
          comment: String(rawC || ''),
        };
      }

      if (mgrSnap) {
        managerHasPrefilledAnswersFromApi = true;
        managerInitialAnswers[qid] = {
          rating: mgrSnap.rating,
          comment: mgrSnap.comment,
        };
      }
      if (hrSnap) {
        hrHasPrefilledAnswersFromApi = true;
        hrInitialAnswers[qid] = {
          rating: hrSnap.rating,
          comment: hrSnap.comment,
        };
      }

      return {
        id: qid,
        text: q?.text ?? q?.questionText ?? q?.prompt ?? q?.question ?? '',
        weightage: q?.weightage ?? q?.Weightage ?? null,
        sortOrder: q?.sortOrder ?? q?.SortOrder ?? qIdx,
        selfReview: selfSnap,
        managerReview: mgrSnap,
        hrReview: hrSnap,
      };
    });
    return { sectionId, focusAreaId, focusAreaName, description, weightage, questions };
  });

  const selfEvaluationStatus =
    payload.selfEvaluationStatus ?? payload.SelfEvaluationStatus ?? null;

  const allReviewsSubmitted = Boolean(payload.allReviewsSubmitted);
  const selfEvalStatus = payload.selfEvalStatus ?? payload.SelfEvalStatus ?? null;
  const managerEvalStatus = payload.managerEvalStatus ?? payload.ManagerEvalStatus ?? null;
  const hrReviewStatus =
    payload.hrReviewStatus ??
    payload.HrReviewStatus ??
    payload.hrEvaluationStatus ??
    payload.HrEvaluationStatus ??
    null;
  const assignmentEmployeeId =
    typeof payload.assignmentEmployeeId === 'string' ? payload.assignmentEmployeeId : '';
  const assignmentEmployeeName =
    payload.assignmentEmployeeName != null && String(payload.assignmentEmployeeName).trim() !== ''
      ? String(payload.assignmentEmployeeName).trim()
      : '';
  const selfOverallScore =
    payload.selfOverallScore ?? payload.SelfOverallScore ?? null;
  const managerOverallScore =
    payload.managerOverallScore ?? payload.ManagerOverallScore ?? null;
  const overallRating =
    payload.overallRating ?? payload.OverallRating ?? null;
  const hrOverallScore =
    payload.hrOverallScore ??
    payload.HrOverallScore ??
    payload.hrOverallRating ??
    payload.HrOverallRating ??
    null;
  const hrComments = payload.hrComments ?? payload.hrFeedback ?? payload.HrComments ?? '';
  const publishedStatus = payload.publishedStatus ?? payload.PublishedStatus ?? null;
  const resultsPublishedToEmployee =
    typeof payload.resultsPublishedToEmployee === 'boolean'
      ? payload.resultsPublishedToEmployee
      : isAssignmentResultsPublishedToEmployee(
          payload.resultsPublishedToEmployee ??
            payload.ResultsPublishedToEmployee ??
            publishedStatus
        );

  return {
    id: id || 'review',
    formName,
    ratingScale,
    status,
    endDate,
    sections,
    initialAnswers,
    managerInitialAnswers,
    hrInitialAnswers,
    hasPrefilledAnswersFromApi,
    managerHasPrefilledAnswersFromApi,
    hrHasPrefilledAnswersFromApi,
    selfEvaluationStatus,
    allReviewsSubmitted,
    selfEvalStatus,
    managerEvalStatus,
    hrReviewStatus,
    assignmentEmployeeId,
    assignmentEmployeeName,
    selfOverallScore,
    managerOverallScore,
    hrOverallScore,
    overallRating,
    hrComments,
    publishedStatus,
    resultsPublishedToEmployee,
  };
};

/**
 * PATCH/POST my-reviews expect `answers` as an array of { questionId, rating, comment }.
 * UI state uses a map: questionId → { rating, comment }.
 */
export const serializeEvaluationAnswersForApi = (answers) => {
  if (answers == null) return [];
  if (Array.isArray(answers)) return answers;
  if (typeof answers !== 'object') return [];

  return Object.entries(answers).reduce((acc, [questionId, v]) => {
    if (!v || typeof v !== 'object') return acc;
    const comment = v.comment != null ? String(v.comment) : '';
    const hasComment = comment.trim() !== '';
    const rawR = v.rating;
    const hasRating = rawR != null && rawR !== '' && !Number.isNaN(Number(rawR));
    if (!hasRating && !hasComment) return acc;
    acc.push({
      questionId: String(questionId),
      rating: hasRating ? Number(rawR) : 0,
      comment,
    });
    return acc;
  }, []);
};

/**
 * Drops `id` from each question unless it looks like a server Guid.
 * Temporary keys (e.g. `Date.now()`) must not be sent - servers reject them for Guid fields.
 */
export const serializeReviewFormForApi = (form) => {
  if (!form || typeof form !== 'object') return form;
  const sections = Array.isArray(form.sections)
    ? form.sections.map((section) => {
        const questions = Array.isArray(section?.questions)
          ? section.questions.map((q) => {
              if (!q || typeof q !== 'object') return q;
              const { id: qid, ...rest } = q;
              if (!isLikelyGuidString(qid)) {
                return { ...rest };
              }
              return { ...rest, id: String(qid).trim() };
            })
          : [];
        return { ...section, questions };
      })
    : form.sections;
  return { ...form, sections };
};

/** List row: `sections` may be a count number or a nested array (different list endpoints). */
export const getReviewFormSectionCount = (row) => {
  if (row == null) return 0;
  if (typeof row.sections === 'number' && !Number.isNaN(row.sections)) return row.sections;
  if (Array.isArray(row.sections)) return row.sections.length;
  return 0;
};

/** List row: backend may send total `questions` count, or full `sections` tree. */
export const getReviewFormQuestionCount = (row) => {
  if (row == null) return 0;
  if (typeof row.questions === 'number' && !Number.isNaN(row.questions)) return row.questions;
  if (!Array.isArray(row.sections)) return 0;
  return row.sections.reduce((sum, s) => {
    const n = Array.isArray(s?.questions) ? s.questions.length : 0;
    return sum + n;
  }, 0);
};

/**
 * User-facing message from an Axios/network error for Redux/UI.
 */
export const getApiErrorMessage = (error) => {
  if (error?.code === 'ECONNABORTED') {
    return 'Request timed out. Please try again.';
  }
  if (error?.message === 'Network Error' || error?.message === 'Failed to fetch') {
    return 'Unable to reach the server. Check your connection and try again.';
  }

  const data = error?.response?.data;
  const status = error?.response?.status;

  if (data !== undefined && data !== null && typeof data !== 'object') {
    return String(data);
  }

  if (data && typeof data === 'object') {
    const msg = data.message ?? data.error;
    if (typeof msg === 'string' && msg.trim()) return msg;
    if (Array.isArray(msg) && msg.length) {
      const parts = msg.map((m) => (typeof m === 'string' ? m : m?.msg || m?.message)).filter(Boolean);
      if (parts.length) return parts.join('. ');
    }
    if (Array.isArray(data.errors) && data.errors.length) {
      const first = data.errors[0];
      if (typeof first === 'string') return first;
      if (first?.msg) return String(first.msg);
      if (first?.message) return String(first.message);
    }
    if (typeof data.detail === 'string' && data.detail.trim()) return data.detail;
  }

  if (status === 413) return 'Request payload is too large.';
  if (status === 404) return 'The requested resource was not found.';
  if (status === 409) return 'This phase was already submitted and cannot be edited.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status >= 500) return 'The server ran into an error. Please try again later.';

  return error?.message?.trim?.() || 'Something went wrong. Please try again.';
};

/** Parse `filename` / `filename*` from a Content-Disposition header (RFC 5987). */
export const parseFilenameFromContentDisposition = (contentDisposition) => {
  const raw = String(contentDisposition || '');
  if (!raw) return '';

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

/** Trigger a browser file download for a Blob (e.g. Excel from `responseType: 'blob'`). */
export const downloadBlobAsFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'download';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};
