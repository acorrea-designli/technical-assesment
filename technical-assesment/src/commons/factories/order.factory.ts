import { PaymentStatus } from './../../modules/order-manager/payment/enums/payment.enum'
import { OrderStatus } from './../../modules/order-manager/order/enums/order.enum'
import { faker } from '@faker-js/faker'
import { ProductFactory } from './product.factory'

export class OrderFactory {
  static createPrismaResponse(ammount: number = 1) {
    const orders = new Array()

    for (let i = 0; i < ammount; i++) {
      const product = ProductFactory.createPrismaResponse(1)[0]
      const orderID = faker.string.uuid()

      const order = {
        id: orderID,
        userID: faker.string.uuid(),
        status: OrderStatus.PENDING,
        statusMessage: faker.lorem.sentence(),
        orderProducts: [
          {
            id: faker.string.uuid(),
            orderId: orderID,
            productId: product.id,
            quantity: faker.number.int({
              min: 1,
              max: product.Stock[0].available,
            }),
            product: product,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
        ],
        Payment: [
          {
            id: faker.string.uuid(),
            status: PaymentStatus.PENDING,
            statusMessage: faker.lorem.sentence(),
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            orderId: orderID,
            paymentMethod: faker.finance.transactionType(),
          },
        ],
      }

      orders.push(order)
    }

    return orders
  }
}
