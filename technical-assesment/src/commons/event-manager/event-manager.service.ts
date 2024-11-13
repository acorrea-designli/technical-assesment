import { ProcessorsEnum } from '@commons/enums/processors.enum'
import { InjectQueue } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { Queue } from 'bullmq'

@Injectable()
export class EventManagerService {
  constructor(@InjectQueue(ProcessorsEnum.EVENT) readonly eventConsummer: Queue) {}

  emit(event: string, ...values: any[]) {
    this.eventConsummer.add(ProcessorsEnum.EVENT, {
      event,
      values,
    })
  }
}
