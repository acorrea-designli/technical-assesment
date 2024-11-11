import { PrismaService } from '@commons/prisma/prisma.service'
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { OrderService } from './order/order.service'
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter'
import { CreateOrderDto } from './order/dto/create-order.dto'
import { TransactionClient } from '@commons/prisma/prisma.types'
import { PaymentService } from './payment/payment.service'
import { ProductManagerService } from '@modules/product-manager/product-manager.service'
import { OrderWithPayment } from './entity/order-payment.entity'
import { ExceptionHandler } from '@commons/exeptions/handler'
import { plainToInstance } from 'class-transformer'

@Injectable()
export class OrderManagerService {
  private readonly logger: Logger

  constructor(
    readonly orderService: OrderService,
    readonly paymentService: PaymentService,
    readonly productManagerService: ProductManagerService,
    readonly prismaService: PrismaService,
    readonly eventEmitter: EventEmitter2,
  ) {
    this.logger = new Logger(OrderManagerService.name)
  }

  async createOrder(data: CreateOrderDto): Promise<OrderWithPayment> {
    const order = await this.prismaService.$transaction(async (prisma) => {
      await this.canUserOrder(data.customerId, prisma)

      const order = await this.orderService.create(data, prisma)
      const payment = await this.paymentService.upsertPayment(
        { orderId: order.id, status: 'PENDING', paymentMethod: '' },
        prisma,
      )

      let totalPrice = 0

      const products = order.products.map((product) => {
        totalPrice += product.price * product.quantity

        return {
          productId: product.id,
          quantity: product.quantity,
        }
      })

      await this.productManagerService.canProductsBeReserved(products, prisma)

      return {
        ...order,
        payments: [payment],
        price: totalPrice,
      }
    })

    for (const product of order.products) this.eventEmitter.emit('product.reserve', product.id, product.quantity)

    this.eventEmitter.emit('order.created', order)
    return order
  }

  async canUserOrder(userId: string, prisma?: TransactionClient) {
    const prismaClient = prisma || this.prismaService
    const userOrders = await this.paymentService.userPendingPaymentOrders(userId, prismaClient)
    if (userOrders.length > 0)
      throw new HttpException(`User has pending order: ${userOrders.join(', ')}`, HttpStatus.BAD_REQUEST)
  }

  async getOrderById(orderId: string): Promise<OrderWithPayment> {
    try {
      const order = await this.orderService.findOne(orderId)
      const payments = await this.paymentService.orderPayments(orderId)

      const result = plainToInstance(
        OrderWithPayment,
        {
          ...order,
          payments,
          price: order.products.reduce((acc, product) => acc + product.price * product.quantity, 0),
        },
        { excludeExtraneousValues: true },
      )

      return result
    } catch (error) {
      ExceptionHandler.handle(error, this.logger)
    }
  }

  async userOrders(userId: string): Promise<OrderWithPayment[]> {
    try {
      const orders = await this.orderService.findByCustomerId(userId)

      const orderIds = orders.map((order) => order.id)
      const payments = await this.prismaService.payment.findMany({
        where: { orderId: { in: orderIds }, deletedAt: null },
      })

      const result = orders.map((order) => ({
        ...order,
        payments: payments.filter((payment) => payment.orderId === order.id),
        price: order.products.reduce((acc, product) => acc + product.price * product.quantity, 0),
      }))

      return plainToInstance(OrderWithPayment, result, { excludeExtraneousValues: true })
    } catch (error) {
      ExceptionHandler.handle(error, this.logger)
    }
  }
}
