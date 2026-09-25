import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SchedulesService } from './schedules.service.js';
import { AssignExerciseDto } from './dto/assign-exercise.dto.js';
import { BatchAssignExercisesDto } from './dto/batch-assign-exercises.dto.js';
import { UpdateAssignedExerciseDto } from './dto/update-assigned-exercise.dto.js';
import { UpdateDayDto } from './dto/update-day.dto.js';
import { ReorderDayExercisesDto } from './dto/reorder-day-exercises.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type {
  WorkoutScheduleDto,
  WorkoutDayDto,
  TodayWorkoutDto,
  WorkoutDayExerciseDto,
} from '@liftup/types';

@ApiTags('Workout Schedules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'schedules', version: '1' })
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get('active')
  @ApiOperation({ summary: 'Get current user active weekly workout schedule' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Active schedule retrieved',
  })
  async getActiveSchedule(
    @CurrentUser('id') userId: string,
  ): Promise<WorkoutScheduleDto> {
    return this.schedulesService.getActiveSchedule(userId);
  }

  @Get('today')
  @ApiOperation({ summary: "Get today's and upcoming workout routines" })
  @SwaggerApiResponse({
    status: 200,
    description: "Today's and upcoming workout retrieved",
  })
  async getTodayWorkout(
    @CurrentUser('id') userId: string,
  ): Promise<TodayWorkoutDto> {
    return this.schedulesService.getTodayWorkout(userId);
  }

  @Patch('days/:dayId')
  @ApiOperation({ summary: 'Update workout day details or toggle rest day' })
  @SwaggerApiResponse({ status: 200, description: 'Workout day updated' })
  async updateDay(
    @CurrentUser('id') userId: string,
    @Param('dayId') dayId: string,
    @Body() dto: UpdateDayDto,
  ): Promise<WorkoutDayDto> {
    return this.schedulesService.updateDay(userId, dayId, dto);
  }

  @Post('days/:dayId/exercises')
  @ApiOperation({ summary: 'Assign an exercise to a workout day' })
  @SwaggerApiResponse({ status: 201, description: 'Exercise assigned to day' })
  async assignExercise(
    @CurrentUser('id') userId: string,
    @Param('dayId') dayId: string,
    @Body() dto: AssignExerciseDto,
  ): Promise<WorkoutDayExerciseDto> {
    return this.schedulesService.assignExercise(userId, dayId, dto);
  }

  @Post('days/:dayId/batch-exercises')
  @ApiOperation({ summary: 'Batch assign multiple exercises to a workout day' })
  @SwaggerApiResponse({ status: 201, description: 'Exercises assigned to day' })
  async batchAssignExercises(
    @CurrentUser('id') userId: string,
    @Param('dayId') dayId: string,
    @Body() dto: BatchAssignExercisesDto,
  ): Promise<WorkoutDayExerciseDto[]> {
    return this.schedulesService.batchAssignExercises(userId, dayId, dto);
  }

  @Post('days/:dayId/reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Batch reorder exercises within a workout day' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Assigned exercises reordered',
  })
  async reorderDayExercises(
    @CurrentUser('id') userId: string,
    @Param('dayId') dayId: string,
    @Body() dto: ReorderDayExercisesDto,
  ): Promise<{ success: boolean; updatedCount: number }> {
    return this.schedulesService.reorderDayExercises(userId, dayId, dto);
  }

  @Patch('assigned-exercises/:assignedId')
  @ApiOperation({
    summary: 'Update target sets/reps/notes on assigned exercise',
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'Assigned exercise updated',
  })
  async updateAssignedExercise(
    @CurrentUser('id') userId: string,
    @Param('assignedId') assignedId: string,
    @Body() dto: UpdateAssignedExerciseDto,
  ): Promise<WorkoutDayExerciseDto> {
    return this.schedulesService.updateAssignedExercise(
      userId,
      assignedId,
      dto,
    );
  }

  @Delete('assigned-exercises/:assignedId')
  @ApiOperation({ summary: 'Remove an assigned exercise from a workout day' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Assigned exercise removed',
  })
  async removeAssignedExercise(
    @CurrentUser('id') userId: string,
    @Param('assignedId') assignedId: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.schedulesService.removeAssignedExercise(userId, assignedId);
  }

  @Post('reset-default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset schedule to default 7-day routine' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Schedule reset to default template',
  })
  async resetToDefault(
    @CurrentUser('id') userId: string,
  ): Promise<WorkoutScheduleDto> {
    return this.schedulesService.resetToDefault(userId);
  }
}
