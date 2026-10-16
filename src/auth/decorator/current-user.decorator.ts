import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  AuthUser,
  RequestWithUser,
} from '../strategies/jwt/interface/user.request.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();

    return request.user;
  },
);
