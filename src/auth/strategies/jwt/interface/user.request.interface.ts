import { WorkerRole } from 'src/workers/enum/worker-role.enum';
import { AccountKind } from 'src/auth/enum/account-kind.enum';

export interface JwtPayload {
  id: number;
  email: string;
  kind: AccountKind;
  role?: WorkerRole;
  restaurantId?: number | null;
}

export interface AuthUser {
  userId: number;
  email: string;
  kind: AccountKind;
  // Set only for workers.
  role: WorkerRole | null;
  restaurantId: number | null;
}

export interface RequestWithUser extends Request {
  user: AuthUser;
}
