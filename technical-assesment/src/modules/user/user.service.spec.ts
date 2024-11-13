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
    const prismaUserResponse = UserFactory.createPrismaResponse()[0]

    const request = {
      email: prismaUserResponse.email,
      name: prismaUserResponse.name,
      password: 'password',
      role: prismaUserResponse.Role.name,
    }

    prismaMock.role.findUnique.mockResolvedValue(prismaUserResponse.Role)
    prismaMock.user.findUnique.mockResolvedValue(null)
    prismaMock.user.create.mockResolvedValue(prismaUserResponse)

    const result = await service.create(request)

    expect(passwordManagerService.hashPassword).toHaveBeenCalledWith(request.password)
    expect(result).toEqual(
      expect.objectContaining({
        email: request.email,
        name: request.name,
        role: request.role,
      }),
    )

    expect(prismaMock.user.create).toHaveBeenCalledTimes(1)
  })

  it('should throw error when user already exists', async () => {
    const prismaUserResponse = UserFactory.createPrismaResponse()[0]

    const request = {
      email: prismaUserResponse.email,
      name: prismaUserResponse.name,
      password: 'password',
      role: prismaUserResponse.Role.name,
    }

    prismaMock.role.findUnique.mockResolvedValue(prismaUserResponse.Role)
    prismaMock.user.findUnique.mockResolvedValue(prismaUserResponse)

    try {
      await service.create(request)
    } catch (error) {
      expect(error.message).toBe('User already exists')
    }

    expect(prismaMock.user.create).not.toHaveBeenCalled()
  })

  it('should validate user', async () => {
    const prismaUserResponse = UserFactory.createPrismaResponse()[0]

    const request = {
      email: prismaUserResponse.email,
      name: prismaUserResponse.name,
      password: 'password',
      role: prismaUserResponse.Role.name,
    }

    prismaMock.user.findUnique.mockResolvedValue(prismaUserResponse)

    const result = await service.validateUser(request.email, request.password)

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: {
        email: request.email,
        deletedAt: null,
      },
    })
    expect(result).toBeTruthy()
  })
})
