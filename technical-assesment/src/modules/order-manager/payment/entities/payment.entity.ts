import { Exclude, Expose } from 'class-transformer'

export class Payment {
  @Expose()
  id: string

  @Expose()
  orderId: string

  @Expose()
  paymentMethod: string

  @Expose()
  status: string

  @Expose()
  createdAt: Date

  @Expose()
  updatedAt: Date

  @Exclude()
  deletedAt: Date
}
