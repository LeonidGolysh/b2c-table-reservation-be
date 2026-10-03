import { UserRole } from 'src/users/user-role.enum';

export interface AuthUser {
  userId: number;
  email: string;
  role: UserRole;
}

export interface RequestWithUser extends Request {
  user: AuthUser;
}
