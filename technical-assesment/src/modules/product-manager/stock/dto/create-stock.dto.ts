import { IsNotEmpty, IsNumber, IsString, Min, IsOptional } from 'class-validator'

export class CreateStockDto {
  @IsString()
  @IsNotEmpty()
  productId: string

  @IsNumber()
  @Min(0)
  @IsOptional()
  available: number = 0

  @IsNumber()
  @Min(0)
  @IsOptional()
  reserved: number = 0
}
