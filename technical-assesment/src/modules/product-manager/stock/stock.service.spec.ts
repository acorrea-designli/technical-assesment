import { Test, TestingModule } from '@nestjs/testing'
import { StockService } from './stock.service'
import { PrismaClient } from '@prisma/client'
import { DeepMockProxy, mockDeep } from 'jest-mock-extended'
import { PrismaService } from '@commons/prisma/prisma.service'

describe('StockService', () => {
  let service: StockService
  let prismaMock: DeepMockProxy<PrismaClient>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
      ],
    }).compile()

    service = module.get<StockService>(StockService)
    prismaMock = module.get(PrismaService)

    Reflect.set(service, 'logger', { log: (_: unknown) => {}, error: (_: unknown) => {} })
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should create stock', async () => {
    const createStockDto = {
      productId: 'Product Id',
      available: 10,
      reserved: 0,
    }

    const response = {
      ...createStockDto,
      id: 'Stock Id',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    }

    prismaMock.stock.create.mockResolvedValue(response)

    const result = await service.create(createStockDto)
    expect(result).toEqual({
      ...createStockDto,
      id: response.id
    })

    expect(prismaMock.stock.create).toHaveBeenCalledTimes(1)
  })
})
