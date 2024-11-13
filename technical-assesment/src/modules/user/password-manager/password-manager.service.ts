import { Injectable } from '@nestjs/common'
import bcrypt from 'bcrypt'

@Injectable()
export class PasswordManagerService {
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10)
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword)
  }
}
