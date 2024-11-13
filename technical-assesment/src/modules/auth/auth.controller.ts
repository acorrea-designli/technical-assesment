import { Body, Controller, Post } from '@nestjs/common'
import { AuthService } from './auth.service'
import { SignInDto } from './dto/sign-in.dto'
import { CreateUserDto } from '@modules/user/dto/create-user.dto'

@Controller('auth')
export class AuthController {
  constructor(readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() signInDto: SignInDto) {
    return this.authService.sigIn(signInDto)
  }

  @Post('register')
  async register(@Body() signUpDto: CreateUserDto) {
    return this.authService.signUp(signUpDto)
  }
}
