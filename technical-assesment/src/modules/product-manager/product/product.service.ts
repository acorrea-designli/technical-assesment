import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { PrismaService } from '@commons/prisma/prisma.service'
import { plainToInstance } from 'class-transformer'
import { Product } from './entities/product.entity'
import { TransactionClient } from '@commons/prisma/prisma.types'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class ProductService {
  private readonly logger: Logger

  constructor(readonly prismaService: PrismaService) {
    this.logger = new Logger(ProductService.name)
  }

  async create(createProductDto: CreateProductDto, prisma?: TransactionClient): Promise<Product> {
    const prismaClient = prisma || this.prismaService

    const existingProduct = await prismaClient.product.findMany({
      where: { name: createProductDto.name, deletedAt: null },
    })

    if (existingProduct?.length) throw new HttpException('Product already exists', HttpStatus.CONFLICT)

    const product = await prismaClient.product.create({ data: createProductDto })
    return plainToInstance(Product, product, { excludeExtraneousValues: true })
  }
}
