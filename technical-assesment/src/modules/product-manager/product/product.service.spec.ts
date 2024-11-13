import { Test, TestingModule } from '@nestjs/testing'
import { ProductService } from './product.service'
import { DeepMockProxy, mockDeep } from 'jest-mock-extended'
import { PrismaClient } from '@prisma/client'
import { PrismaService } from '@commons/prisma/prisma.service'
import { faker } from '@faker-js/faker/.'

describe('ProductService', () => {
  let service: ProductService
  let prismaMock: DeepMockProxy<PrismaClient>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
      ],
    }).compile()

    service = module.get<ProductService>(ProductService)
    prismaMock = module.get(PrismaService)

    Reflect.set(service, 'logger', { log: (_: unknown) => {}, error: (_: unknown) => {} })
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should create product', async () => {
    const createProductDto = {
      name: 'Product Name',
      description: 'Product Description',
      price: 100,
    }

    const response = {
      ...createProductDto,
      id: faker.string.uuid(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    }

    prismaMock.product.findMany.mockResolvedValue([])
    prismaMock.product.create.mockResolvedValue(response)

    const result = await service.create(createProductDto)
    expect(result).toEqual({
      ...createProductDto,
      id: response.id,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
    })

    expect(prismaMock.product.create).toHaveBeenCalledTimes(1)
    expect(prismaMock.product.findMany).toHaveBeenCalledTimes(1)

    expect(prismaMock.product.create).toHaveBeenCalledWith({ data: createProductDto })
    expect(prismaMock.product.findMany).toHaveBeenCalledWith({
      where: { name: createProductDto.name, deletedAt: null },
    })
  })

  it('should not create product if already exists', async () => {
    const createProductDto = {
      name: 'Product Name',
      description: 'Product Description',
      price: 100,
    }

    const response = {
      ...createProductDto,
      id: faker.string.uuid(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    }

    prismaMock.product.findMany.mockResolvedValue([response])

    try {
      await service.create(createProductDto)
    } catch (error) {
      expect(error.message).toBe('Product already exists')
    }

    expect(prismaMock.product.create).not.toHaveBeenCalled()
    expect(prismaMock.product.findMany).toHaveBeenCalledTimes(1)

    expect(prismaMock.product.findMany).toHaveBeenCalledWith({
      where: { name: createProductDto.name, deletedAt: null },
    })
  })

  it('should use transaction to create product', async () => {
    const createProductDto = {
      name: 'Product Name',
      description: 'Product Description',
      price: 100,
    }

    const createProductStockDto = {
      stock: 10,
      ...createProductDto,
    }

    const response = {
      ...createProductDto,
      id: faker.string.uuid(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    }

    prismaMock.$transaction.mockImplementation((fn) => fn(prismaMock))
    prismaMock.product.create.mockResolvedValue(response)

    const result = await service.create(createProductStockDto, prismaMock)
    expect(result).toEqual({
      ...createProductDto,
      id: response.id,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
    })

    expect(prismaMock.product.create).toHaveBeenCalledTimes(1)
  })
})
