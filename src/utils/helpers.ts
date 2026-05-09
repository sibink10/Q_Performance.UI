// @ts-nocheck
// src/utils/helpers.js
// Reusable utility functions used across the Performance module

import dayjs from 'dayjs';

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
  };
  return map[label] || '#333';
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

/** Parses API phase snapshot `{ rating?, comment? }` (camelCase or PascalCase). */
export const normalizePhaseSnapshot = (snap) => {
  if (snap == null || typeof snap !== 'object') return null;
  const ratingRaw = snap.rating ?? snap.Rating;
  const commentRaw = snap.comment ?? snap.Comment ?? '';
  const hasRating = ratingRaw != null && ratingRaw !== '' && !Number.isNaN(Number(ratingRaw));
  const hasComment = String(commentRaw).trim() !== '';
  if (!hasRating && !hasComment) return null;
  return {
    rating: hasRating ? Number(ratingRaw) : 0,
    comment: String(commentRaw || ''),
  };
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

/**
 * Maps GET /performance/assignments/:id (and similar) into the self-eval review shape.
 * Merges assignment-level timelines/status with nested `reviewForm` when present.
 */
export const mapAssignmentForSelfEvaluation = (assignment) => {
  if (!assignment || typeof assignment !== 'object') return null;

  /**
   * GET /performance/assignments/:id returns `data` as:
   * `{ assignment: {...}, reviewForm: { sections, ... }, selfEvaluationStatus?: string }`
   * (after unwrap, sibling keys - not a single merged object).
   */
  let a = assignment;
  const rootSelfEvaluationStatus =
    a.selfEvaluationStatus ?? a.SelfEvaluationStatus ?? null;
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
      typeof formLike.ratingScale === 'number'
        ? formLike.ratingScale
        : typeof a.ratingScale === 'number'
          ? a.ratingScale
          : undefined,
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
    hrReviewStatus: a.hrReviewStatus ?? a.HrReviewStatus ?? null,
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
    typeof payload.ratingScale === 'number'
      ? payload.ratingScale
      : typeof payload.scale === 'number'
        ? payload.scale
        : typeof payload.maxRating === 'number'
          ? payload.maxRating
          : 5;
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
    const focusAreaId = String(s?.focusAreaId ?? s?.id ?? `section-${idx}`);
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
    return { focusAreaId, focusAreaName, description, weightage, questions };
  });

  const selfEvaluationStatus =
    payload.selfEvaluationStatus ?? payload.SelfEvaluationStatus ?? null;

  const allReviewsSubmitted = Boolean(payload.allReviewsSubmitted);
  const selfEvalStatus = payload.selfEvalStatus ?? payload.SelfEvalStatus ?? null;
  const managerEvalStatus = payload.managerEvalStatus ?? payload.ManagerEvalStatus ?? null;
  const hrReviewStatus = payload.hrReviewStatus ?? payload.HrReviewStatus ?? null;
  const assignmentEmployeeId =
    typeof payload.assignmentEmployeeId === 'string' ? payload.assignmentEmployeeId : '';
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
