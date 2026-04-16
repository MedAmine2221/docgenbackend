/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthPayloadDTO } from '../dto/auth.dto';
import { UserService } from 'src/user/service/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser({ email, password }: AuthPayloadDTO) {
    const findUser = await this.userService.findUserByMail(email);

    if (!findUser) {
      throw new UnauthorizedException("User not found");
    }

    if (!(await bcrypt.compare(password, findUser.password))) {
      throw new UnauthorizedException("Invalid password");
    }

    return {
      userInfo: findUser,
      access_token: await this.jwtService.signAsync(
        { name: findUser.name, email: findUser.email, role: findUser.role },
        { secret: this.configService.get('jwt.secretCode') },
      ),
    };
  }
  validateToken(token: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.jwtService.verify(token, {
      secret: this.configService.get('jwt.secretCode'),
    });
  }
}
