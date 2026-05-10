import { memo, useEffect, useRef, useState } from 'react';
import { Box, Typography, Chip, Stack, Divider, TextField, Rating } from '@mui/material';
import RatingInput from '../../common/RatingInput';
import RichTextEditor from '../../common/RichTextEditor';
import { isProbablyHtml, richTextHtmlToPlainText, sanitizeRichTextHtml } from '../../../utils/richText';

const SELF_EVAL_MIN_ANSWER_LEN = 50;
const getTextLen = (value: unknown) => richTextHtmlToPlainText(String(value ?? '')).length;

/** Long URLs / unbroken strings + nested HTML need explicit wrap in flex layouts. */
const richTextWrapRootSx = {
  minWidth: 0,
  maxWidth: '100%',
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
} as const;

const commentRichTextContentSx = {
  ...richTextWrapRootSx,
  '& p': { m: 0, ...richTextWrapRootSx },
  '& ul, & ol': { mt: 0, mb: 0, pl: 2.25, ...richTextWrapRootSx },
  '& li': { mt: 0.25, ...richTextWrapRootSx },
  '& strong': { fontWeight: 700 },
  '& img': { maxWidth: '100%', height: 'auto', verticalAlign: 'middle' },
  '& a': { overflowWrap: 'anywhere', wordBreak: 'break-all' },
} as const;

function SnapshotCommentBody({ comment }: { comment: string }) {
  const raw = String(comment || '').trim();
  if (!raw || getTextLen(raw) === 0) {
    return (
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ whiteSpace: 'pre-wrap', ...richTextWrapRootSx }}
      >
        -
      </Typography>
    );
  }
  if (isProbablyHtml(raw)) {
    return (
      <Box
        sx={{ ...commentRichTextContentSx, typography: 'body2', color: 'text.secondary' }}
        component="div"
        dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(raw) }}
      />
    );
  }
  return (
    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', ...richTextWrapRootSx }}>
      {raw}
    </Typography>
  );
}

const ratingStarSx = {
  '& .MuiRating-iconFilled': {
    filter: 'drop-shadow(0 2px 4px rgba(79, 70, 229, 0.22))',
  },
};

/** Read-only star (or numeric block for 10-point) display aligned with `RatingInput` behavior. */
function SnapshotRatingStars({ value, scale }: { value: number; scale: number }) {
  const n = Number(value);
  const safeVal = Number.isFinite(n) ? Math.min(scale, Math.max(0, n)) : 0;

  if (scale === 10) {
    return (
      <Box sx={{ mb: 1 }}>
        <Rating
          value={safeVal}
          max={10}
          readOnly
          precision={0.1}
          size="small"
          sx={{
            ...ratingStarSx,
            '& .MuiRating-icon': { fontSize: '1.05rem' },
          }}
        />
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
          {safeVal.toFixed(1)} / {scale}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 1 }}>
      <Rating
        value={safeVal}
        max={scale}
        readOnly
        precision={0.1}
        size="medium"
        sx={ratingStarSx}
      />
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
        {safeVal.toFixed(1)} / {scale}
      </Typography>
    </Box>
  );
}

/** Read-only snapshot (self / manager / HR). */
function PhaseSnapshotDisplay({ label, snapshot, ratingScale }: { label: string; snapshot: any; ratingScale: number }) {
  if (!snapshot) return null;
  return (
    <Box sx={{ pt: 0.5, minWidth: 0, maxWidth: '100%' }}>
      {label ? (
        <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
          {label}
        </Typography>
      ) : null}
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
        Rating
      </Typography>
      <SnapshotRatingStars value={Number(snapshot.rating)} scale={ratingScale} />
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.25 }}>
        Comments
      </Typography>
      <SnapshotCommentBody comment={snapshot.comment?.trim() ? snapshot.comment : ''} />
    </Box>
  );
}

const questionAltSx = (qIdx: number) => {
  const isOdd = qIdx % 2 === 1;
  return {
    bgcolor: isOdd ? 'rgba(2, 136, 209, 0.06)' : 'rgba(46, 125, 50, 0.05)',
    borderLeft: '4px solid',
    borderLeftColor: isOdd ? 'info.light' : 'success.light',
  };
};

const weightageChipSx = {
  flexShrink: 0,
  fontWeight: 700,
  bgcolor: 'rgba(2, 136, 209, 0.12)',
  borderColor: 'info.main',
  color: 'info.dark',
  '& .MuiChip-label': {
    px: 1.25,
  },
};

export type EvaluationQuestionCardProps = {
  question: any;
  qAns: any;
  questionHtml: string;
  qIdx: number;
  ratingScale: number;
  isManagerMode: boolean;
  isHrMode: boolean;
  selfFieldsReadOnly: boolean;
  managerFieldsReadOnly: boolean;
  hrResultsVisible: boolean;
  selfSubmitValidationOn: boolean;
  /** Bumped when assignment answers are reset from the server. */
  hydrationKey: number;
  registerCommentDraftGetter: (questionId: string, getDraft: () => string) => () => void;
  onUpdateAnswer: (questionId: string, field: 'rating' | 'comment', value: string | number) => void;
};

function EvaluationQuestionCardInner({
  question,
  qAns,
  questionHtml,
  qIdx,
  ratingScale,
  isManagerMode,
  isHrMode,
  selfFieldsReadOnly,
  managerFieldsReadOnly,
  hrResultsVisible,
  selfSubmitValidationOn,
  hydrationKey,
  registerCommentDraftGetter,
  onUpdateAnswer,
}: EvaluationQuestionCardProps) {
  const commentEditable =
    (!isManagerMode && !isHrMode && !selfFieldsReadOnly) || (isManagerMode && !managerFieldsReadOnly);

  const [commentDraft, setCommentDraft] = useState(() => String(qAns?.comment ?? ''));
  const commentDraftRef = useRef(commentDraft);
  commentDraftRef.current = commentDraft;

  useEffect(() => {
    if (!commentEditable) return undefined;
    return registerCommentDraftGetter(question.id, () => String(commentDraftRef.current ?? ''));
  }, [commentEditable, question.id, registerCommentDraftGetter]);

  useEffect(() => {
    if (!commentEditable) return;
    setCommentDraft(String(qAns?.comment ?? ''));
  }, [hydrationKey, question.id, commentEditable]);

  const effectiveComment = commentEditable ? commentDraft : String(qAns?.comment ?? '');
  const isAnswered = qAns.rating && getTextLen(effectiveComment) > 0;

  const questionWeight =
    question.weightage == null || question.weightage === ''
      ? null
      : (() => {
          const n = Number(question.weightage);
          if (!Number.isFinite(n)) return String(question.weightage);
          return Number.isInteger(n) ? String(n) : String(n);
        })();

  const renderRevealPlaceholder = () => (
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
      Reviews are hidden until they become available.
    </Typography>
  );

  const renderNonEditablePhase = (snapshot: any, { allowReveal = false } = {}) => {
    if (snapshot) return <PhaseSnapshotDisplay label="" snapshot={snapshot} ratingScale={ratingScale} />;
    if (allowReveal) {
      return (
        <Typography variant="caption" color="text.secondary">
          -
        </Typography>
      );
    }
    return renderRevealPlaceholder();
  };

  const flushCommentToParent = () => {
    if (!commentEditable) return;
    onUpdateAnswer(question.id, 'comment', String(commentDraftRef.current ?? ''));
  };

  const renderSelfColumn = () => {
    if (isManagerMode || isHrMode) {
      const snap = question.selfReview;
      return renderNonEditablePhase(snap, { allowReveal: true });
    }

    if (selfFieldsReadOnly) {
      const snap =
        question.selfReview || (qAns?.rating ? { rating: Number(qAns.rating), comment: String(qAns.comment || '') } : null);
      if (snap?.rating || getTextLen(snap?.comment)) {
        return <PhaseSnapshotDisplay label="Your response" snapshot={snap} ratingScale={ratingScale} />;
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
            label={`Rating (${ratingScale}-point scale)`}
            value={qAns?.rating || 0}
            onChange={(v: number) => onUpdateAnswer(question.id, 'rating', v)}
            scale={ratingScale}
            readOnly={false}
          />
        </Box>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
          Comments
        </Typography>
        <RichTextEditor
          value={commentDraft}
          onChange={(next) => setCommentDraft(next)}
          onBlur={flushCommentToParent}
          placeholder="Provide specific examples and justification for your rating..."
          error={!!(selfSubmitValidationOn && qAns?.rating && getTextLen(commentDraft) < SELF_EVAL_MIN_ANSWER_LEN)}
          helperText={
            selfSubmitValidationOn && qAns?.rating && getTextLen(commentDraft) < SELF_EVAL_MIN_ANSWER_LEN
              ? `Minimum ${SELF_EVAL_MIN_ANSWER_LEN} characters required (${getTextLen(commentDraft)}/${SELF_EVAL_MIN_ANSWER_LEN}).`
              : ''
          }
        />
      </>
    );
  };

  const renderManagerColumn = () => {
    if (!isManagerMode) {
      const allowReveal = isHrMode ? true : hrResultsVisible;
      return renderNonEditablePhase(question.managerReview, { allowReveal });
    }
    if (!managerFieldsReadOnly) {
      return (
        <>
          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>
            Manager review
          </Typography>
          <Box sx={{ mb: 2 }}>
            <RatingInput
              label={`Rating (${ratingScale}-point scale)`}
              value={qAns?.rating || 0}
              onChange={(v: number) => onUpdateAnswer(question.id, 'rating', v)}
              scale={ratingScale}
              readOnly={false}
            />
          </Box>
          <TextField
            label="Comments "
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            onBlur={flushCommentToParent}
            fullWidth
            multiline
            minRows={2}
            size="small"
            required
            error={!!(qAns?.rating && !commentDraft.trim())}
            helperText={qAns?.rating && !commentDraft.trim() ? 'Comment is required before submission' : ''}
          />
        </>
      );
    }
    return renderNonEditablePhase(
      question.managerReview ||
        (qAns?.rating ? { rating: Number(qAns.rating), comment: String(qAns.comment || '') } : null),
      { allowReveal: true }
    );
  };


  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2.5 },
        borderRadius: 2,
        border: '1px solid',
        borderColor: isAnswered ? 'success.light' : 'divider',
        maxWidth: '100%',
        minWidth: 0,
        ...(isAnswered ? { bgcolor: 'success.50' } : questionAltSx(qIdx)),
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'flex-start' },
          justifyContent: 'space-between',
          gap: { xs: 1.25, sm: 2 },
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, minWidth: 0, flex: '1 1 auto' }}>
          <Chip
            label={`Q${qIdx + 1}`}
            size="small"
            color={isAnswered ? 'success' : 'default'}
            sx={{ flexShrink: 0, mt: 0.3 }}
          />
          <Box
            sx={{
              ...richTextWrapRootSx,
              '& p': { m: 0, ...richTextWrapRootSx },
              '& ul, & ol': { mt: 0, mb: 0, pl: 2.25, ...richTextWrapRootSx },
              '& li': { mt: 0.25, ...richTextWrapRootSx },
              '& strong': { fontWeight: 700 },
              '& a': { overflowWrap: 'anywhere', wordBreak: 'break-all' },
            }}
          >
            <Typography
              variant="body2"
              fontWeight={500}
              component="div"
              sx={richTextWrapRootSx}
              dangerouslySetInnerHTML={{ __html: questionHtml }}
            />
          </Box>
        </Box>
        {questionWeight != null && (
          <Chip
            label={`${questionWeight} x`}
            size="small"
            variant="outlined"
            sx={{
              ...weightageChipSx,
              mt: { xs: 0, sm: 0.3 },
              flexShrink: 0,
              alignSelf: 'flex-start',
            }}
          />
        )}
      </Box>

      <Stack spacing={0} divider={<Divider flexItem sx={{ borderColor: 'divider' }} />} sx={{ minWidth: 0, maxWidth: '100%' }}>
        <Box sx={{ pt: 0, pb: 2, minWidth: 0, maxWidth: '100%' }}>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Self
          </Typography>
          {renderSelfColumn()}
        </Box>
        <Box sx={{ py: 2, minWidth: 0, maxWidth: '100%' }}>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Manager
          </Typography>
          {renderManagerColumn()}
        </Box>
      </Stack>
    </Box>
  );
}

const EvaluationQuestionCard = memo(EvaluationQuestionCardInner);

export default EvaluationQuestionCard;
