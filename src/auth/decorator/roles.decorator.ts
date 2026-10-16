import { SetMetadata } from '@nestjs/common';
import { WorkerRole } from 'src/workers/enum/worker-role.enum';

export const ROLES_KEY = 'roles';

// Restricts a route to workers with one of the given roles. Use together with
// JwtAuthGuard and RolesGuard. A method-level @Roles overrides the class one.
export const Roles = (...roles: WorkerRole[]) => SetMetadata(ROLES_KEY, roles);
