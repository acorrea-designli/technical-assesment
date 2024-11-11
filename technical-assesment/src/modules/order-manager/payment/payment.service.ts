import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { CreatePaymentDto } from './dto/create-payment.dto'
import { Payment } from './entities/payment.entity'
import { TransactionClient } from '@commons/prisma/prisma.types'
import { PrismaService } from '@commons/prisma/prisma.service'
import { PaymentStatus } from './enums/payment.enum'
import { plainToInstance } from 'class-transformer'
import { EventEmitter2 } from '@nestjs/event-emitter'

@Injectable()
export class PaymentService {
  constructor(
    readonly prismaService: PrismaService,
    readonly eventEmitter: EventEmitter2,
  ) {}

  async upsertPayment(createPaymentDto: CreatePaymentDto, prisma: TransactionClient): Promise<Payment> {
    const prismaClient = prisma || this.prismaService

    const validPayment = await this.getPendingOrderPayment(createPaymentDto.orderId, prismaClient)

    const update = {}

    if (createPaymentDto.status) update['status'] = createPaymentDto.status
    if (createPaymentDto.paymentMethod) update['paymentMethod'] = createPaymentDto.paymentMethod

    const payment = await prismaClient.payment.upsert({
      where: {
        id: validPayment,
      },
      update,
      create: {
        orderId: createPaymentDto.orderId,
        paymentMethod: createPaymentDto.paymentMethod,
        status: createPaymentDto.status,
      },
    })

    const paymentResponse = plainToInstance(Payment, payment, { excludeExtraneousValues: true })

    this.eventEmitter.emit('payment.updated', { data: paymentResponse })
    return paymentResponse
  }

  async getPendingOrderPayment(orderId: string, prisma: TransactionClient): Promise<string> {
    const prismaClient = prisma || this.prismaService

    const order = await prismaClient.order.findUnique({
      where: { id: orderId },
      include: { Payment: true },
    })

    if (!order) throw new HttpException('Order not found', HttpStatus.NOT_FOUND)
    if (order.Payment?.some((payment) => payment.status === PaymentStatus.PAID))
      throw new HttpException('Order already paid', HttpStatus.BAD_REQUEST)

    const validPayment = order.Payment?.find((payment) => payment.status === PaymentStatus.PENDING)
    return validPayment?.id
  }
}
