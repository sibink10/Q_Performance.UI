import type { AuditLogEntry } from '../../../types/auditLog';
import type { CalibrationRecord } from '../../../types/calibration';
import type { CareerRecommendation } from '../../../types/careerRecommendation';
import type { Competency } from '../../../types/competency';
import type { Contribution } from '../../../types/contribution';
import type { DevelopmentPlan } from '../../../types/developmentPlan';
import type { FinalOutcome } from '../../../types/finalOutcome';
import type { Goal } from '../../../types/goal';
import type { GoalRevision } from '../../../types/goalRevision';
import type { GrowthConnect } from '../../../types/growthConnect';
import type { GrowthDiscussion } from '../../../types/growthDiscussion';
import type { ManagerAssessment } from '../../../types/managerAssessment';
import type { Notification } from '../../../types/notification';
import type { Organization } from '../../../types/organization';
import type { PerformanceCycle } from '../../../types/performanceCycle';
import type { PerformanceImprovementPlan } from '../../../types/pip';
import type { SelfAppraisal } from '../../../types/selfAppraisal';
import type { MockUser } from '../../../types/user';
import { mockGoals } from './goals';
import { mockOrganization } from './organizations';
import { mockPerformanceCycles } from './performanceCycles';
import { mockUsers } from './users';

export interface MockSeed {
  users: MockUser[];
  organization: Organization;
  performanceCycles: PerformanceCycle[];
  goals: Goal[];
  goalRevisions: GoalRevision[];
  growthConnects: GrowthConnect[];
  contributions: Contribution[];
  selfAppraisals: SelfAppraisal[];
  managerAssessments: ManagerAssessment[];
  competencies: Competency[];
  growthDiscussions: GrowthDiscussion[];
  calibrations: CalibrationRecord[];
  finalOutcomes: FinalOutcome[];
  careerRecommendations: CareerRecommendation[];
  developmentPlans: DevelopmentPlan[];
  pips: PerformanceImprovementPlan[];
  notifications: Notification[];
  auditLogs: AuditLogEntry[];
}

/**
 * Returns relationally consistent mock seed data.
 * Later prompts append domain arrays here as features are built.
 */
export function seed(): MockSeed {
  return {
    users: mockUsers,
    organization: mockOrganization,
    performanceCycles: mockPerformanceCycles,
    goals: mockGoals,
    goalRevisions: [],
    growthConnects: [],
    contributions: [],
    selfAppraisals: [],
    managerAssessments: [],
    competencies: [],
    growthDiscussions: [],
    calibrations: [],
    finalOutcomes: [],
    careerRecommendations: [],
    developmentPlans: [],
    pips: [],
    notifications: [],
    auditLogs: [],
  };
}

export { mockUsers, mockOrganization, mockPerformanceCycles };
export { ACTIVE_CYCLE_ID } from './performanceCycles';
export { DEPARTMENTS } from './organizations';
