import { Module } from '@nestjs/common';
import { EventManagerService } from './event-manager.service';
import { EventConsumerService } from './consumers/event-consumer.service';

@Module({
  providers: [EventManagerService, EventConsumerService],
})
export class EventManagerModule {}
