import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { LoginDto, RegisterDto } from './dto/index';
import { comparePassword } from 'src/utils/bcrypt.utils';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    @Inject('USER_SERVICE')
    private readonly userClient: ClientProxy,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const checkUser = await lastValueFrom(
      this.userClient.send({ cmd: 'get_user_email' }, registerDto.email),
    );
    if (checkUser)
      throw new RpcException(
        new ConflictException('Email account already exists'),
      );

    const user = await lastValueFrom(
      this.userClient.send({ cmd: 'create_user' }, registerDto),
    );

    const publicUser = this.excludeKey(user, ['password']);

    return {
      user: publicUser,
      token: this.createAccessToken(publicUser),
    };
  }

  async login(loginDto: LoginDto) {
    const user = await lastValueFrom(
      this.userClient.send({ cmd: 'get_user_email' }, loginDto.email),
    );
    if (!user)
      throw new RpcException(
        new UnauthorizedException('Email or password wrong'),
      );

    const isValid = await comparePassword(loginDto.password, user.password);
    if (!isValid)
      throw new RpcException(
        new UnauthorizedException('Email or password wrong'),
      );

    const publicUser = this.excludeKey(user, ['password']);

    return {
      user: publicUser,
      token: this.createAccessToken(publicUser),
    };
  }

  validateToken(token: string) {
    return this.jwtService.verify(token, {
      secret: process.env.SECRET,
    });
  }

  private createAccessToken(user: any): string {
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      { secret: process.env.SECRET },
    );
  }

  private excludeKey(object: any, keys: any) {
    return Object.fromEntries(
      Object.entries(object).filter(([key]) => !keys.includes(key)),
    );
  }
}
