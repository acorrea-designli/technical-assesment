import { Module } from '@nestjs/common';
import { ProductModule } from './product/product.module';
import { StockModule } from './stock/stock.module';
import { ProductManagerService } from './product-manager.service';
import { ProductManagerController } from './product-manager.controller';

@Module({
  imports: [ProductModule, StockModule],
  providers: [ProductManagerService],
  controllers: [ProductManagerController],
  exports: [ProductManagerService],
})
export class ProductManagerModule {}
