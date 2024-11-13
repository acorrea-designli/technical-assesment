import { IsNumber, Min } from 'class-validator'
import { CreateProductDto } from '../product/dto/create-product.dto'

export class CreateProductStockDto extends CreateProductDto {
  @IsNumber()
  @Min(0)
  stock: number
}
