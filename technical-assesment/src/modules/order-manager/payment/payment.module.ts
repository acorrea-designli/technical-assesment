import { Module } from '@nestjs/common'
import { PaymentService } from './payment.service'
import { PaymentConsumer } from './consumer/payment.consumer'

@Module({
  providers: [PaymentService, PaymentConsumer],
  exports: [PaymentService],
})
export class PaymentModule {}
