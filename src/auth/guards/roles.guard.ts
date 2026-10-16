import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkerRole } from 'src/workers/enum/worker-role.enum';
import { ROLES_KEY } from '../decorator/roles.decorator';
import { AccountKind } from '../enum/account-kind.enum';
import { RequestWithUser } from '../strategies/jwt/interface/user.request.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<WorkerRole[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!roles?.length) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<RequestWithUser>();

    return (
      user?.kind === AccountKind.WORKER &&
      user.role !== null &&
      roles.includes(user.role)
    );
  }
}
