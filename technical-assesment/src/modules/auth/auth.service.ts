import { UserService } from '@modules/user/user.service'
import { HttpException, Injectable, Logger } from '@nestjs/common'
import { SignInDto } from './dto/sign-in.dto'
import { JwtService } from '@nestjs/jwt'
import { Jwt } from './entities/jwt.entity'
import { ExceptionHandler } from '@commons/exeptions/handler'
import { CreateUserDto } from '@modules/user/dto/create-user.dto'

@Injectable()
export class AuthService {
  private readonly logger: Logger

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {
    this.logger = new Logger(AuthService.name)
  }

  async sigIn(signInDto: SignInDto): Promise<Jwt> {
    try {
      const validUser = await this.userService.validateUser(signInDto.email, signInDto.password)
      if (!validUser) throw new HttpException('Invalid credentials', 401)

      const user = await this.userService.findByEmail(signInDto.email)

      const payload = { email: user.email, sub: user.id, name: user.name, role: user.role }

      return {
        access_token: this.jwtService.sign(payload),
      }
    } catch (error) {
      ExceptionHandler.handle(error, this.logger)
    }
  }

  async signUp(signUpDto: CreateUserDto): Promise<Jwt> {
    try {
      const user = await this.userService.create(signUpDto)

      const payload = { email: user.email, sub: user.id, name: user.name, role: user.role }

      return {
        access_token: this.jwtService.sign(payload),
      }
    } catch (error) {
      ExceptionHandler.handle(error, this.logger)
    }
  }
}
