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
      signOptions: { expiresIn: '12h' },
    }),
  ],
  controllers: [AuthController],
})
export class AuthModule {}
