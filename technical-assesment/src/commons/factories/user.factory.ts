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
}
