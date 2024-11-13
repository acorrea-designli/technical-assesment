import { Product } from '@modules/product-manager/product/entities/product.entity'
import { OrderStatus } from '@prisma/client'
import { Exclude, Expose } from 'class-transformer'

export class Order {
  @Expose()
  id: string

  @Expose()
  products: OrderProduct[]

  @Expose()
  customerId: string

  @Expose()
  createdAt: Date

  @Expose()
  updatedAt: Date

  @Exclude()
  deletedAt: Date

  @Expose()
  status: OrderStatus

  @Expose()
  statusMessage: string
}

export class OrderProduct extends Product {
  @Expose()
  quantity: number
}
