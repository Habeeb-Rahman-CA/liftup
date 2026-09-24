import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AssignExerciseDto } from './dto/assign-exercise.dto.js';
import { BatchAssignExercisesDto } from './dto/batch-assign-exercises.dto.js';
import { UpdateAssignedExerciseDto } from './dto/update-assigned-exercise.dto.js';
import { UpdateDayDto } from './dto/update-day.dto.js';
import { ReorderDayExercisesDto } from './dto/reorder-day-exercises.dto.js';
import type {
  WorkoutScheduleDto,
  WorkoutDayDto,
  TodayWorkoutDto,
  WorkoutDayExerciseDto,
} from '@liftup/types';

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

@Injectable()
export class SchedulesService {
  private readonly logger = new Logger(SchedulesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Order days starting from Monday (1) to Sunday (0)
   */
  private sortDaysMonToSun<T extends { dayOfWeek: number }>(days: T[]): T[] {
    return [...days].sort((a, b) => {
      const aOrder = a.dayOfWeek === 0 ? 7 : a.dayOfWeek;
      const bOrder = b.dayOfWeek === 0 ? 7 : b.dayOfWeek;
      return aOrder - bOrder;
    });
  }

  /**
   * Format Prisma WorkoutSchedule into typed DTO
   */
  private formatScheduleDto(schedule: any): WorkoutScheduleDto {
    const sortedDays = this.sortDaysMonToSun(schedule.days || []);
    return {
      id: schedule.id,
      userId: schedule.userId,
      name: schedule.name,
      description: schedule.description,
      isActive: schedule.isActive,
      createdAt: schedule.createdAt.toISOString(),
      updatedAt: schedule.updatedAt.toISOString(),
      days: sortedDays.map((d: any) => this.formatDayDto(d)),
    };
  }

  private formatDayDto(day: any): WorkoutDayDto {
    const sortedExercises = [...(day.exercises || [])].sort(
      (a: any, b: any) => a.orderIndex - b.orderIndex,
    );

    return {
      id: day.id,
      scheduleId: day.scheduleId,
      name: day.name,
      dayOfWeek: day.dayOfWeek,
      isRestDay: day.isRestDay,
      description: day.description,
      createdAt: day.createdAt.toISOString(),
      updatedAt: day.updatedAt.toISOString(),
      exercises: sortedExercises.map((e: any): WorkoutDayExerciseDto => ({
        id: e.id,
        workoutDayId: e.workoutDayId,
        exerciseId: e.exerciseId,
        targetSets: e.targetSets,
        targetRepsMin: e.targetRepsMin,
        targetRepsMax: e.targetRepsMax,
        orderIndex: e.orderIndex,
        note: e.note,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
        exercise: e.exercise
          ? {
              id: e.exercise.id,
              name: e.exercise.name,
              category: e.exercise.category,
              description: e.exercise.description,
              instructions: e.exercise.instructions,
              defaultSets: e.exercise.defaultSets,
              defaultRepsMin: e.exercise.defaultRepsMin,
              defaultRepsMax: e.exercise.defaultRepsMax,
              orderIndex: e.exercise.orderIndex,
              isActive: e.exercise.isActive,
              createdAt: e.exercise.createdAt.toISOString(),
              updatedAt: e.exercise.updatedAt.toISOString(),
            }
          : undefined,
      })),
    };
  }

  /**
   * Get active schedule for user, seeding default routine if none exists
   */
  async getActiveSchedule(userId: string): Promise<WorkoutScheduleDto> {
    let schedule = await this.prisma.workoutSchedule.findFirst({
      where: { userId, isActive: true },
      include: {
        days: {
          include: {
            exercises: {
              include: {
                exercise: true,
              },
            },
          },
        },
      },
    });

    if (!schedule) {
      schedule = await this.seedDefaultWeeklySchedule(userId);
    }

    return this.formatScheduleDto(schedule);
  }

  /**
   * Initialize a clean 7-day schedule for new users (Monday - Sunday)
   * Users manually configure their workout names, descriptions, and map exercises.
   */
  async seedDefaultWeeklySchedule(userId: string): Promise<any> {
    this.logger.log(
      `Initializing clean weekly workout schedule for new user: ${userId}`,
    );

    // Create schedule
    const schedule = await this.prisma.workoutSchedule.create({
      data: {
        userId,
        name: 'Weekly Schedule',
        description: null,
        isActive: true,
      },
    });

    const INITIAL_DAYS = [
      { dayOfWeek: 1, name: 'Monday', isRestDay: false },
      { dayOfWeek: 2, name: 'Tuesday', isRestDay: false },
      { dayOfWeek: 3, name: 'Wednesday', isRestDay: false },
      { dayOfWeek: 4, name: 'Thursday', isRestDay: false },
      { dayOfWeek: 5, name: 'Friday', isRestDay: false },
      { dayOfWeek: 6, name: 'Saturday', isRestDay: false },
      { dayOfWeek: 0, name: 'Sunday', isRestDay: true },
    ];

    // Create 7 empty days
    for (const day of INITIAL_DAYS) {
      await this.prisma.workoutDay.create({
        data: {
          scheduleId: schedule.id,
          dayOfWeek: day.dayOfWeek,
          name: day.name,
          isRestDay: day.isRestDay,
          description: null,
        },
      });
    }

    // Refetch complete schedule with relations
    return this.prisma.workoutSchedule.findUnique({
      where: { id: schedule.id },
      include: {
        days: {
          include: {
            exercises: {
              include: {
                exercise: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get Today's Workout & Upcoming Workout details
   */
  async getTodayWorkout(userId: string): Promise<TodayWorkoutDto> {
    const scheduleDto = await this.getActiveSchedule(userId);
    const now = new Date();
    const todayDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...
    const todayDayName = DAY_NAMES[todayDayOfWeek];
    const todayDateFormatted = now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const days = scheduleDto.days || [];
    const todayDay = days.find((d) => d.dayOfWeek === todayDayOfWeek) || null;

    // Find upcoming active workout day in cycle
    let upcomingDay: WorkoutDayDto | null = null;
    for (let offset = 1; offset <= 7; offset++) {
      const nextDayOfWeek = (todayDayOfWeek + offset) % 7;
      const candidate = days.find((d) => d.dayOfWeek === nextDayOfWeek);
      if (
        candidate &&
        !candidate.isRestDay &&
        (candidate.exercises?.length || 0) > 0
      ) {
        upcomingDay = candidate;
        break;
      }
    }

    // If still null (e.g. only rest days or no exercises), pick next scheduled day
    if (!upcomingDay) {
      for (let offset = 1; offset <= 7; offset++) {
        const nextDayOfWeek = (todayDayOfWeek + offset) % 7;
        const candidate = days.find((d) => d.dayOfWeek === nextDayOfWeek);
        if (candidate) {
          upcomingDay = candidate;
          break;
        }
      }
    }

    return {
      todayDayOfWeek,
      todayDayName,
      todayDateFormatted,
      today: todayDay,
      upcoming: upcomingDay,
      scheduleId: scheduleDto.id,
      scheduleName: scheduleDto.name,
    };
  }

  /**
   * Update WorkoutDay details (name, isRestDay, description)
   */
  async updateDay(
    userId: string,
    dayId: string,
    dto: UpdateDayDto,
  ): Promise<WorkoutDayDto> {
    const day = await this.prisma.workoutDay.findUnique({
      where: { id: dayId },
      include: { schedule: true },
    });

    if (!day) {
      throw new NotFoundException(`Workout day #${dayId} not found`);
    }

    if (day.schedule.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to modify this schedule',
      );
    }

    const updated = await this.prisma.workoutDay.update({
      where: { id: dayId },
      data: {
        name: dto.name !== undefined ? dto.name.trim() : undefined,
        isRestDay: dto.isRestDay !== undefined ? dto.isRestDay : undefined,
        description:
          dto.description !== undefined ? dto.description : undefined,
      },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
        },
      },
    });

    return this.formatDayDto(updated);
  }

  /**
   * Assign an exercise to a workout day
   */
  async assignExercise(
    userId: string,
    dayId: string,
    dto: AssignExerciseDto,
  ): Promise<WorkoutDayExerciseDto> {
    const day = await this.prisma.workoutDay.findUnique({
      where: { id: dayId },
      include: { schedule: true, exercises: true },
    });

    if (!day) {
      throw new NotFoundException(`Workout day #${dayId} not found`);
    }

    if (day.schedule.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to modify this schedule',
      );
    }

    const exercise = await this.prisma.exercise.findUnique({
      where: { id: dto.exerciseId },
    });

    if (!exercise) {
      throw new NotFoundException(
        `Exercise #${dto.exerciseId} not found in catalog`,
      );
    }

    // Determine orderIndex
    let nextOrder = dto.orderIndex;
    if (nextOrder === undefined || nextOrder === null) {
      const maxOrder = day.exercises.reduce(
        (max, e) => Math.max(max, e.orderIndex),
        0,
      );
      nextOrder = maxOrder + 1;
    }

    // Auto toggle off rest day if adding exercise to a rest day
    if (day.isRestDay) {
      await this.prisma.workoutDay.update({
        where: { id: dayId },
        data: { isRestDay: false },
      });
    }

    const assigned = await this.prisma.workoutDayExercise.create({
      data: {
        workoutDayId: dayId,
        exerciseId: dto.exerciseId,
        targetSets: dto.targetSets ?? exercise.defaultSets ?? 3,
        targetRepsMin: dto.targetRepsMin ?? exercise.defaultRepsMin ?? 8,
        targetRepsMax: dto.targetRepsMax ?? exercise.defaultRepsMax ?? 12,
        orderIndex: nextOrder,
        note: dto.note?.trim() || null,
      },
      include: {
        exercise: true,
      },
    });

    return {
      id: assigned.id,
      workoutDayId: assigned.workoutDayId,
      exerciseId: assigned.exerciseId,
      targetSets: assigned.targetSets,
      targetRepsMin: assigned.targetRepsMin,
      targetRepsMax: assigned.targetRepsMax,
      orderIndex: assigned.orderIndex,
      note: assigned.note,
      createdAt: assigned.createdAt.toISOString(),
      updatedAt: assigned.updatedAt.toISOString(),
      exercise: {
        id: assigned.exercise.id,
        name: assigned.exercise.name,
        category: assigned.exercise.category,
        description: assigned.exercise.description,
        instructions: assigned.exercise.instructions,
        defaultSets: assigned.exercise.defaultSets,
        defaultRepsMin: assigned.exercise.defaultRepsMin,
        defaultRepsMax: assigned.exercise.defaultRepsMax,
        orderIndex: assigned.exercise.orderIndex,
        isActive: assigned.exercise.isActive,
        createdAt: assigned.exercise.createdAt.toISOString(),
        updatedAt: assigned.exercise.updatedAt.toISOString(),
      },
    };
  }

  /**
   * Batch assign multiple exercises to a workout day
   */
  async batchAssignExercises(
    userId: string,
    dayId: string,
    dto: BatchAssignExercisesDto,
  ): Promise<WorkoutDayExerciseDto[]> {
    const day = await this.prisma.workoutDay.findUnique({
      where: { id: dayId },
      include: { schedule: true, exercises: true },
    });

    if (!day) {
      throw new NotFoundException(`Workout day #${dayId} not found`);
    }

    if (day.schedule.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to modify this schedule',
      );
    }

    if (day.isRestDay && dto.exercises.length > 0) {
      await this.prisma.workoutDay.update({
        where: { id: dayId },
        data: { isRestDay: false },
      });
    }

    let currentMaxOrder = day.exercises.reduce(
      (max, e) => Math.max(max, e.orderIndex),
      0,
    );
    const results: WorkoutDayExerciseDto[] = [];

    for (const item of dto.exercises) {
      const exercise = await this.prisma.exercise.findUnique({
        where: { id: item.exerciseId },
      });

      if (!exercise) continue;

      currentMaxOrder += 1;
      const assigned = await this.prisma.workoutDayExercise.create({
        data: {
          workoutDayId: dayId,
          exerciseId: item.exerciseId,
          targetSets: item.targetSets ?? exercise.defaultSets ?? 3,
          targetRepsMin: item.targetRepsMin ?? exercise.defaultRepsMin ?? 8,
          targetRepsMax: item.targetRepsMax ?? exercise.defaultRepsMax ?? 12,
          orderIndex: item.orderIndex ?? currentMaxOrder,
          note: item.note?.trim() || null,
        },
        include: {
          exercise: true,
        },
      });

      results.push({
        id: assigned.id,
        workoutDayId: assigned.workoutDayId,
        exerciseId: assigned.exerciseId,
        targetSets: assigned.targetSets,
        targetRepsMin: assigned.targetRepsMin,
        targetRepsMax: assigned.targetRepsMax,
        orderIndex: assigned.orderIndex,
        note: assigned.note,
        createdAt: assigned.createdAt.toISOString(),
        updatedAt: assigned.updatedAt.toISOString(),
        exercise: {
          id: assigned.exercise.id,
          name: assigned.exercise.name,
          category: assigned.exercise.category,
          description: assigned.exercise.description,
          instructions: assigned.exercise.instructions,
          defaultSets: assigned.exercise.defaultSets,
          defaultRepsMin: assigned.exercise.defaultRepsMin,
          defaultRepsMax: assigned.exercise.defaultRepsMax,
          orderIndex: assigned.exercise.orderIndex,
          isActive: assigned.exercise.isActive,
          createdAt: assigned.exercise.createdAt.toISOString(),
          updatedAt: assigned.exercise.updatedAt.toISOString(),
        },
      });
    }

    return results;
  }

  /**
   * Update an assigned exercise (target sets, reps min/max, note, order)
   */
  async updateAssignedExercise(
    userId: string,
    assignedId: string,
    dto: UpdateAssignedExerciseDto,
  ): Promise<WorkoutDayExerciseDto> {
    const assigned = await this.prisma.workoutDayExercise.findUnique({
      where: { id: assignedId },
      include: {
        workoutDay: {
          include: { schedule: true },
        },
        exercise: true,
      },
    });

    if (!assigned) {
      throw new NotFoundException(`Assigned exercise #${assignedId} not found`);
    }

    if (assigned.workoutDay.schedule.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to modify this schedule',
      );
    }

    const updated = await this.prisma.workoutDayExercise.update({
      where: { id: assignedId },
      data: {
        targetSets: dto.targetSets !== undefined ? dto.targetSets : undefined,
        targetRepsMin:
          dto.targetRepsMin !== undefined ? dto.targetRepsMin : undefined,
        targetRepsMax:
          dto.targetRepsMax !== undefined ? dto.targetRepsMax : undefined,
        orderIndex: dto.orderIndex !== undefined ? dto.orderIndex : undefined,
        note: dto.note !== undefined ? dto.note : undefined,
      },
      include: {
        exercise: true,
      },
    });

    return {
      id: updated.id,
      workoutDayId: updated.workoutDayId,
      exerciseId: updated.exerciseId,
      targetSets: updated.targetSets,
      targetRepsMin: updated.targetRepsMin,
      targetRepsMax: updated.targetRepsMax,
      orderIndex: updated.orderIndex,
      note: updated.note,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      exercise: {
        id: updated.exercise.id,
        name: updated.exercise.name,
        category: updated.exercise.category,
        description: updated.exercise.description,
        instructions: updated.exercise.instructions,
        defaultSets: updated.exercise.defaultSets,
        defaultRepsMin: updated.exercise.defaultRepsMin,
        defaultRepsMax: updated.exercise.defaultRepsMax,
        orderIndex: updated.exercise.orderIndex,
        isActive: updated.exercise.isActive,
        createdAt: updated.exercise.createdAt.toISOString(),
        updatedAt: updated.exercise.updatedAt.toISOString(),
      },
    };
  }

  /**
   * Remove an assigned exercise from a day
   */
  async removeAssignedExercise(
    userId: string,
    assignedId: string,
  ): Promise<{ success: boolean; message: string }> {
    const assigned = await this.prisma.workoutDayExercise.findUnique({
      where: { id: assignedId },
      include: {
        workoutDay: {
          include: { schedule: true },
        },
      },
    });

    if (!assigned) {
      throw new NotFoundException(`Assigned exercise #${assignedId} not found`);
    }

    if (assigned.workoutDay.schedule.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to modify this schedule',
      );
    }

    await this.prisma.workoutDayExercise.delete({
      where: { id: assignedId },
    });

    return {
      success: true,
      message: 'Exercise removed from workout day successfully',
    };
  }

  /**
   * Reorder exercises within a day
   */
  async reorderDayExercises(
    userId: string,
    dayId: string,
    dto: ReorderDayExercisesDto,
  ): Promise<{ success: boolean; updatedCount: number }> {
    const day = await this.prisma.workoutDay.findUnique({
      where: { id: dayId },
      include: { schedule: true },
    });

    if (!day) {
      throw new NotFoundException(`Workout day #${dayId} not found`);
    }

    if (day.schedule.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to modify this schedule',
      );
    }

    const updates = dto.items.map((item) =>
      this.prisma.workoutDayExercise.update({
        where: { id: item.id },
        data: { orderIndex: item.orderIndex },
      }),
    );

    await this.prisma.$transaction(updates);

    return {
      success: true,
      updatedCount: dto.items.length,
    };
  }

  /**
   * Reset user schedule back to default 7-day split
   */
  async resetToDefault(userId: string): Promise<WorkoutScheduleDto> {
    await this.prisma.workoutSchedule.deleteMany({
      where: { userId },
    });

    const newSchedule = await this.seedDefaultWeeklySchedule(userId);
    return this.formatScheduleDto(newSchedule);
  }
}
