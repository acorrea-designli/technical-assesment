import { CreateOrderDto } from '../order/dto/create-order.dto'
import { PickType } from '@nestjs/swagger'

export class UserOrderDto extends PickType(CreateOrderDto, ['products']) {}
