import { Module } from '@nestjs/common'
import { PrismaModule } from './prisma/prisma.module'
import { PaymentSimulatorModule } from './payment-simulator/payment-simulator.module'
import { EventManagerModule } from './event-manager/event-manager.module';
import { CacheModule } from './cache/cache.module';
@Module({
  imports: [PrismaModule, PaymentSimulatorModule, EventManagerModule, CacheModule],
})
export class CommonsModule {}
