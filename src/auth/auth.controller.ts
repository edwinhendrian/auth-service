import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern } from '@nestjs/microservices';
import { LoginDto, RegisterDto } from './dto/index';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: 'register' })
  register(registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @MessagePattern({ cmd: 'login' })
  login(loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @MessagePattern({ cmd: 'validate_token' })
  validateToken(token: string) {
    return this.authService.validateToken(token);
  }
}
