import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AccountKind } from '../enum/account-kind.enum';
import { RequestWithUser } from '../strategies/jwt/interface/user.request.interface';

function hasKind(context: ExecutionContext, kind: AccountKind): boolean {
  const { user } = context.switchToHttp().getRequest<RequestWithUser>();

  return user?.kind === kind;
}

// Use after JwtAuthGuard. Allows customer accounts (users table) only.
@Injectable()
export class CustomerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return hasKind(context, AccountKind.USER);
  }
}

// Use after JwtAuthGuard. Allows any business account (workers table).
@Injectable()
export class WorkerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return hasKind(context, AccountKind.WORKER);
  }
}
