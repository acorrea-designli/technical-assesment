import { Injectable, Logger } from '@nestjs/common'
import { CreateStockDto } from './dto/create-stock.dto'
import { Stock } from './entities/stock.entity'
import { PrismaService } from '@commons/prisma/prisma.service'
import { plainToInstance } from 'class-transformer'
import { TransactionClient } from '@commons/prisma/prisma.types'

@Injectable()
export class StockService {
  private readonly logger: Logger

  constructor(readonly prismaService: PrismaService) {
    this.logger = new Logger(StockService.name)
  }

  async create(createStockDto: CreateStockDto, prisma?: TransactionClient): Promise<Stock> {
    const prismaClient = prisma || this.prismaService

    await prismaClient.stock.deleteMany({
      where: { productId: createStockDto.productId },
    })

    const stock = await prismaClient.stock.create({
      data: createStockDto,
    })

    return plainToInstance(Stock, stock, { excludeExtraneousValues: true })
  }
}
