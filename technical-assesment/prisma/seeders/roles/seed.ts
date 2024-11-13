import { PrismaClient } from '@prisma/client'

export async function seed(prisma: PrismaClient) {
  await prisma.role.createMany({
    data: [
      {
        name: 'admin',
      },
      {
        name: 'user',
      },
    ],
    skipDuplicates: true,
  })
}
