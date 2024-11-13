import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { PasswordManagerService } from './password-manager/password-manager.service';

@Module({
  providers: [UserService, PasswordManagerService],
  exports: [UserService],
})
export class UserModule {}
