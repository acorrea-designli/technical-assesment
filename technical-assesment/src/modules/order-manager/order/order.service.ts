import { OrderProduct } from '@prisma/client'
import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { CreateOrderDto } from './dto/create-order.dto'
import { UpdateOrderDto } from './dto/update-order.dto'

import { TransactionClient } from '@commons/prisma/prisma.types'
import { Order } from './entities/order.entity'
import { PrismaService } from '@commons/prisma/prisma.service'
import { plainToInstance } from 'class-transformer'

@Injectable()
export class OrderService {
  constructor(readonly prismaService: PrismaService) {}

  async create(createOrderDto: CreateOrderDto, prisma: TransactionClient): Promise<Order> {
    const prismaClient = prisma || this.prismaService

    const order = await prismaClient.order.create({
      data: {
        userId: createOrderDto.customerId,
      },
    })

    const orderProducts = createOrderDto.products.map((product) => {
      return {
        orderId: order.id,
        productId: product.productId,
        quantity: product.quantity,
      }
    })

    await prismaClient.orderProduct.createMany({
      data: orderProducts,
    })

    return await this.findOne(order.id, prismaClient)
  }

  async findOne(id: string, prisma: TransactionClient): Promise<Order> {
    const prismaClient = prisma || this.prismaService

    const orderWithProducts = await prismaClient.order.findUnique({
      where: { id: id, deletedAt: null },
      include: {
        orderProducts: { include: { product: {} } },
      },
    })

    const orderResponse: Order = {
      id: orderWithProducts.id,
      customerId: orderWithProducts.userId,
      products: orderWithProducts.orderProducts.map((orderProduct: OrderProduct) => {
        if (orderProduct.deletedAt) return null

        return {
          productId: orderProduct.productId,
          quantity: orderProduct.quantity,
        }
      }),
      createdAt: orderWithProducts.createdAt,
      updatedAt: orderWithProducts.updatedAt,
      deletedAt: orderWithProducts.deletedAt,
    }

    return plainToInstance(Order, orderResponse, { excludeExtraneousValues: true })
  }

  async update(id: string, updateOrderDto: UpdateOrderDto, prisma: TransactionClient) {
    const prismaClient = prisma || this.prismaService

    const order = await prismaClient.order.findUnique({
      where: { id, deletedAt: null },
    })

    if (!order) throw new HttpException('Order not found', HttpStatus.NOT_FOUND)
    if (!updateOrderDto.customerId && !updateOrderDto.products) return await this.findOne(id, prismaClient)

    if (updateOrderDto.customerId) {
      await prismaClient.order.update({
        where: { id },
        data: {
          userId: updateOrderDto.customerId,
        },
      })
    }

    if (updateOrderDto.products) {
      await prismaClient.orderProduct.deleteMany({
        where: { orderId: id, deletedAt: null },
      })

      const orderProducts = updateOrderDto.products.map((product) => {
        return {
          orderId: id,
          productId: product.productId,
          quantity: product.quantity,
        }
      })

      await prismaClient.orderProduct.createMany({
        data: orderProducts,
      })
    }

    return await this.findOne(id, prismaClient)
  }

  async remove(id: string, prisma: TransactionClient): Promise<Order> {
    const prismaClient = prisma || this.prismaService

    const order = await prismaClient.order.findUnique({
      where: { id, deletedAt: null },
    })

    if (!order) throw new HttpException('Order not found', HttpStatus.NOT_FOUND)

    await prismaClient.order.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    })

    return await this.findOne(id, prismaClient)
  }
}
