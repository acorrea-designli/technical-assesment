import { Injectable, Inject } from '@nestjs/common'
import { Keyv } from 'keyv'

@Injectable()
export class CacheService {
  constructor(@Inject('CACHE_MANAGER') readonly keyv: Keyv) {}

  async get(key: string) {
    return await this.keyv.get(key)
  }

  async set<T = unknown>(key: string, value: T, ttl?: number): Promise<void> {
    await this.keyv.set(key, value, ttl)
  }

  async delete(key: string): Promise<void> {
    await this.keyv.delete(key)
  }

  async clear(): Promise<void> {
    await this.keyv.clear()
  }
}
