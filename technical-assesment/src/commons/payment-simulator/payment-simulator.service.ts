import { Injectable, Logger } from '@nestjs/common'
@Injectable()
export class PaymentSimulatorService {
  private logger: Logger

  constructor() {
    this.logger = new Logger(PaymentSimulatorService.name)
  }

  async simulatePayment(): Promise<void> {
    const paymentFailedProbability = parseInt(process.env.PAYMENT_FAILED_PROBABILITY) || 0
    const paymentduration = parseInt(process.env.PAYMENT_DURATION) || 1000

    await new Promise((resolve) => setTimeout(resolve, paymentduration))

    if (Math.random() * 100 < paymentFailedProbability) {
      this.logger.debug('Payment failed')
      throw new Error('Payment failed')
    }

    this.logger.debug('Payment success')
  }
}
