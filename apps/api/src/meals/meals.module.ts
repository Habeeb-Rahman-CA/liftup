import { Module } from '@nestjs/common';
import { MealsController } from './meals.controller.js';
import { MealsService } from './meals.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [MealsController],
  providers: [MealsService],
  exports: [MealsService],
})
export class MealsModule {}
