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
    }

    prismaMock.user.create.mockResolvedValue(response)

    const result = await service.create(createUserDto)

    expect(passwordManagerService.hashPassword).toHaveBeenCalledWith(password)
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        email: createUserDto.email,
        name: createUserDto.name,
        password: 'hashedPassword',
      },
    })
    expect(result).toEqual(
      expect.objectContaining({
        email: createUserDto.email,
        name: createUserDto.name,
      }),
    )

    expect(prismaMock.user.create).toHaveBeenCalledTimes(1)
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
