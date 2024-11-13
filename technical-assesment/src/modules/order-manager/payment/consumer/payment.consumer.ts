import { ProcessorsEnum } from '@commons/enums/processors.enum'
import { EventManagerService } from '@commons/event-manager/event-manager.service'
import { PaymentSimulatorService } from '@commons/payment-simulator/payment-simulator.service'
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'

@Processor(ProcessorsEnum.PAYMENT)
export class PaymentConsumer extends WorkerHost {
  private readonly logger: Logger

  constructor(
    readonly paymentSimulator: PaymentSimulatorService,
    readonly eventEmitter: EventManagerService,
  ) {
    super()
    this.logger = new Logger(PaymentConsumer.name)
  }

  async process(job: Job): Promise<void> {
    const orderId = job.data.orderId
    this.logger.debug(`Processing payment for order ${orderId}`)
    await this.paymentSimulator.simulatePayment()
    this.eventEmitter.emit('order.payment.success', orderId)
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    const maxAttempts = job.opts.attempts
    const attemptsMade = job.attemptsMade
    if (attemptsMade < maxAttempts) {
      this.logger.debug(`Retrying job ${job.id} for order ${job.data.orderId}, attempts made: ${attemptsMade}`)
      return
    }

    const orderId = job.data.orderId
    this.logger.error(`Payment failed for order ${orderId}, error: ${error.message}`)
    this.eventEmitter.emit('order.payment.failed', orderId, error.message)
  }
}
