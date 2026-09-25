import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SessionsService } from './sessions.service.js';
import { StartSessionDto } from './dto/start-session.dto.js';
import { UpdateSessionDto } from './dto/update-session.dto.js';
import { CompleteSessionDto } from './dto/complete-session.dto.js';
import { AddExerciseLogDto } from './dto/add-exercise-log.dto.js';
import { CreateSetLogDto } from './dto/create-set-log.dto.js';
import { UpdateSetLogDto } from './dto/update-set-log.dto.js';
import { SkipSessionDto } from './dto/skip-session.dto.js';
import { LogRestDto } from './dto/log-rest.dto.js';
import { QueryHistoryDto } from './dto/query-history.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type {
  WorkoutSessionDto,
  SetLogDto,
  PreviousExercisePerformanceDto,
  ExerciseHistoryItemDto,
  WorkoutHistoryResponseDto,
} from '@liftup/types';

@ApiTags('Workout Sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'sessions', version: '1' })
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get('active')
  @ApiOperation({ summary: 'Get current active IN_PROGRESS workout session' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Active session retrieved (or null if none)',
  })
  async getActiveSession(
    @CurrentUser('id') userId: string,
  ): Promise<WorkoutSessionDto | null> {
    return this.sessionsService.getActiveSession(userId);
  }

  @Post('start')
  @ApiOperation({ summary: 'Start a new workout session' })
  @SwaggerApiResponse({
    status: 201,
    description: 'Workout session started or active session resumed',
  })
  async startSession(
    @CurrentUser('id') userId: string,
    @Body() dto: StartSessionDto,
  ): Promise<WorkoutSessionDto> {
    return this.sessionsService.startSession(userId, dto);
  }

  @Post('skip')
  @ApiOperation({
    summary: 'Skip a workout session with reason and optional note (Phase 7)',
  })
  @SwaggerApiResponse({
    status: 201,
    description: 'Workout session marked as SKIPPED',
  })
  async skipSession(
    @CurrentUser('id') userId: string,
    @Body() dto: SkipSessionDto,
  ): Promise<WorkoutSessionDto> {
    return this.sessionsService.skipSession(userId, dto);
  }

  @Post(':id/skip')
  @ApiOperation({ summary: 'Skip a specific active workout session' })
  async skipSessionById(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: SkipSessionDto,
  ): Promise<WorkoutSessionDto> {
    return this.sessionsService.skipSession(userId, { ...dto, sessionId: id });
  }

  @Post('rest')
  @ApiOperation({ summary: 'Log a rest day with optional note (Phase 7)' })
  @SwaggerApiResponse({
    status: 201,
    description: 'Rest day logged',
  })
  async logRestDay(
    @CurrentUser('id') userId: string,
    @Body() dto: LogRestDto,
  ): Promise<WorkoutSessionDto> {
    return this.sessionsService.logRestDay(userId, dto);
  }

  @Get('history')
  @ApiOperation({
    summary:
      'Get paginated workout history with status and search filters (Phase 7)',
  })
  async getHistory(
    @CurrentUser('id') userId: string,
    @Query() query: QueryHistoryDto,
  ): Promise<WorkoutHistoryResponseDto> {
    return this.sessionsService.getHistory(userId, query);
  }

  @Get('previous-performance/:exerciseId')
  @ApiOperation({ summary: 'Get previous performance data for an exercise' })
  async getPreviousPerformance(
    @CurrentUser('id') userId: string,
    @Param('exerciseId') exerciseId: string,
  ): Promise<PreviousExercisePerformanceDto> {
    return this.sessionsService.getPreviousPerformance(userId, exerciseId);
  }

  @Get('exercise-history/:exerciseId')
  @ApiOperation({
    summary: 'Get historical performance records for a specific exercise',
  })
  async getExerciseHistory(
    @CurrentUser('id') userId: string,
    @Param('exerciseId') exerciseId: string,
  ): Promise<ExerciseHistoryItemDto[]> {
    return this.sessionsService.getExerciseHistory(userId, exerciseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workout session details by ID' })
  async getSessionById(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<WorkoutSessionDto> {
    return this.sessionsService.getSessionById(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update workout session details' })
  async updateSession(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSessionDto,
  ): Promise<WorkoutSessionDto> {
    return this.sessionsService.updateSession(userId, id, dto);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete and finish a workout session' })
  async completeSession(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: CompleteSessionDto,
  ): Promise<WorkoutSessionDto> {
    return this.sessionsService.completeSession(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel and discard a workout session' })
  async cancelSession(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.sessionsService.cancelSession(userId, id);
  }

  @Post(':id/exercises')
  @ApiOperation({ summary: 'Add an exercise to active workout session' })
  async addExerciseLog(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: AddExerciseLogDto,
  ): Promise<WorkoutSessionDto> {
    return this.sessionsService.addExerciseLog(userId, id, dto);
  }

  @Delete(':id/exercises/:exerciseLogId')
  @ApiOperation({ summary: 'Remove an exercise from active session' })
  async removeExerciseLog(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Param('exerciseLogId') exerciseLogId: string,
  ): Promise<WorkoutSessionDto> {
    return this.sessionsService.removeExerciseLog(userId, id, exerciseLogId);
  }

  @Post('exercise-logs/:exerciseLogId/sets')
  @ApiOperation({ summary: 'Add a set to an exercise in active session' })
  async createSetLog(
    @CurrentUser('id') userId: string,
    @Param('exerciseLogId') exerciseLogId: string,
    @Body() dto: CreateSetLogDto,
  ): Promise<SetLogDto> {
    return this.sessionsService.createSetLog(userId, exerciseLogId, dto);
  }

  @Patch('sets/:setId')
  @ApiOperation({ summary: 'Update a set log' })
  async updateSetLog(
    @CurrentUser('id') userId: string,
    @Param('setId') setId: string,
    @Body() dto: UpdateSetLogDto,
  ): Promise<SetLogDto> {
    return this.sessionsService.updateSetLog(userId, setId, dto);
  }

  @Delete('sets/:setId')
  @ApiOperation({ summary: 'Delete a set log' })
  async deleteSetLog(
    @CurrentUser('id') userId: string,
    @Param('setId') setId: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.sessionsService.deleteSetLog(userId, setId);
  }
}
