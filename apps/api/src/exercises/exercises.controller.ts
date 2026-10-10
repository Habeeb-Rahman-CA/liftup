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
} from '@nestjs/swagger';
import { ExercisesService } from './exercises.service.js';
import { CreateExerciseDto } from './dto/create-exercise.dto.js';
import { UpdateExerciseDto } from './dto/update-exercise.dto.js';
import { QueryExerciseDto } from './dto/query-exercise.dto.js';
import { ReorderExercisesDto } from './dto/reorder-exercises.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { ExerciseDto, UserProfile } from '@liftup/types';

@ApiTags('Exercises')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'exercises', version: '1' })
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary:
      'List all exercises with optional category, search, and status filters',
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'List of exercises retrieved',
  })
  async findAll(@Query() query: QueryExerciseDto): Promise<ExerciseDto[]> {
    return this.exercisesService.findAll(query);
  }

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'Get all distinct exercise categories with counts' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Categories with counts retrieved',
  })
  async getCategories(): Promise<
    { category: string; count: number; activeCount: number }[]
  > {
    return this.exercisesService.getCategories();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get single exercise by ID' })
  @SwaggerApiResponse({ status: 200, description: 'Exercise retrieved' })
  @SwaggerApiResponse({ status: 404, description: 'Exercise not found' })
  async findOne(@Param('id') id: string): Promise<ExerciseDto> {
    return this.exercisesService.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create new master exercise (Admin Only)' })
  @SwaggerApiResponse({
    status: 201,
    description: 'Exercise created successfully',
  })
  async create(
    @Body() dto: CreateExerciseDto,
    @CurrentUser() user: UserProfile,
  ): Promise<ExerciseDto> {
    return this.exercisesService.create(dto, user);
  }

  @Post('reorder')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Batch reorder exercises (Admin Only)' })
  @SwaggerApiResponse({ status: 200, description: 'Exercises reordered' })
  async reorder(
    @Body() dto: ReorderExercisesDto,
    @CurrentUser() user: UserProfile,
  ): Promise<{ success: boolean; updatedCount: number }> {
    return this.exercisesService.reorder(dto, user);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update exercise details (Admin Only)' })
  @SwaggerApiResponse({ status: 200, description: 'Exercise updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateExerciseDto,
    @CurrentUser() user: UserProfile,
  ): Promise<ExerciseDto> {
    return this.exercisesService.update(id, dto, user);
  }

  @Patch(':id/toggle-active')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Toggle exercise active / deactivated state (Admin Only)',
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'Exercise activation toggled',
  })
  async toggleActive(
    @Param('id') id: string,
    @CurrentUser() user: UserProfile,
  ): Promise<ExerciseDto> {
    return this.exercisesService.toggleActive(id, user);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete or archive exercise (Admin Only)' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Exercise deleted or archived',
  })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: UserProfile,
  ): Promise<{ success: boolean; message: string }> {
    return this.exercisesService.remove(id, user);
  }
}
