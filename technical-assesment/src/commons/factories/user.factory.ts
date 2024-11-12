import { CreateUserDto } from '@modules/user/dto/create-user.dto'
import { faker } from '@faker-js/faker'

export class UserFactory {
  static create(ammount: number = 1): CreateUserDto[] {
    const users = []

    for (let i = 0; i < ammount; i++) {
      users.push({
        email: faker.internet.email(),
        password: faker.internet.password(),
        name: faker.person.firstName,
      })
    }

    return users
  }

  static createPrismaResponse(ammount: number = 1) {
    const users = []

    for (let i = 0; i < ammount; i++) {
      const createUserDto = UserFactory.create()[0]

      users.push({
        ...createUserDto,
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
      })
    }

    return users
  }
}
