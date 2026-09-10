export type ContributionType = 'PROJECT' | 'ACHIEVEMENT';

export interface ContributionEvidence {
  id: string;
  contributionId: string;
  title: string;
  description: string;
  url: string | null;
  recordedAt: string;
}

export interface Contribution {
  id: string;
  cycleId: string;
  employeeId: string;
  type: ContributionType;
  title: string;
  description: string;
  impact: string;
  startDate: string;
  endDate: string | null;
  evidence: ContributionEvidence[];
  createdAt: string;
  updatedAt: string;
}
