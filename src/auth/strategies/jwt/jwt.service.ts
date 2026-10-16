import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWT_SECRET } from '../../auth.constant';
import { AccountKind } from '../../enum/account-kind.enum';
import { AuthUser, JwtPayload } from './interface/user.request.interface';

@Injectable()
export class JwtService extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: JWT_SECRET,
    });
  }

  validate(payload: JwtPayload): AuthUser {
    // Tokens issued before the users/workers split have no kind; reject them
    // so an old owner token can't be read as a customer id.
    if (!Object.values(AccountKind).includes(payload.kind)) {
      throw new UnauthorizedException();
    }

    return {
      userId: payload.id,
      email: payload.email,
      kind: payload.kind,
      role: payload.role ?? null,
      restaurantId: payload.restaurantId ?? null,
    };
  }
}
