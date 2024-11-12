import { Test, TestingModule } from '@nestjs/testing'
import { OrderService } from './order.service'
import { PrismaService } from '@commons/prisma/prisma.service'
import { DeepMockProxy, mockDeep } from 'jest-mock-extended'
import { PrismaClient } from '@prisma/client'
import { OrderFactory } from '@commons/factories/order.factory'
import { EventManagerService } from '@commons/event-manager/event-manager.service'

describe('OrderService', () => {
  let service: OrderService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
        {
          provide: OrderService,
          useValue: {
            findOne: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: EventManagerService,
          useValue: {
            emit: jest.fn().mockResolvedValue({}),
          },
        }
      ],
    }).compile()

    service = module.get<OrderService>(OrderService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
