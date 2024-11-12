import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { ProductService } from './product/product.service'
import { StockService } from './stock/stock.service'
import { PrismaService } from '@commons/prisma/prisma.service'
import { CreateProductStockDto } from './dto/create-product-stock.dto'
import { ProductStock } from './entities/product-stock.entity'
import { ExceptionHandler } from '@commons/exeptions/handler'
import { UpdateProductStockDto } from './dto/update-product-stock.dto'
import { plainToInstance } from 'class-transformer'
import { TransactionClient } from '@commons/prisma/prisma.types'
import { OnEvent } from '@nestjs/event-emitter'
import { EventManagerService } from '@commons/event-manager/event-manager.service'
import { CacheService } from '@commons/cache/cache.service'

@Injectable()
export class ProductManagerService {
  private readonly logger: Logger

  constructor(
    readonly productService: ProductService,
    readonly stockService: StockService,
    readonly prismaService: PrismaService,
    readonly eventEmitter: EventManagerService,
    readonly cacheService: CacheService,
  ) {
    this.logger = new Logger(ProductManagerService.name)
  }

  async createProduct(createProductDto: CreateProductStockDto): Promise<ProductStock> {
    try {
      const { stock: stockData, ...productData } = createProductDto

      const product: ProductStock = await this.prismaService.$transaction(async (prisma) => {
        const product = await this.productService.create(productData, prisma)
        const stock = await this.stockService.create(
          {
            productId: product.id,
            available: stockData,
            reserved: 0,
          },
          prisma,
        )

        return {
          ...product,
          stock: stock.available,
        }
      })

      await this.cacheService.clear()
      return plainToInstance(ProductStock, product, { excludeExtraneousValues: true })
    } catch (error) {
      ExceptionHandler.handle(error, this.logger)
    }
  }

  async listAllProducts(): Promise<ProductStock[]> {
    try {
      const cachedProducts = await this.cacheService.get('products')
      if (cachedProducts) return cachedProducts

      const products = await this.prismaService.product.findMany({
        where: { deletedAt: null },
        include: { Stock: true },
      })

      const result = products.map((product) => ({
        ...product,
        stock: product.Stock.reduce((acc, stock) => acc + stock.available, 0),
      }))

      await this.cacheService.clear()
      return plainToInstance(ProductStock, result, { excludeExtraneousValues: true })
    } catch (error) {
      ExceptionHandler.handle(error, this.logger)
    }
  }

  async getProductById(id: string): Promise<ProductStock> {
    try {
      const product = await this.prismaService.product.findUnique({
        where: { id, deletedAt: null },
        include: { Stock: true },
      })

      if (!product) throw new HttpException('Product not found', HttpStatus.NOT_FOUND)

      const stock = product.Stock.reduce((acc, stock) => acc + stock.available, 0)

      const result = {
        ...product,
        stock,
      }

      return plainToInstance(ProductStock, result, { excludeExtraneousValues: true })
    } catch (error) {
      ExceptionHandler.handle(error, this.logger)
    }
  }

  async updateProduct(id: string, data: UpdateProductStockDto): Promise<ProductStock> {
    try {
      const existingProduct = await this.prismaService.product.findUnique({
        where: { id, deletedAt: null },
      })

      if (!existingProduct) throw new HttpException('Product not found', HttpStatus.NOT_FOUND)

      const { stock, ...productData } = data

      if (stock)
        await this.prismaService.stock.updateMany({
          where: { productId: id },
          data: { available: stock },
        })

      if (Object.keys(productData).length > 0)
        await this.prismaService.product.update({
          where: { id },
          data: productData,
        })

      await this.cacheService.clear()
      return await this.getProductById(id)
    } catch (error) {
      ExceptionHandler.handle(error, this.logger)
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      const existingProduct = await this.prismaService.product.findUnique({
        where: { id, deletedAt: null },
      })

      if (!existingProduct) throw new HttpException('Product not found', HttpStatus.NOT_FOUND)

      await this.prismaService.product.update({
        where: { id },
        data: { deletedAt: new Date() },
      })

      await this.prismaService.stock.deleteMany({
        where: { productId: id },
      })

      await this.cacheService.clear()
    } catch (error) {
      ExceptionHandler.handle(error, this.logger)
    }
  }

  async canProductsBeReserved(
    products: { productId: string; quantity: number }[],
    prisma?: TransactionClient,
  ): Promise<void> {
    try {
      const prismaClient = prisma || this.prismaService

      const productsData = await prismaClient.product.findMany({
        where: { id: { in: products.map((product) => product.productId) }, deletedAt: null },
        include: { Stock: true },
      })

      for (const { productId, quantity } of products) {
        const product = productsData.find((product) => product.id === productId)

        if (!product) throw new HttpException(`Product ${productId} not found`, HttpStatus.NOT_FOUND)

        const availableStock = product.Stock.reduce((acc, stock) => acc + stock.available, 0)

        if (availableStock < quantity)
          throw new HttpException(
            `Insufficient stock for product ${productId}, available: ${availableStock}, requested: ${quantity}`,
            HttpStatus.BAD_REQUEST,
          )
      }
    } catch (error) {
      ExceptionHandler.handle(error, this.logger)
    }
  }

  @OnEvent('products.reserve', { async: true, promisify: true })
  async reserveProducts(products: { productId: string; quantity: number }[], orderId: string): Promise<void> {
    try {
      const productsData = await this.prismaService.product.findMany({
        where: { id: { in: products.map((product) => product.productId) }, deletedAt: null },
        include: { Stock: true },
      })

      await this.prismaService.$transaction(async (prisma) => {
        for (const { productId, quantity } of products) {
          const product = productsData.find((product) => product.id === productId)

          if (!product) throw new HttpException(`Product ${productId} not found`, HttpStatus.NOT_FOUND)

          const stock = product.Stock.find((stock) => stock.available >= quantity)

          if (!stock) throw new HttpException(`Insufficient stock for product ${productId}`, HttpStatus.BAD_REQUEST)

          await prisma.stock.update({
            where: { id: stock.id },
            data: {
              available: stock.available - quantity,
              reserved: stock.reserved + quantity,
            },
          })
        }
      })

      await this.cacheService.clear()
      this.eventEmitter.emit('order.reserved', orderId)
    } catch (error) {
      this.eventEmitter.emit('order.rejected', orderId, error.message)
    }
  }

  @OnEvent('products.sell', { async: true, promisify: true })
  async sellProducts(products: { productId: string; quantity: number }[], orderId: string): Promise<void> {
    try {
      const productsData = await this.prismaService.product.findMany({
        where: { id: { in: products.map((product) => product.productId) }, deletedAt: null },
        include: { Stock: true },
      })

      await this.prismaService.$transaction(async (prisma) => {
        for (const { productId, quantity } of products) {
          const product = productsData.find((product) => product.id === productId)

          if (!product) throw new HttpException(`Product ${productId} not found`, HttpStatus.NOT_FOUND)

          const stock = product.Stock.find((stock) => stock.reserved >= quantity)

          if (!stock)
            throw new HttpException(`Insufficient reserved stock for product ${productId}`, HttpStatus.BAD_REQUEST)

          await prisma.stock.update({
            where: { id: stock.id },
            data: {
              reserved: stock.reserved - quantity,
            },
          })
        }
      })

      await this.cacheService.clear()
      this.eventEmitter.emit('order.completed', orderId)
    } catch (error) {
      this.eventEmitter.emit('order.rejected', orderId, error.message)
    }
  }

  @OnEvent('products.release', { async: true, promisify: true })
  async releaseProducts(
    products: { productId: string; quantity: number }[],
    orderId: string,
    reason: string,
  ): Promise<void> {
    try {
      const productsData = await this.prismaService.product.findMany({
        where: { id: { in: products.map((product) => product.productId) }, deletedAt: null },
        include: { Stock: true },
      })

      await this.prismaService.$transaction(async (prisma) => {
        for (const { productId, quantity } of products) {
          const product = productsData.find((product) => product.id === productId)

          if (!product) throw new HttpException(`Product ${productId} not found`, HttpStatus.NOT_FOUND)

          const stock = product.Stock.find((stock) => stock.reserved >= quantity)

          await prisma.stock.update({
            where: { id: stock.id },
            data: {
              available: stock.available + quantity,
              reserved: stock.reserved - quantity,
            },
          })
        }
      })

      await this.cacheService.clear()
      this.eventEmitter.emit('order.rejected', orderId, reason)
    } catch (error) {
      this.logger.error(error.message)
    }
  }
}
