import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'
import { PrismaService } from '@commons/prisma/prisma.service'
import { User } from './entities/user.entity'
import { PasswordManagerService } from './password-manager/password-manager.service'
import { plainToInstance } from 'class-transformer'

@Injectable()
export class UserService {
  private readonly logger: Logger

  constructor(
    readonly passwordManagerService: PasswordManagerService,
    readonly prismaService: PrismaService,
  ) {
    this.logger = new Logger(UserService.name)
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await this.passwordManagerService.hashPassword(createUserDto.password)

    const role = await this.prismaService.role.findUnique({
      where: {
        name: createUserDto.role,
      },
    })

    if (!role) throw new HttpException('Role not found', HttpStatus.BAD_REQUEST)

    const existingUser = await this.prismaService.user.findUnique({
      where: {
        email: createUserDto.email,
      },
    })

    if (existingUser) {
      if (existingUser.deletedAt === null) throw new HttpException('User already exists', HttpStatus.CONFLICT)
      else if (existingUser.deletedAt) {
        await this.prismaService.user.delete({
          where: {
            id: existingUser.id,
          },
        })
      }
    }

    const user = await this.prismaService.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        name: createUserDto.name,
        Role: {
          connect: {
            id: role.id,
          },
        },
      },
      include: {
        Role: true,
      },
    })

    const result = {
      ...user,
      role: user.Role.name,
    }

    return plainToInstance(User, result)
  }

  async findAll(): Promise<User[]> {
    const users = await this.prismaService.user.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        Role: true,
      },
    })

    return plainToInstance(
      User,
      users.map((user) => ({ ...user, role: user.Role.name })),
    )
  }

  async findOne(id: string): Promise<User> {
    const user = await this.prismaService.user.findUnique({
      where: {
        id,
      },
      include: {
        Role: true,
      },
    })

    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND)

    const result = {
      ...user,
      role: user.Role.name,
    }

    return plainToInstance(User, result)
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
      include: {
        Role: true,
      },
    })

    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND)

    const result = {
      ...user,
      role: user.Role.name,
    }

    return plainToInstance(User, result)
  }

  async validateUser(email: string, password: string): Promise<Boolean> {
    const user = await this.prismaService.user.findUnique({
      where: {
        email,
        deletedAt: null,
      },
    })

    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND)

    return await this.passwordManagerService.comparePassword(password, user.password)
  }
}
