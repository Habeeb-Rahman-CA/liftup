import { Module } from '@nestjs/common';
import { ExercisesService } from './exercises.service.js';
import { ExercisesController } from './exercises.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [ExercisesController],
  providers: [ExercisesService],
  exports: [ExercisesService],
})
export class ExercisesModule {}
