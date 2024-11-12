import { Test, TestingModule } from '@nestjs/testing'
import { PaymentService } from './payment.service'
import { DeepMockProxy, mockDeep } from 'jest-mock-extended'
import { OrderStatus, PaymentStatus, PrismaClient } from '@prisma/client'
import { PrismaService } from '@commons/prisma/prisma.service'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { EventManagerService } from '@commons/event-manager/event-manager.service'

describe('PaymentService', () => {
  let service: PaymentService
  let prismaMock: DeepMockProxy<PrismaClient>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
        {
          provide: EventManagerService,
          useValue: {
            emit: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile()

    service = module.get<PaymentService>(PaymentService)
    prismaMock = module.get(PrismaService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should upsert payment', async () => {
    const createPaymentDto = {
      orderId: 'orderId',
      status: PaymentStatus.PENDING,
      statusMessage: 'statusMessage',
      paymentMethod: 'paymentMethod',
    }

    const response = {
      id: 'paymentId',
      orderId: createPaymentDto.orderId,
      status: createPaymentDto.status,
      statusMessage: createPaymentDto.statusMessage,
      paymentMethod: createPaymentDto.paymentMethod,
      updatedAt: new Date(),
      createdAt: new Date(),
    }

    service.getPendingOrderPayment = jest.fn().mockResolvedValue('paymentId')
    prismaMock.payment.upsert.mockResolvedValue({
      ...response,
      deletedAt: null,
    })
    prismaMock.order.findUnique.mockResolvedValue({
      id: createPaymentDto.orderId,
      status: OrderStatus.PENDING,
      statusMessage: 'statusMessage',
      updatedAt: new Date(),
      createdAt: new Date(),
      userId: 'userId',
      deletedAt: null,
    })

    const paymentResponse = await service.upsertPayment(createPaymentDto, prismaMock)

    expect(paymentResponse).toEqual(response)
  })

  it('should get pending order payment', async () => {
    const orderId = 'orderId'

    const order = {
      id: orderId,
      status: OrderStatus.PENDING,
      statusMessage: 'statusMessage',
      Payment: [
        {
          id: 'paymentId',
          status: PaymentStatus.PENDING,
          statusMessage: 'statusMessage',
          paymentMethod: 'paymentMethod',
        },
      ],
      updatedAt: new Date(),
      createdAt: new Date(),
      userId: 'userId',
    }

    prismaMock.order.findUnique.mockResolvedValue({
      ...order,
      deletedAt: null,
    })

    const paymentId = await service.getPendingOrderPayment(orderId, prismaMock)

    expect(paymentId).toEqual(order.Payment[0].id)
  })

  it('should throw error when order not found', async () => {
    const orderId = 'orderId'

    prismaMock.order.findUnique.mockResolvedValue(null)

    await expect(service.getPendingOrderPayment(orderId, prismaMock)).rejects.toThrow('Order not found')
  })

  it('should throw error when order already paid', async () => {
    const orderId = 'orderId'

    const order = {
      id: orderId,
      status: OrderStatus.PENDING,
      statusMessage: 'statusMessage',
      Payment: [
        {
          id: 'paymentId',
          status: PaymentStatus.PAID,
          statusMessage: 'statusMessage',
          paymentMethod: 'paymentMethod',
        },
      ],
      updatedAt: new Date(),
      createdAt: new Date(),
      userId: 'userId',
    }

    prismaMock.order.findUnique.mockResolvedValue({
      ...order,
      deletedAt: null,
    })

    await expect(service.getPendingOrderPayment(orderId, prismaMock)).rejects.toThrow('Order already paid')
  })

  it('should return user pending payment orders', async () => {
    const userId = 'userId'

    const payments = [
      {
        id: 'paymentId1',
        orderId: 'orderId1',
        userId,
        status: PaymentStatus.PENDING,
        statusMessage: 'statusMessage',
        paymentMethod: 'paymentMethod',
        deletedAt: null,
        updatedAt: new Date(),
        createdAt: new Date(),
      },
      {
        id: 'paymentId2',
        orderId: 'orderId2',
        userId,
        status: PaymentStatus.PENDING,
        statusMessage: 'statusMessage',
        paymentMethod: 'paymentMethod',
        deletedAt: null,
        updatedAt: new Date(),
        createdAt: new Date(),
      },
    ]

    prismaMock.payment.findMany.mockResolvedValue(payments)

    const response = await service.userPendingPaymentOrders(userId, prismaMock)

    expect(response).toEqual(['orderId1', 'orderId2'])
  })
})
