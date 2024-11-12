import { Test, TestingModule } from '@nestjs/testing'
import { OrderManagerService } from './order-manager.service'
import { PrismaService } from '@commons/prisma/prisma.service'
import { DeepMockProxy, mockDeep } from 'jest-mock-extended'
import { PrismaClient } from '@prisma/client'
import { PaymentService } from './payment/payment.service'
import { ProductManagerService } from '@modules/product-manager/product-manager.service'
import { EventManagerService } from '@commons/event-manager/event-manager.service'
import { OrderFactory } from '@commons/factories/order.factory'
import { OrderService } from './order/order.service'

describe('OrderManagerService', () => {
  let service: OrderManagerService
  let prismaMock: DeepMockProxy<PrismaClient>
  let orderService: OrderService
  let paymentService: PaymentService
  let productManagerService: ProductManagerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderManagerService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
        {
          provide: OrderService,
          useValue: {
            create: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: PaymentService,
          useValue: {
            create: jest.fn().mockResolvedValue({}),
            userPendingPaymentOrders: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: ProductManagerService,
          useValue: {
            create: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: EventManagerService,
          useValue: {
            emit: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile()

    service = module.get<OrderManagerService>(OrderManagerService)
    prismaMock = module.get(PrismaService)
    orderService = module.get(OrderService)
    paymentService = module.get(PaymentService)
    productManagerService = module.get(ProductManagerService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should create order', async () => {
    const prismaOrderResponse = OrderFactory.createPrismaResponse()[0]

    const request = {
      customerId: prismaOrderResponse.userId,
      products: prismaOrderResponse.orderProducts.map((orderProduct) => {
        return {
          productId: orderProduct.productId,
          quantity: orderProduct.quantity,
        }
      }),
    }

    const transactionResponse = {
      id: prismaOrderResponse.id,
      customerId: prismaOrderResponse.userId,
      products: prismaOrderResponse.orderProducts.map((orderProduct) => {
        return {
          id: orderProduct.productId,
          quantity: orderProduct.quantity,
        }
      }),
      status: prismaOrderResponse.status,
      statusMessage: prismaOrderResponse.statusMessage,
    }

    prismaMock.$transaction.mockResolvedValue(transactionResponse)
    service.canUserOrder = jest.fn().mockResolvedValue(true)
    orderService.create = jest.fn().mockResolvedValue(prismaOrderResponse)
    paymentService.upsertPayment = jest.fn().mockResolvedValue(prismaOrderResponse.Payment[0])
    productManagerService.canProductsBeReserved = jest.fn().mockResolvedValue(true)

    const result = await service.createOrder(request)

    expect(result).toEqual(
      expect.objectContaining({
        id: prismaOrderResponse.id,
        customerId: prismaOrderResponse.userId,
        products: prismaOrderResponse.orderProducts.map((orderProduct) => {
          return {
            id: orderProduct.productId,
            quantity: orderProduct.quantity,
          }
        }),
        status: prismaOrderResponse.status,
        statusMessage: prismaOrderResponse.statusMessage,
      }),
    )
  })

  it('should throw error when user has pending order', async () => {
    const prismaOrderResponse = OrderFactory.createPrismaResponse()[0]

    const orders = [prismaOrderResponse.id]

    paymentService.userPendingPaymentOrders = jest.fn().mockResolvedValue(orders)

    try {
      await service.canUserOrder(prismaOrderResponse.userId)
    } catch (error) {
      expect(error.message).toBe(`User has pending order: ${orders.join(', ')}`)
    }
  })

  it('should get order by id', async () => {
    const prismaOrderResponse = OrderFactory.createPrismaResponse()[0]

    prismaOrderResponse.products = prismaOrderResponse.orderProducts.map((orderProduct) => {
      return {
        ...orderProduct.product,
        quantity: orderProduct.quantity,
      }
    })

    const orderPrice = prismaOrderResponse.products.reduce((acc, product) => acc + product.price * product.quantity, 0)
    const payments = prismaOrderResponse.Payment

    orderService.findOne = jest.fn().mockResolvedValue(prismaOrderResponse)
    paymentService.orderPayments = jest.fn().mockResolvedValue(payments)

    const result = await service.getOrderById(prismaOrderResponse.id)

    expect(result.price).toEqual(orderPrice)
  })
})
