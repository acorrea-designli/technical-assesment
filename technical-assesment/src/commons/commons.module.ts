import { Module } from '@nestjs/common'
import { PrismaModule } from './prisma/prisma.module'
import { PaymentSimulatorModule } from './payment-simulator/payment-simulator.module'

@Module({
  imports: [PrismaModule, PaymentSimulatorModule],
})
export class CommonsModule {}
