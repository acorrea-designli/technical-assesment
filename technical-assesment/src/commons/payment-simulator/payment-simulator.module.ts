import { Global, Module } from '@nestjs/common'
import { PaymentSimulatorService } from './payment-simulator.service'

@Global()
@Module({
  providers: [PaymentSimulatorService],
  exports: [PaymentSimulatorService],
})
export class PaymentSimulatorModule {}
