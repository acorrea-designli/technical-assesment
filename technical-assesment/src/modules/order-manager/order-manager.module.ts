import { Module } from '@nestjs/common';
import { PaymentModule } from './payment/payment.module';
import { OrderModule } from './order/order.module';

@Module({
  imports: [PaymentModule, OrderModule]
})
export class OrderManagerModule {}
