import { Exclude, Expose } from 'class-transformer'

export class Product {
  @Expose()
  id: string

  @Expose()
  name: string

  @Expose()
  description: string

  @Expose()
  price: number

  @Expose()
  createdAt: Date

  @Expose()
  updatedAt: Date

  @Exclude()
  deletedAt?: Date
}
