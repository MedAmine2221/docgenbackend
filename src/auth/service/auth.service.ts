import { Injectable } from '@nestjs/common';
import { AuthPayloadDTO } from '../dto/auth.dto';
import { UserService } from 'src/user/service/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser({ email, password }: AuthPayloadDTO) {
    const findUser = await this.userService.findUserByMail(email);
    if (!findUser) return null;
    if (password === findUser.password) {
      return {
        access_token: await this.jwtService.signAsync(
          { name: findUser.name, role: findUser.role },
          { secret: this.configService.get('jwt.secretCode') },
        ),
      };
    }
  }
  validateToken(token: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.jwtService.verify(token, {
      secret: this.configService.get('jwt.secretCode'),
    });
  }
}
