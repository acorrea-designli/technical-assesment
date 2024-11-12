import { ProcessorsEnum } from '@commons/enums/processors.enum'
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { Job } from 'bullmq'

@Processor(ProcessorsEnum.EVENT)
export class EventConsumerService extends WorkerHost {
  private readonly logger: Logger
  constructor(readonly eventEmitter: EventEmitter2) {
    super()
    this.logger = new Logger(EventConsumerService.name)
  }

  async process(job: Job) {
    this.logger.debug(`Processing event ${job.data.event}`)
    this.eventEmitter.emit(job.data.event, job.data.values)
  }
}
