import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, UseInterceptors } from '@nestjs/common'
import { ProductManagerService } from './product-manager.service'
import { AuthGuard } from '@modules/auth/guards/auth.guard'
import { RolesGuard } from '@modules/auth/guards/roles.guard'
import { Roles } from '@commons/enums/roles.enum'
import { useRoles } from '@modules/auth/decorators/roles.decorator'
import { CreateProductStockDto } from './dto/create-product-stock.dto'
import { UpdateProductStockDto } from './dto/update-product-stock.dto'
import { ApiBearerAuth } from '@nestjs/swagger'
import { CacheService } from '@commons/cache/cache.service'
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager'

@Controller('products')
@CacheKey('prodcuts')
@UseInterceptors(CacheInterceptor)
export class ProductManagerController {
  constructor(private readonly productManagerService: ProductManagerService) {}

  @Get()
  async getProducts() {
    return this.productManagerService.listAllProducts()
  }

  @Get(':id')
  async getProductById(@Param('id') id: string) {
    return this.productManagerService.getProductById(id)
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @useRoles(Roles.ADMIN)
  @Post()
  async createProduct(@Body() data: CreateProductStockDto) {
    return this.productManagerService.createProduct(data)
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @useRoles(Roles.ADMIN)
  @Put(':id')
  async updateProduct(@Param('id') id: string, @Body() data: UpdateProductStockDto) {
    return this.productManagerService.updateProduct(id, data)
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @useRoles(Roles.ADMIN)
  @Delete(':id')
  async deleteProduct(@Param('id') id: string) {
    return this.productManagerService.deleteProduct(id)
  }
}
