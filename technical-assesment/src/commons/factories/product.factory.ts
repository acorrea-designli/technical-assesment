import { faker } from '@faker-js/faker'

export class ProductFactory {
  static createPrismaResponse(ammount: number = 1) {
    const products = new Array()

    for (let i = 0; i < ammount; i++) {
      const product = {
        id: faker.string.uuid(),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: faker.commerce.price(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        Stock: [
          {
            id: faker.string.uuid(),
            productId: faker.string.uuid(),
            available: faker.number.int({
              min: 2,
              max: 100,
            }),
            reserved: faker.number.int({
              min: 0,
              max: 10,
            }),
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
        ],
      }

      products.push(product)
    }

    return products
  }
}
