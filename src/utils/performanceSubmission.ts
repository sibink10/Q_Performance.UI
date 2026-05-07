// @ts-nocheck
import { serializeEvaluationAnswersForApi } from './helpers';

export interface EvaluationAnswerDto {
  questionId: string;
  rating: number;
  comment: string;
}

export interface SelfOrManagerSubmitDto {
  answers: EvaluationAnswerDto[];
}

export interface HrSubmitDto {
  hrOverallRating: number;
  hrComments?: string;
}

export interface HrSubmitInput {
  hrOverallRating: unknown;
  hrComments?: unknown;
}

export const buildSelfOrManagerSubmitPayload = (answers): SelfOrManagerSubmitDto => ({
  answers: serializeEvaluationAnswersForApi(answers),
});

export const buildHrSubmitPayload = (input: HrSubmitInput): HrSubmitDto => {
  const hrOverallRating = Number(input?.hrOverallRating);
  const rawComments = input?.hrComments == null ? '' : String(input.hrComments);
  const trimmedComments = rawComments.trim();

  return {
    hrOverallRating,
    ...(trimmedComments ? { hrComments: trimmedComments } : {}),
  };
};

export const validateHrSubmitInput = (input: HrSubmitInput, ratingScale = 10) => {
  const errors: { hrOverallRating?: string; hrComments?: string } = {};
  const scale =
    typeof ratingScale === 'number' && Number.isFinite(ratingScale) && ratingScale > 0
      ? ratingScale
      : 10;
  const rawRating = input?.hrOverallRating;
  const rating = Number(rawRating);
  const hasNumericRating =
    rawRating !== '' && rawRating != null && Number.isFinite(rating);

  if (!hasNumericRating) {
    errors.hrOverallRating = 'HR overall rating is required.';
  } else if (rating < 0 || rating > scale) {
    errors.hrOverallRating = `HR overall rating must be between 0 and ${scale}.`;
  }

  const comments = input?.hrComments == null ? '' : String(input.hrComments);
  if (comments.length > 2000) {
    errors.hrComments = 'HR comments cannot exceed 2000 characters.';
  }

  return errors;
};
