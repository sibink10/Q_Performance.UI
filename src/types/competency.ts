export interface CompetencyLevel {
  level: number;
  label: string;
  description: string;
}

export interface Competency {
  id: string;
  name: string;
  description: string;
  category: string;
  weight: number;
  levels: CompetencyLevel[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
