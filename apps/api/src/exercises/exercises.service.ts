import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateExerciseDto } from './dto/create-exercise.dto.js';
import { UpdateExerciseDto } from './dto/update-exercise.dto.js';
import { QueryExerciseDto } from './dto/query-exercise.dto.js';
import { ReorderExercisesDto } from './dto/reorder-exercises.dto.js';
import type { ExerciseDto } from '@liftup/types';

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryExerciseDto): Promise<ExerciseDto[]> {
    const {
      category,
      search,
      isActive,
      sortBy = 'orderIndex',
      sortOrder = 'asc',
    } = query;

    const where: any = {};

    if (category && category !== 'ALL') {
      where.category = {
        equals: category.trim().toUpperCase(),
        mode: 'insensitive',
      };
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { category: { contains: term, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined && isActive !== 'all' && isActive !== '') {
      where.isActive = String(isActive) === 'true';
    }

    const orderBy: any = {};
    if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else if (sortBy === 'category') {
      orderBy.category = sortOrder;
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else {
      orderBy.orderIndex = sortOrder;
    }

    const exercises = await this.prisma.exercise.findMany({
      where,
      orderBy: [orderBy, { name: 'asc' }],
    });

    return exercises.map(this.formatExercise);
  }

  async getCategories(): Promise<
    { category: string; count: number; activeCount: number }[]
  > {
    const exercises = await this.prisma.exercise.findMany({
      select: {
        category: true,
        isActive: true,
      },
    });

    const categoryMap = new Map<
      string,
      { count: number; activeCount: number }
    >();

    for (const ex of exercises) {
      const cat = ex.category.toUpperCase();
      const current = categoryMap.get(cat) || { count: 0, activeCount: 0 };
      current.count += 1;
      if (ex.isActive) {
        current.activeCount += 1;
      }
      categoryMap.set(cat, current);
    }

    return Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      count: stats.count,
      activeCount: stats.activeCount,
    }));
  }

  async findOne(id: string): Promise<ExerciseDto> {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
    });

    if (!exercise) {
      throw new NotFoundException(`Exercise with ID '${id}' not found`);
    }

    return this.formatExercise(exercise);
  }

  async create(dto: CreateExerciseDto): Promise<ExerciseDto> {
    const categoryUpper = dto.category.trim().toUpperCase();

    // Check duplicate name
    const existing = await this.prisma.exercise.findFirst({
      where: { name: { equals: dto.name.trim(), mode: 'insensitive' } },
    });

    if (existing) {
      throw new ConflictException(
        `An exercise named '${dto.name}' already exists`,
      );
    }

    // Auto-compute next orderIndex if not explicitly given or 0
    let orderIndex = dto.orderIndex ?? 0;
    if (orderIndex === 0) {
      const maxOrder = await this.prisma.exercise.aggregate({
        _max: { orderIndex: true },
      });
      orderIndex = (maxOrder._max.orderIndex ?? 0) + 1;
    }

    const created = await this.prisma.exercise.create({
      data: {
        name: dto.name.trim(),
        category: categoryUpper,
        description: dto.description?.trim() || null,
        instructions: dto.instructions?.trim() || null,
        defaultSets: dto.defaultSets ?? 3,
        defaultRepsMin: dto.defaultRepsMin ?? 8,
        defaultRepsMax: dto.defaultRepsMax ?? 12,
        orderIndex,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    return this.formatExercise(created);
  }

  async update(id: string, dto: UpdateExerciseDto): Promise<ExerciseDto> {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
    });

    if (!exercise) {
      throw new NotFoundException(`Exercise with ID '${id}' not found`);
    }

    if (
      dto.name &&
      dto.name.trim().toLowerCase() !== exercise.name.toLowerCase()
    ) {
      const existing = await this.prisma.exercise.findFirst({
        where: {
          name: { equals: dto.name.trim(), mode: 'insensitive' },
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException(
          `An exercise named '${dto.name}' already exists`,
        );
      }
    }

    const updated = await this.prisma.exercise.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.category !== undefined && {
          category: dto.category.trim().toUpperCase(),
        }),
        ...(dto.description !== undefined && {
          description: dto.description?.trim() || null,
        }),
        ...(dto.instructions !== undefined && {
          instructions: dto.instructions?.trim() || null,
        }),
        ...(dto.defaultSets !== undefined && { defaultSets: dto.defaultSets }),
        ...(dto.defaultRepsMin !== undefined && {
          defaultRepsMin: dto.defaultRepsMin,
        }),
        ...(dto.defaultRepsMax !== undefined && {
          defaultRepsMax: dto.defaultRepsMax,
        }),
        ...(dto.orderIndex !== undefined && { orderIndex: dto.orderIndex }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return this.formatExercise(updated);
  }

  async toggleActive(id: string): Promise<ExerciseDto> {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
    });

    if (!exercise) {
      throw new NotFoundException(`Exercise with ID '${id}' not found`);
    }

    const updated = await this.prisma.exercise.update({
      where: { id },
      data: {
        isActive: !exercise.isActive,
      },
    });

    return this.formatExercise(updated);
  }

  async reorder(
    dto: ReorderExercisesDto,
  ): Promise<{ success: boolean; updatedCount: number }> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('No items provided for reordering');
    }

    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.exercise.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex },
        }),
      ),
    );

    return {
      success: true,
      updatedCount: dto.items.length,
    };
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
      include: {
        _count: {
          select: { exerciseLogs: true },
        },
      },
    });

    if (!exercise) {
      throw new NotFoundException(`Exercise with ID '${id}' not found`);
    }

    if (exercise._count.exerciseLogs > 0) {
      // If workout logs reference this exercise, soft-deactivate rather than hard delete
      await this.prisma.exercise.update({
        where: { id },
        data: { isActive: false },
      });
      return {
        success: true,
        message: `Exercise is used in ${exercise._count.exerciseLogs} workout session log(s). It has been deactivated.`,
      };
    }

    await this.prisma.exercise.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Exercise successfully deleted.',
    };
  }

  private formatExercise(exercise: any): ExerciseDto {
    return {
      id: exercise.id,
      name: exercise.name,
      category: exercise.category,
      description: exercise.description,
      instructions: exercise.instructions,
      defaultSets: exercise.defaultSets,
      defaultRepsMin: exercise.defaultRepsMin,
      defaultRepsMax: exercise.defaultRepsMax,
      orderIndex: exercise.orderIndex ?? 0,
      isActive: exercise.isActive,
      createdAt: exercise.createdAt.toISOString(),
      updatedAt: exercise.updatedAt.toISOString(),
    };
  }
}
