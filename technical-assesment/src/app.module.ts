import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ModulesModule } from './modules/modules.module'
import { CommonsModule } from './commons/commons.module'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'
import { EventEmitterModule } from '@nestjs/event-emitter'

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
