import { Controller, Get, UseGuards } from '@nestjs/common'
import { AppService } from './app.service'
import { AuthGuard } from '@modules/auth/guards/auth.guard'
import { ApiBearerAuth } from '@nestjs/swagger'
import { RolesGuard } from '@modules/auth/guards/roles.guard'
import { Roles as RolesEnum } from '@commons/enums/roles.enum'
import { useRoles } from '@modules/auth/decorators/roles.decorator'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @useRoles(RolesEnum.ADMIN)
  @ApiBearerAuth()
  @Get()
  getHello(): string {
    return this.appService.getHello()
  }
}
