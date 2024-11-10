import { Test, TestingModule } from '@nestjs/testing'
import { UserService } from './user.service'
import { PasswordManagerService } from './password-manager/password-manager.service'
import { PrismaService } from '@commons/prisma/prisma.service'
import { mockDeep, DeepMockProxy } from 'jest-mock-extended'
import { PrismaClient } from '@prisma/client'
import { UserFactory } from '@commons/factories/user.factory'
import { faker } from '@faker-js/faker/.'

describe('UserService', () => {
  let service: UserService
  let prismaMock: DeepMockProxy<PrismaClient>
  let passwordManagerService: PasswordManagerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PasswordManagerService,
          useValue: {
            hashPassword: jest.fn().mockResolvedValue('hashedPassword'),
            comparePassword: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
      ],
    }).compile()

    service = module.get<UserService>(UserService)
    passwordManagerService = module.get<PasswordManagerService>(PasswordManagerService)
    prismaMock = module.get(PrismaService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should create user', async () => {
    const createUserDto = UserFactory.create(1)[0]

    const { password, ...createUserDtoWithoutPassword } = createUserDto
    const response = {
      ...createUserDtoWithoutPassword,
      id: faker.string.uuid(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      password: 'hashedPassword',
      roleId: faker.string.uuid(),
      Role: {
        id: faker.string.uuid(),
        name: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    }

    prismaMock.role.findUnique.mockResolvedValue(response.Role)
    prismaMock.user.findUnique.mockResolvedValue(null)
    prismaMock.user.create.mockResolvedValue(response)

    const result = await service.create(createUserDto)

    expect(passwordManagerService.hashPassword).toHaveBeenCalledWith(password)
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        email: createUserDto.email,
        name: createUserDto.name,
        password: 'hashedPassword',
        Role: {
          connect: {
            id: response.Role.id,
          },
        },
      },
      include: {
        Role: true,
      },
    })
    expect(result).toEqual(
      expect.objectContaining({
        email: createUserDto.email,
        name: createUserDto.name,
        role: response.Role.name,
      }),
    )

    expect(prismaMock.user.create).toHaveBeenCalledTimes(1)
  })

  it('should throw error when user already exists', async () => {
    const createUserDto = UserFactory.create(1)[0]

    const { password, ...createUserDtoWithoutPassword } = createUserDto
    const response = {
      ...createUserDtoWithoutPassword,
      id: faker.string.uuid(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      password: 'hashedPassword',
      roleId: faker.string.uuid(),
      Role: {
        id: faker.string.uuid(),
        name: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    }

    prismaMock.role.findUnique.mockResolvedValue(response.Role)
    prismaMock.user.findUnique.mockResolvedValue(response)

    try {
      await service.create(createUserDto)
    } catch (error) {
      expect(error.message).toBe('User already exists')
    }

    expect(prismaMock.user.create).not.toHaveBeenCalled()
  })

  it('should validate user', async () => {
    const createUserDto = UserFactory.create(1)[0]
    const { password, ...createUserDtoWithoutPassword } = createUserDto
    const dbUser = {
      ...createUserDtoWithoutPassword,
      id: faker.string.uuid(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      password: 'hashedPassword',
      roleId: faker.string.uuid(),
      Role: {
        id: faker.string.uuid(),
        name: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    }

    prismaMock.user.findUnique.mockResolvedValue(dbUser)

    const result = await service.validateUser(createUserDto.email, createUserDto.password)

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: {
        email: createUserDto.email,
        deletedAt: null,
      },
    })
    expect(result).toBeTruthy()
  })
})
