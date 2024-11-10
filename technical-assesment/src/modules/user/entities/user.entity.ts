import { Exclude } from 'class-transformer'

export class User {
  id: string
  email: string
  name: string
  updatedAt: Date
  createdAt: Date

  @Exclude()
  deletedAt?: Date

  @Exclude()
  password: string
}
