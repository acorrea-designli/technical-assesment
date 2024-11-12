import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ModulesModule } from './modules/modules.module'
import { CommonsModule } from './commons/commons.module'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { BullModule } from '@nestjs/bullmq'

@Module({
  imports: [
    ModulesModule,
    CommonsModule,
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLER_TTL),
        limit: parseInt(process.env.THROTTLER_LIMIT),
      },
    ]),
    EventEmitterModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
