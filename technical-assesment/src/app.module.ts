import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ModulesModule } from './modules/modules.module'
import { CommonsModule } from './commons/commons.module'

@Module({
  imports: [ModulesModule, CommonsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
