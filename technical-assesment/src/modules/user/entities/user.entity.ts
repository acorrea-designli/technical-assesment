import { Roles } from '@commons/enums/roles.enum'
import { Exclude } from 'class-transformer'

export class User {
  id: string
  email: string
  name: string
  updatedAt: Date
  createdAt: Date
  role: Roles

  @Exclude()
  deletedAt?: Date

  @Exclude()
  password: string
}
