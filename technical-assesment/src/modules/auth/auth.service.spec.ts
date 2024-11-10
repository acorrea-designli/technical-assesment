import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { JwtModule, JwtService } from '@nestjs/jwt'
import { UserService } from '@modules/user/user.service'
import { UserModule } from '@modules/user/user.module'
import { UserFactory } from '@commons/factories/user.factory'
import { faker } from '@faker-js/faker/.'
import { Roles } from '@commons/enums/roles.enum'

describe('AuthService', () => {
  let service: AuthService
  let jwtService: JwtService
  let userService: UserService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            validateUser: jest.fn(),
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    jwtService = module.get<JwtService>(JwtService)
    userService = module.get<UserService>(UserService)

    Reflect.set(service, 'logger', { log: (_: unknown) => {}, error: (_: unknown) => {} })
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should validate user', async () => {
    const user = UserFactory.create()[0]
    const dbUser = {
      id: faker.string.uuid(),
      email: user.email,
      password: user.password,
      name: user.name,
      updatedAt: new Date(),
      createdAt: new Date(),
      deletedAt: null,
      role: Roles.USER,
    }

    jest.spyOn(userService, 'validateUser').mockResolvedValue(true)
    jest.spyOn(userService, 'findByEmail').mockResolvedValue(dbUser)
    jest.spyOn(jwtService, 'sign').mockReturnValue('token')

    const result = await service.sigIn({ email: user.email, password: user.password })

    expect(result).toEqual({ access_token: 'token' })
    expect(userService.validateUser).toHaveBeenCalledWith(user.email, user.password)
    expect(userService.findByEmail).toHaveBeenCalledWith(user.email)
    expect(jwtService.sign).toHaveBeenCalledWith({
      email: dbUser.email,
      sub: dbUser.id,
      name: dbUser.name,
      role: dbUser.role,
    })
  })

  it('should return invalid credentials', async () => {
    jest.spyOn(userService, 'validateUser').mockResolvedValue(false)

    try {
      await service.sigIn({ email: 'email', password: 'password' })
    } catch (error) {
      expect(error.message).toBe('Invalid credentials')
    }

    expect(userService.validateUser).toHaveBeenCalledWith('email', 'password')
    expect(userService.findByEmail).not.toHaveBeenCalled()
    expect(jwtService.sign).not.toHaveBeenCalled()
  })

  it('should create user', async () => {
    const user = UserFactory.create()[0]
    const dbUser = {
      id: faker.string.uuid(),
      email: user.email,
      password: user.password,
      name: user.name,
      updatedAt: new Date(),
      createdAt: new Date(),
      deletedAt: null,
      role: Roles.USER,
    }

    jest.spyOn(userService, 'create').mockResolvedValue(dbUser)
    jest.spyOn(jwtService, 'sign').mockReturnValue('token')

    const result = await service.signUp(user)

    expect(result).toEqual({ access_token: 'token' })
    expect(userService.create).toHaveBeenCalledWith(user)
    expect(jwtService.sign).toHaveBeenCalledWith({
      email: dbUser.email,
      sub: dbUser.id,
      name: dbUser.name,
      role: dbUser.role,
    })
  })
})
