import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProgressionService } from './progression.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type {
  ExerciseProgressionDto,
  ProgressOverviewDto,
} from '@liftup/types';

@ApiTags('Progression')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'progression', version: '1' })
export class ProgressionController {
  constructor(private readonly progressionService: ProgressionService) {}

  @Get('overview')
  @ApiOperation({
    summary:
      'Get overview progress (consistency, strength history, bodyweight baseline)',
  })
  async getOverviewProgress(
    @CurrentUser('id') userId: string,
  ): Promise<ProgressOverviewDto> {
    return this.progressionService.getOverviewProgress(userId);
  }

  @Get('exercise/:exerciseId')
  @ApiOperation({
    summary:
      'Get detailed progression and today reference for a specific exercise',
  })
  async getExerciseProgression(
    @CurrentUser('id') userId: string,
    @Param('exerciseId') exerciseId: string,
  ): Promise<ExerciseProgressionDto> {
    return this.progressionService.getExerciseProgression(userId, exerciseId);
  }
}
