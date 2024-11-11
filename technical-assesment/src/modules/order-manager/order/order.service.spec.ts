import { Test, TestingModule } from '@nestjs/testing'
import { OrderService } from './order.service'
import { PrismaService } from '@commons/prisma/prisma.service'
import { DeepMockProxy, mockDeep } from 'jest-mock-extended'
import { PrismaClient } from '@prisma/client'

describe('OrderService', () => {
  let service: OrderService
  let prismaMock: DeepMockProxy<PrismaClient>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
      ],
    }).compile()

    service = module.get<OrderService>(OrderService)
    prismaMock = module.get(PrismaService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should create order', async () => {
    const products = [
      {
        productId: 'productId',
        quantity: 1,
      },
    ]

    const createOrderDto = {
      customerId: 'customerId',
      products,
    }

    const response = {
      userId: createOrderDto.customerId,
      id: 'orderId',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    }

    const orderResponse = {
      id: response.id,
      customerId: response.userId,
      products: products,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      deletedAt: response.deletedAt,
    }

    prismaMock.order.create.mockResolvedValue(response)
    service.findOne = jest.fn().mockResolvedValue(orderResponse)

    const result = await service.create(createOrderDto, prismaMock)

    expect(result).toEqual(orderResponse)
    expect(prismaMock.order.create).toHaveBeenCalledTimes(1)
  })

  it('should find order', async () => {
    const order = {
      id: 'orderId',
      userId: 'customerId',
    }

    const orderProducts = [
      {
        orderId: order.id,
        productId: 'productId',
        quantity: 1,
        deletedAt: null,
      },
    ]

    const orderWithProducts = {
      ...order,
      orderProducts: orderProducts.map((orderProduct) => {
        return {
          ...orderProduct,
          product: {
            id: orderProduct.productId,
          },
        }
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    }

    const orderResponse = {
      id: orderWithProducts.id,
      customerId: orderWithProducts.userId,
      products: orderWithProducts.orderProducts.map((orderProduct) => {
        if (orderProduct.deletedAt) return null

        return {
          productId: orderProduct.productId,
          quantity: orderProduct.quantity,
        }
      }),
      createdAt: orderWithProducts.createdAt,
      updatedAt: orderWithProducts.updatedAt,
    }

    prismaMock.order.findUnique.mockResolvedValue(orderWithProducts)

    const result = await service.findOne(order.id, prismaMock)

    expect(result).toEqual(orderResponse)
    expect(prismaMock.order.findUnique).toHaveBeenCalledTimes(1)
  })

  it('should update order', async () => {
    const order = {
      id: 'orderId',
      userId: 'customerId',
    }

    const updateOrderDto = {
      customerId: 'customerId',
      products: [
        {
          productId: 'productId',
          quantity: 1,
        },
      ],
    };

    const orderResponse = {
      id: order.id,
      customerId: order.userId,
      products: updateOrderDto.products,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    }

    prismaMock.order.findUnique.mockResolvedValue({
      ...order,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    })

    service.findOne = jest.fn().mockResolvedValue(orderResponse)

    const result = await service.update(order.id, updateOrderDto, prismaMock)

    expect(result).toEqual(orderResponse)
    expect(prismaMock.order.findUnique).toHaveBeenCalledTimes(1)
  })
})
