import { Module } from '@nestjs/common';
import { ProgressionService } from './progression.service.js';
import { ProgressionController } from './progression.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [ProgressionController],
  providers: [ProgressionService],
  exports: [ProgressionService],
})
export class ProgressionModule {}
