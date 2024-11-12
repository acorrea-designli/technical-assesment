import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { CreatePaymentDto } from './dto/create-payment.dto'
import { Payment } from './entities/payment.entity'
import { TransactionClient } from '@commons/prisma/prisma.types'
import { PrismaService } from '@commons/prisma/prisma.service'
import { PaymentStatus } from './enums/payment.enum'
import { plainToInstance } from 'class-transformer'
import { EventManagerService } from '@commons/event-manager/event-manager.service'

@Injectable()
export class PaymentService {
  constructor(
    readonly prismaService: PrismaService,
    readonly eventEmitter: EventManagerService,
  ) {}

  async upsertPayment(createPaymentDto: CreatePaymentDto, prisma?: TransactionClient): Promise<Payment> {
    const prismaClient = prisma || this.prismaService

    const validPayment = await this.getPendingOrderPayment(createPaymentDto.orderId, prismaClient)

    const update = {}

    if (createPaymentDto.status) update['status'] = createPaymentDto.status
    if (createPaymentDto.paymentMethod) update['paymentMethod'] = createPaymentDto.paymentMethod
    if (createPaymentDto.statusMessage) update['statusMessage'] = createPaymentDto.statusMessage

    const payment = await prismaClient.payment.upsert({
      where: {
        id: validPayment || '',
      },
      update,
      create: {
        orderId: createPaymentDto.orderId,
        paymentMethod: createPaymentDto.paymentMethod,
        status: createPaymentDto.status,
        statusMessage: createPaymentDto.statusMessage,
      },
    })

    const paymentResponse = plainToInstance(Payment, payment, { excludeExtraneousValues: true })

    const order = await prismaClient.order.findUnique({ where: { id: createPaymentDto.orderId } })

    this.eventEmitter.emit('payment.updated', {
      orderId: createPaymentDto.orderId,
      status: createPaymentDto.status,
      statusMessage: createPaymentDto.statusMessage,
      userId: order.userId,
    })
    return paymentResponse
  }

  async getPendingOrderPayment(orderId: string, prisma?: TransactionClient): Promise<string> {
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

  async userPendingPaymentOrders(userId: string, prisma?: TransactionClient): Promise<string[]> {
    const prismaClient = prisma || this.prismaService

    const payments = await prismaClient.payment.findMany({
      where: {
        order: {
          userId,
          deletedAt: null,
        },
        status: 'PENDING',
        deletedAt: null,
      },
      select: {
        orderId: true,
      },
    })

    return payments.map((payment) => payment.orderId)
  }

  async orderPayments(orderId: string, prisma?: TransactionClient): Promise<Payment[]> {
    const prismaClient = prisma || this.prismaService

    return prismaClient.payment.findMany({
      where: {
        orderId,
        deletedAt: null,
      },
    })
  }

  async setOrderPaymentStatus(orderId: string, status: PaymentStatus, message: string, prisma?: TransactionClient) {
    const prismaClient = prisma || this.prismaService

    const payment = await prismaClient.payment.findFirst({
      where: {
        orderId,
        status: PaymentStatus.PENDING,
        deletedAt: null,
      },
    })

    if (!payment) throw new HttpException('Payment not found', HttpStatus.NOT_FOUND)

    await prismaClient.payment.update({
      where: { id: payment.id },
      data: {
        status,
        statusMessage: message,
      },
    })

    const order = await prismaClient.order.findUnique({ where: { id: orderId } })

    this.eventEmitter.emit('payment.updated', {
      orderId,
      status,
      statusMessage: message,
      userId: order.userId,
    })

    return payment.id
  }
}
