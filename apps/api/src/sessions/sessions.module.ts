import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller.js';
import { SessionsService } from './sessions.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
