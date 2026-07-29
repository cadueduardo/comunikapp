import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ADMIN_JWT_STRATEGY } from './admin.constants';

@Injectable()
export class AdminAuthGuard extends AuthGuard(ADMIN_JWT_STRATEGY) {
  handleRequest<TUser>(
    error: Error | null,
    user: TUser | false,
  ): TUser {
    if (error || !user) {
      throw (
        error ||
        new UnauthorizedException('Sessão administrativa inválida.')
      );
    }
    return user;
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
