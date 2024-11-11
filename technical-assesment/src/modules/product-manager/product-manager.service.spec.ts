import { Test, TestingModule } from '@nestjs/testing'
import { ProductManagerService } from './product-manager.service'
import { PrismaClient } from '@prisma/client'
import { DeepMockProxy, mockDeep } from 'jest-mock-extended'
import { PrismaService } from '@commons/prisma/prisma.service'
import { ProductService } from './product/product.service'
import { StockService } from './stock/stock.service'

describe('ProductManagerService', () => {
  let service: ProductManagerService
  let prismaMock: DeepMockProxy<PrismaClient>
  let productService: ProductService
  let stockService: StockService

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
      ],
    }).compile()

    service = module.get<ProductManagerService>(ProductManagerService)
    prismaMock = module.get(PrismaService)
    productService = module.get(ProductService)
    stockService = module.get(StockService)

    Reflect.set(service, 'logger', { log: (_: unknown) => {}, error: (_: unknown) => {} })
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should create product', async () => {
    const createProductDto = {
      name: 'Product Name',
      description: 'Product Description',
      stock: 10,
      price: 10,
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
    const id = 'Product Id'

    prismaMock.product.findUnique.mockResolvedValue({
      id,
      name: 'Product Name',
      description: 'Product Description',
      price: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    })

    await service.deleteProduct(id)

    expect(prismaMock.product.update).toHaveBeenCalledTimes(1)
    expect(prismaMock.stock.deleteMany).toHaveBeenCalledTimes(1)
    expect(prismaMock.stock.deleteMany).toHaveBeenCalledWith({
      where: { productId: id },
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
})
