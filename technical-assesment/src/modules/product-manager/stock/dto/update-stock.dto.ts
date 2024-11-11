import { PartialType } from '@nestjs/mapped-types'
import { CreateStockDto } from './create-stock.dto'
import { IsNotEmpty, IsString } from 'class-validator'

export class UpdateStockDto extends PartialType(CreateStockDto) {
  @IsString()
  @IsNotEmpty()
  id: string
}
