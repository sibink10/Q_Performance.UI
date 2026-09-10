import type { CycleStageKey } from '../utils/cycleStageConstants';

export type PerformanceCycleStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';

export type CycleStageStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'LOCKED';

export interface CycleStage {
  id: string;
  cycleId: string;
  stageKey: CycleStageKey;
  name: string;
  startDate: string;
  endDate: string;
  status: CycleStageStatus;
  order: number;
}

export interface PerformanceCycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: PerformanceCycleStatus;
  stages: CycleStage[];
}
