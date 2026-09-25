import { Module } from '@nestjs/common';
import { FoodsController } from './foods.controller.js';
import { FoodsService } from './foods.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [FoodsController],
  providers: [FoodsService],
  exports: [FoodsService],
})
export class FoodsModule {}
