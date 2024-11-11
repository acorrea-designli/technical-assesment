import { Module } from '@nestjs/common'
import { PaymentModule } from './payment/payment.module'
import { OrderModule } from './order/order.module'
import { OrderManagerService } from './order-manager.service'
import { OrderManagerController } from './order-manager.controller'
import { ProductManagerModule } from '@modules/product-manager/product-manager.module'

@Module({
  imports: [PaymentModule, OrderModule, ProductManagerModule],
  providers: [OrderManagerService],
  controllers: [OrderManagerController],
})
export class OrderManagerModule {}
