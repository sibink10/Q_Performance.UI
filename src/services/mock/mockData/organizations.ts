import type { Organization } from '../../../types/organization';

export const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Sales',
  'Finance',
  'Human Resources',
] as const;

export const mockOrganization: Organization = {
  id: 'org-001',
  name: 'QHRMS Technologies',
  departments: [...DEPARTMENTS],
};
