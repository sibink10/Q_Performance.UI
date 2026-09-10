import type { FinalRatingKey } from '../utils/ratingScaleConstants';

export type CalibrationStatus = 'PENDING' | 'IN_REVIEW' | 'CALIBRATED' | 'FINALIZED';

export interface CalibrationRecord {
  id: string;
  cycleId: string;
  employeeId: string;
  managerId: string;
  preCalibrationRating: FinalRatingKey | null;
  calibratedRating: FinalRatingKey | null;
  status: CalibrationStatus;
  calibratedById: string | null;
  notes: string;
  calibratedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
