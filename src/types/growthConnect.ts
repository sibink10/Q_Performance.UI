import type { GoalStatus } from './goal';

export type GrowthConnectCycleStatus = 'DRAFT' | 'OPEN' | 'CLOSED';

export interface GrowthConnectCycle {
  id: string;
  financialYearId: string;
  name: string;
  sequenceNo: number;
  startDate: string;
  endDate: string;
  status: GrowthConnectCycleStatus;
  createdByName?: string;
}

export interface GoalGrowthConnectEntry {
  id: string;
  goalId: string;
  cycleId: string;
  cycleName: string;
  cycleSequenceNo: number;
  cycleStatus: GrowthConnectCycleStatus;
  cycleStartDate: string;
  cycleEndDate: string;

  employeeUpdate?: string;
  employeeSubmittedAt?: string;
  employeeSubmittedByName?: string;

  managerStatus?: GoalStatus;
  managerFeedback?: string;
  managerSubmittedAt?: string;
  managerSubmittedByName?: string;

  /** Computed server-side: admin has opened the cycle and the prior cycle is fully closed. */
  isEmployeeEditable: boolean;
  /** Computed server-side: employee has submitted and manager has not yet submitted. */
  isManagerEditable: boolean;
}
