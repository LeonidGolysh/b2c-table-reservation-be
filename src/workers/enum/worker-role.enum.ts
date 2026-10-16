export enum WorkerRole {
  ADMIN = 'ADM',
  OWNER = 'OWN',
  MANAGER = 'MGR',
  STAFF = 'STF',
}

// Roles that belong to a single restaurant (workers.restaurant_id is set).
export const EMPLOYEE_ROLES = [WorkerRole.MANAGER, WorkerRole.STAFF] as const;

export type EmployeeRole = (typeof EMPLOYEE_ROLES)[number];
