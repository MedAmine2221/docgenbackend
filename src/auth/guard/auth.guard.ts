/* eslint-disable prettier/prettier */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../service/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const request = context.switchToHttp().getRequest();
      const { authorization } = request?.headers as { authorization?: string };

      if (!authorization || authorization.trim() === '') {
        throw new UnauthorizedException('Please provide token');
      }

      const authToken = authorization.replace(/bearer/gim, '').trim();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const resp = await this.authService.validateToken(authToken);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      request?.decodedData = resp;

      return true;
    } catch (error) {
      throw new UnauthorizedException(
        error?.message || 'session expired! Please sign In',
      );
    }
  }
}
