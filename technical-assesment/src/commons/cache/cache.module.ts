import KeyvRedis from '@keyv/redis'
import { Global, Module } from '@nestjs/common'
import { Keyv } from 'keyv'
import { CacheService } from './cache.service'

@Global()
@Module({
  providers: [
    {
      provide: 'CACHE_MANAGER',
      useFactory: () =>
        new Keyv({
          store: new KeyvRedis({
            socket: {
              host: process.env.REDIS_HOST,
              port: parseInt(process.env.REDIS_PORT || '6379'),
            },
            password: process.env.REDIS_PASSWORD,
          }),
        }),
    },
    CacheService,
  ],
  exports: ['CACHE_MANAGER', CacheService],
})
export class CacheModule {}
