import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import { OrderManagerService } from './order-manager.service'
import { CreateOrderDto } from './order/dto/create-order.dto'
import { AuthGuard } from '@modules/auth/guards/auth.guard'
import { ApiBearerAuth } from '@nestjs/swagger'
import { UserOrderDto } from './dto/user-order.dto'

@Controller('orders')
export class OrderManagerController {
  constructor(readonly orderManagerService: OrderManagerService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async createOrder(@Body() data: UserOrderDto, @Req() req) {
    return this.orderManagerService.createOrder({
      ...data,
      customerId: req.user.sub,
    })
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async getOrder(@Param('id') id: string) {
    return this.orderManagerService.getOrderById(id)
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async listOrders(@Req() req) {
    return this.orderManagerService.userOrders(req.user.sub)
  }
}
