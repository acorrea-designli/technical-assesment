import { Module } from '@nestjs/common'
import { OrderService } from './order.service'
import { BullModule } from '@nestjs/bullmq'
import { ProcessorsEnum } from '@commons/enums/processors.enum'

@Module({
  providers: [OrderService],
  exports: [OrderService],
  imports: [
    BullModule.registerQueue({
      name: ProcessorsEnum.PAYMENT,
      defaultJobOptions: {
        attempts: parseInt(process.env.BACKOFF_RETRIES),
        backoff: {
          type: 'exponential',
          delay: parseInt(process.env.BACKOFF_DELAY),
        },
        removeOnFail: true,
        removeOnComplete: true,
      },
    }),
  ],
})
export class OrderModule {}
