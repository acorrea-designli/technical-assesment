import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { ProductService } from './product/product.service'
import { StockService } from './stock/stock.service'
import { PrismaService } from '@commons/prisma/prisma.service'
import { CreateProductStockDto } from './dto/create-product-stock.dto'
import { ProductStock } from './entities/product-stock.entity'
import { ExceptionHandler } from '@commons/exeptions/handler'
import { UpdateProductStockDto } from './dto/update-product-stock.dto'
import { plainToInstance } from 'class-transformer'

@Injectable()
export class ProductManagerService {
  private readonly logger: Logger

  constructor(
    readonly productService: ProductService,
    readonly stockService: StockService,
    readonly prismaService: PrismaService,
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

      return plainToInstance(ProductStock, product, { excludeExtraneousValues: true })
    } catch (error) {
      ExceptionHandler.handle(error, this.logger)
    }
  }

  async listAllProducts(): Promise<ProductStock[]> {
    try {
      const products = await this.prismaService.product.findMany({
        where: { deletedAt: null },
        include: { Stock: true },
      })

      const result = products.map((product) => ({
        ...product,
        stock: product.Stock.reduce((acc, stock) => acc + stock.available, 0),
      }))
      
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
    } catch (error) {
      ExceptionHandler.handle(error, this.logger)
    }
  }
}