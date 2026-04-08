import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../roles.decorator';
import { AuthService } from 'src/auth/service/auth.service';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflactor: Reflector,
    private authService: AuthService,
  ) {}
  matchRoles(roles: string[], userRole: string) {
    return roles.some((role) => role === userRole);
  }
  async canActivate(context: ExecutionContext): Promise<any> {
    const roles = this.reflactor.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (roles?.length === 0) {
      return true;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const { authorization } = request.headers as { authorization?: string };

    if (!authorization || authorization.trim() === '') {
      throw new UnauthorizedException('Please provide token');
    }

    const authToken = authorization.replace(/bearer/gim, '').trim();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const resp = await this.authService.validateToken(authToken);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return roles.includes(resp.role.name_fr || resp.role.name_eng);
  }
}
