import { Type } from 'class-transformer'
import { ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsString, Min, ValidateNested } from 'class-validator'

export class CreateOrderDto {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderProductDto)
  @ArrayMinSize(1)
  products: OrderProductDto[]

  @IsString()
  @IsNotEmpty()
  customerId: string
}

export class OrderProductDto {
  @IsString()
  @IsNotEmpty()
  productId: string

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number
}
