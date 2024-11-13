import { Exclude, Expose } from 'class-transformer'

export class Stock {
  @Expose()
  id: string

  @Expose()
  productId: string

  @Expose()
  available: number

  @Expose()
  reserved: number

  @Exclude()
  createdAt: Date

  @Exclude()
  updatedAt: Date

  @Exclude()
  deletedAt?: Date
}
