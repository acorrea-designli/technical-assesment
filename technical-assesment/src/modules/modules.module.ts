import { Module } from '@nestjs/common'
import { UserModule } from './user/user.module'
import { OrderManagerModule } from './order-manager/order-manager.module'
import { ProductManagerModule } from './product-manager/product-manager.module'

@Module({
  imports: [OrderManagerModule, ProductManagerModule, UserModule],
})
export class ModulesModule {}
