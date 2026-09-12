import { UserRole } from 'src/users/user-role.enum';

export interface RequestWithUser extends Request {
  user: {
    userId: number;
    email: string;
    role: UserRole;
  };
}
