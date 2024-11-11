import { Expose } from 'class-transformer'
import { Product } from '../product/entities/product.entity'

export class ProductStock extends Product {
  @Expose()
  stock: number
}
