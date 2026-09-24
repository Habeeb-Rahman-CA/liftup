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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type {
  WorkoutSessionDto,
  SetLogDto,
  PreviousExercisePerformanceDto,
  PaginatedResult,
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

  @Get('history')
  @ApiOperation({ summary: 'Get paginated completed workout session history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getHistory(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaginatedResult<WorkoutSessionDto>> {
    return this.sessionsService.getHistory(
      userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get('previous-performance/:exerciseId')
  @ApiOperation({ summary: 'Get previous performance data for an exercise' })
  async getPreviousPerformance(
    @CurrentUser('id') userId: string,
    @Param('exerciseId') exerciseId: string,
  ): Promise<PreviousExercisePerformanceDto> {
    return this.sessionsService.getPreviousPerformance(userId, exerciseId);
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
