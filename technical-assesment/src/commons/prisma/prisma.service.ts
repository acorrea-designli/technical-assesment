import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { AppEnvironment } from '@commons/enums/app.enum'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger: Logger

  constructor() {
    super({
      log: process.env.ENV === AppEnvironment.DEV ? ['query', 'error', 'info', 'warn'] : undefined,
    })
    this.logger = new Logger(PrismaService.name)
  }

  async clearDatabase(): Promise<void> {
    if (process.env.ENV === AppEnvironment.TEST) {
      const tableNames = await this.$queryRaw<
        Array<{ tablename: string }>
      >`SELECT tablename FROM pg_tables WHERE schemaname='public' and tablename NOT IN ('_prisma_migrations')`

      const tablesToTruncate = tableNames.map(({ tablename }) => `"public"."${tablename}"`)

      try {
        await this.$executeRawUnsafe(`TRUNCATE TABLE ${tablesToTruncate};`)
      } catch (error) {
        this.logger.error(error)
      }
    }
  }

  async onModuleInit(): Promise<void> {
    await this.$connect()
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect()
  }

  async getMockedService(): Promise<PrismaService> {
    return new PrismaService()
  }
}
