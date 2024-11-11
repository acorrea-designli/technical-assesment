import { Product } from '@modules/product-manager/product/entities/product.entity'
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
}

export class OrderProduct extends Product {
  @Expose()
  quantity: number
}
