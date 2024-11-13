import { Global, Module } from '@nestjs/common'
import { EventManagerService } from './event-manager.service'
import { EventConsumerService } from './consumers/event-consumer.service'
import { BullModule } from '@nestjs/bullmq'
import { ProcessorsEnum } from '@commons/enums/processors.enum'

@Global()
@Module({
  providers: [EventManagerService, EventConsumerService],
  imports: [
    BullModule.registerQueue({
      name: ProcessorsEnum.EVENT,
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
  exports: [EventManagerService],
})
export class EventManagerModule {}
