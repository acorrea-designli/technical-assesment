import { PrismaClient } from '@prisma/client'
import { seed as roleSeed } from './seeders/roles/seed'

const prisma = new PrismaClient()

async function main(prisma: PrismaClient) {
  await roleSeed(prisma)
}

main(prisma)
  .then(() => {
    prisma.$disconnect()
  })
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
