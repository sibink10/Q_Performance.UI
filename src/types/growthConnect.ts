export type GrowthConnectQuarter = 'Q1' | 'Q2' | 'Q3';

export type GrowthConnectStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'COMPLETED';

export interface GrowthConnect {
  id: string;
  cycleId: string;
  employeeId: string;
  managerId: string;
  quarter: GrowthConnectQuarter;
  status: GrowthConnectStatus;
  employeeReflection: string;
  managerReflection: string;
  achievements: string;
  challenges: string;
  supportNeeded: string;
  submittedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
