import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { UserModule } from '@modules/user/user.module'
import { JwtModule } from '@nestjs/jwt'
import { AuthController } from './auth.controller'

@Module({
  providers: [AuthService],
  imports: [
    UserModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN },
    }),
  ],
  controllers: [AuthController],
})
export class AuthModule {}
