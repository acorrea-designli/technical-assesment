import { Test, TestingModule } from '@nestjs/testing'
import { ProductManagerService } from './product-manager.service'
import { PrismaClient } from '@prisma/client'
import { DeepMockProxy, mockDeep } from 'jest-mock-extended'
import { PrismaService } from '@commons/prisma/prisma.service'
import { ProductService } from './product/product.service'
import { StockService } from './stock/stock.service'
import { ProductFactory } from '@commons/factories/product.factory'
import { EventManagerService } from '@commons/event-manager/event-manager.service'
import { CacheService } from '@commons/cache/cache.service'

describe('ProductManagerService', () => {
  let service: ProductManagerService
  let prismaMock: DeepMockProxy<PrismaClient>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductManagerService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
        {
          provide: ProductService,
          useValue: {
            create: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: StockService,
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
        {
          provide: CacheService,
          useValue: {
            clear: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile()

    service = module.get<ProductManagerService>(ProductManagerService)
    prismaMock = module.get(PrismaService)

    Reflect.set(service, 'logger', { log: (_: unknown) => {}, error: (_: unknown) => {} })
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should create product', async () => {
    const productPrismaResponse = ProductFactory.createPrismaResponse()[0]

    const createProductDto = {
      name: productPrismaResponse.name,
      description: productPrismaResponse.description,
      stock: productPrismaResponse.Stock.stock,
      price: productPrismaResponse.price,
    }

    await service.createProduct(createProductDto)

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1)
  })

  it('should list all products', async () => {
    prismaMock.product.findMany.mockResolvedValue([])

    await service.listAllProducts()

    expect(prismaMock.product.findMany).toHaveBeenCalledTimes(1)
    expect(prismaMock.product.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      include: { Stock: true },
    })
  })

  it('should throw error when id not found', async () => {
    prismaMock.product.findUnique.mockResolvedValue(null)

    await expect(service.getProductById('Product Id')).rejects.toThrow('Product not found')

    expect(prismaMock.product.findUnique).toHaveBeenCalledTimes(1)
    expect(prismaMock.product.findUnique).toHaveBeenCalledWith({
      where: { id: 'Product Id', deletedAt: null },
      include: { Stock: true },
    })
  })

  it('should delete product', async () => {
    const productPrismaResponse = ProductFactory.createPrismaResponse()[0]

    prismaMock.product.findUnique.mockResolvedValue(productPrismaResponse)

    await service.deleteProduct(productPrismaResponse.id)

    expect(prismaMock.product.update).toHaveBeenCalledTimes(1)
    expect(prismaMock.stock.deleteMany).toHaveBeenCalledTimes(1)
    expect(prismaMock.stock.deleteMany).toHaveBeenCalledWith({
      where: { productId: productPrismaResponse.id },
    })
  })

  it('should throw error when delete product not found', async () => {
    prismaMock.product.findUnique.mockResolvedValue(null)

    await expect(service.deleteProduct('Product Id')).rejects.toThrow('Product not found')

    expect(prismaMock.product.findUnique).toHaveBeenCalledTimes(1)
    expect(prismaMock.product.findUnique).toHaveBeenCalledWith({
      where: { id: 'Product Id', deletedAt: null },
    })
  })

  it('should not throw error when user can reserve products', async () => {
    const products = ProductFactory.createPrismaResponse(2)
    const request = [{ productId: products[0].id, quantity: products[0].Stock.available - 1 }]

    prismaMock.product.findMany.mockResolvedValue(products)

    await service.canProductsBeReserved(request)

    expect(prismaMock.product.findMany).toHaveBeenCalledTimes(1)
  })

  it('should throw error when user can not reserve products', async () => {
    const products = ProductFactory.createPrismaResponse(2)
    const request = [{ productId: products[0].id, quantity: products[0].Stock.available + 1 }]

    prismaMock.product.findMany.mockResolvedValue(products)

    try {
      await service.canProductsBeReserved(request)
    } catch (error) {
      expect(error.message).toContain('Insufficient stock for product')
    }

    expect(prismaMock.product.findMany).toHaveBeenCalledTimes(1)
  })
})
