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
import { CreatePaymentDto } from './payment/dto/create-payment.dto'
import { PaymentStatus } from './payment/enums/payment.enum'

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

  async testWebsocket() {
    this.eventEmitter.emit('order.test', 'Hello world!')
  }

  async createOrder(data: CreateOrderDto): Promise<OrderWithPayment> {
    const order = await this.prismaService.$transaction(async (prisma) => {
      await this.canUserOrder(data.customerId, prisma)

      const order = await this.orderService.create(data, prisma)

      const paymentDto = new CreatePaymentDto()
      paymentDto.orderId = order.id
      paymentDto.paymentMethod = ''

      const payment = await this.paymentService.upsertPayment(paymentDto, prisma)

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

    this.eventEmitter.emit('order.created', order.id)
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
          price: order.products.reduce((acc, product) => acc + product?.price * product?.quantity || 0, 0),
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
        price: order.products?.reduce((acc, product) => acc + product?.price * product?.quantity || 0, 0),
      }))

      return plainToInstance(OrderWithPayment, result, { excludeExtraneousValues: true })
    } catch (error) {
      ExceptionHandler.handle(error, this.logger)
    }
  }

  @OnEvent('order.created')
  async handleOrderCreated(orderId: string) {
    const order = await this.orderService.findOne(orderId)

    const products = order.products.map((product) => ({
      productId: product.id,
      quantity: product.quantity,
    }))

    this.eventEmitter.emit('products.reserve', products, orderId)
  }

  @OnEvent('order.payment.success')
  async handleOrderPaymentSuccess(orderId: string) {
    await this.paymentService.setOrderPaymentStatus(orderId, PaymentStatus.PAID, 'Payment successful')

    const order = await this.orderService.findOne(orderId)

    const products = order.products.map((product) => ({
      productId: product.id,
      quantity: product.quantity,
    }))

    this.eventEmitter.emit('products.sell', products, orderId)
  }

  @OnEvent('order.payment.failed')
  async handleOrderPaymentFailed(orderId: string, message: string) {
    await this.paymentService.setOrderPaymentStatus(orderId, PaymentStatus.FAILED, message)

    const order = await this.orderService.findOne(orderId)

    const products = order.products.map((product) => ({
      productId: product.id,
      quantity: product.quantity,
    }))

    this.eventEmitter.emit('products.release', products, orderId, message)
  }
}
