import { Injectable, Logger } from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'
import { PrismaService } from '@commons/prisma/prisma.service'
import { User } from './entities/user.entity'
import { PasswordManagerService } from './password-manager/password-manager.service'
import { plainToInstance } from 'class-transformer'

@Injectable()
export class UserService {
  readonly logger: Logger

  constructor(
    readonly passwordManagerService: PasswordManagerService,
    readonly prismaService: PrismaService,
  ) {
    this.logger = new Logger(UserService.name)
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await this.passwordManagerService.hashPassword(createUserDto.password)

    const user = await this.prismaService.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        name: createUserDto.name,
      },
    })

    return plainToInstance(User, user)
  }

  async findAll(): Promise<User[]> {
    const users = await this.prismaService.user.findMany({
      where: {
        deletedAt: null,
      },
    })

    return plainToInstance(User, users)
  }

  async findOne(id: string): Promise<User> {
    const user = await this.prismaService.user.findUnique({
      where: {
        id,
      },
    })

    return plainToInstance(User, user)
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    })

    return plainToInstance(User, user)
  }

  async validateUser(email: string, password: string): Promise<Boolean> {
    const user = await this.prismaService.user.findUnique({
      where: {
        email,
        deletedAt: null,
      },
    })

    if (!user) return null

    return await this.passwordManagerService.comparePassword(password, user.password)
  }
}
