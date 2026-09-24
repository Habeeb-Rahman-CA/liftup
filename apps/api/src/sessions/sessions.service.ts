import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { StartSessionDto } from './dto/start-session.dto.js';
import { UpdateSessionDto } from './dto/update-session.dto.js';
import { CompleteSessionDto } from './dto/complete-session.dto.js';
import { AddExerciseLogDto } from './dto/add-exercise-log.dto.js';
import { CreateSetLogDto } from './dto/create-set-log.dto.js';
import { UpdateSetLogDto } from './dto/update-set-log.dto.js';
import { WorkoutSessionStatus, SetType } from '@prisma/client';
import type {
  WorkoutSessionDto,
  ExerciseLogDto,
  SetLogDto,
  PreviousExercisePerformanceDto,
  ExerciseHistoryItemDto,
  PaginatedResult,
} from '@liftup/types';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get currently active IN_PROGRESS workout session for user (if one exists)
   */
  async getActiveSession(userId: string): Promise<WorkoutSessionDto | null> {
    const session = await this.prisma.workoutSession.findFirst({
      where: {
        userId,
        status: WorkoutSessionStatus.IN_PROGRESS,
      },
      orderBy: { startedAt: 'desc' },
      include: {
        exerciseLogs: {
          orderBy: { order: 'asc' },
          include: {
            exercise: true,
            setLogs: {
              orderBy: { setNumber: 'asc' },
            },
          },
        },
      },
    });

    if (!session) return null;
    return this.formatSession(session);
  }

  /**
   * Start a new workout session (from scheduled day routine or standalone)
   */
  async startSession(
    userId: string,
    dto: StartSessionDto,
  ): Promise<WorkoutSessionDto> {
    // If user already has an active IN_PROGRESS session, return that active session
    const existingActive = await this.getActiveSession(userId);
    if (existingActive) {
      return existingActive;
    }

    let sessionName = dto.name?.trim() || 'Custom Workout';
    const exerciseLogsData: any[] = [];

    if (dto.workoutDayId) {
      const workoutDay = await this.prisma.workoutDay.findUnique({
        where: { id: dto.workoutDayId },
        include: {
          exercises: {
            orderBy: { orderIndex: 'asc' },
            include: { exercise: true },
          },
        },
      });

      if (workoutDay) {
        if (!dto.name) {
          sessionName = workoutDay.name || 'Workout Session';
        }

        // Pre-populate exercise logs from routine
        workoutDay.exercises.forEach((assignedEx, exIdx) => {
          const targetSetsCount = assignedEx.targetSets || 3;
          const targetReps = assignedEx.targetRepsMin || 10;
          const setLogsData: any[] = [];

          // 1 optional warmup set + working sets
          for (let s = 1; s <= targetSetsCount; s++) {
            setLogsData.push({
              type: SetType.WORKING,
              setNumber: s,
              reps: targetReps,
              weight: null,
              completed: false,
              note: null,
            });
          }

          exerciseLogsData.push({
            exerciseId: assignedEx.exerciseId,
            order: exIdx + 1,
            note: assignedEx.note || null,
            setLogs: {
              create: setLogsData,
            },
          });
        });
      }
    }

    const created = await this.prisma.workoutSession.create({
      data: {
        userId,
        workoutDayId: dto.workoutDayId || null,
        name: sessionName,
        note: dto.note || null,
        status: WorkoutSessionStatus.IN_PROGRESS,
        startedAt: new Date(),
        exerciseLogs: {
          create: exerciseLogsData,
        },
      },
      include: {
        exerciseLogs: {
          orderBy: { order: 'asc' },
          include: {
            exercise: true,
            setLogs: {
              orderBy: { setNumber: 'asc' },
            },
          },
        },
      },
    });

    return this.formatSession(created);
  }

  /**
   * Get single session by ID
   */
  async getSessionById(userId: string, id: string): Promise<WorkoutSessionDto> {
    const session = await this.prisma.workoutSession.findUnique({
      where: { id },
      include: {
        exerciseLogs: {
          orderBy: { order: 'asc' },
          include: {
            exercise: true,
            setLogs: {
              orderBy: { setNumber: 'asc' },
            },
          },
        },
      },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundException('Workout session not found');
    }

    return this.formatSession(session);
  }

  /**
   * List paginated workout history for current user
   */
  async getHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResult<WorkoutSessionDto>> {
    const pageNumber = Math.max(1, page);
    const take = Math.min(100, Math.max(1, limit));
    const skip = (pageNumber - 1) * take;

    const [total, sessions] = await Promise.all([
      this.prisma.workoutSession.count({
        where: { userId, status: WorkoutSessionStatus.COMPLETED },
      }),
      this.prisma.workoutSession.findMany({
        where: { userId, status: WorkoutSessionStatus.COMPLETED },
        orderBy: { startedAt: 'desc' },
        skip,
        take,
        include: {
          exerciseLogs: {
            orderBy: { order: 'asc' },
            include: {
              exercise: true,
              setLogs: {
                orderBy: { setNumber: 'asc' },
              },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / take) || 1;

    return {
      items: sessions.map(this.formatSession),
      meta: {
        total,
        page: pageNumber,
        limit: take,
        totalPages,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1,
      },
    };
  }

  /**
   * Update session metadata
   */
  async updateSession(
    userId: string,
    id: string,
    dto: UpdateSessionDto,
  ): Promise<WorkoutSessionDto> {
    const session = await this.prisma.workoutSession.findUnique({
      where: { id },
    });
    if (!session || session.userId !== userId) {
      throw new NotFoundException('Workout session not found');
    }

    const updated = await this.prisma.workoutSession.update({
      where: { id },
      data: {
        name: dto.name?.trim() ?? undefined,
        status: dto.status ?? undefined,
        note: dto.note !== undefined ? dto.note : undefined,
        skipReason: dto.skipReason !== undefined ? dto.skipReason : undefined,
        endedAt: dto.endedAt ? new Date(dto.endedAt) : undefined,
        durationMinutes: dto.durationMinutes ?? undefined,
      },
      include: {
        exerciseLogs: {
          orderBy: { order: 'asc' },
          include: {
            exercise: true,
            setLogs: {
              orderBy: { setNumber: 'asc' },
            },
          },
        },
      },
    });

    return this.formatSession(updated);
  }

  /**
   * Finish and complete a workout session
   */
  async completeSession(
    userId: string,
    id: string,
    dto: CompleteSessionDto,
  ): Promise<WorkoutSessionDto> {
    const session = await this.prisma.workoutSession.findUnique({
      where: { id },
    });
    if (!session || session.userId !== userId) {
      throw new NotFoundException('Workout session not found');
    }

    const endedAt = new Date();
    let durationMinutes = dto.durationMinutes;

    if (durationMinutes === undefined && session.startedAt) {
      const diffMs = endedAt.getTime() - new Date(session.startedAt).getTime();
      durationMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));
    }

    const updated = await this.prisma.workoutSession.update({
      where: { id },
      data: {
        status: WorkoutSessionStatus.COMPLETED,
        endedAt,
        durationMinutes: durationMinutes || 1,
        note: dto.note !== undefined ? dto.note : session.note,
      },
      include: {
        exerciseLogs: {
          orderBy: { order: 'asc' },
          include: {
            exercise: true,
            setLogs: {
              orderBy: { setNumber: 'asc' },
            },
          },
        },
      },
    });

    return this.formatSession(updated);
  }

  /**
   * Cancel and discard a workout session
   */
  async cancelSession(
    userId: string,
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const session = await this.prisma.workoutSession.findUnique({
      where: { id },
    });
    if (!session || session.userId !== userId) {
      throw new NotFoundException('Workout session not found');
    }

    await this.prisma.workoutSession.delete({ where: { id } });
    return { success: true, message: 'Workout session discarded' };
  }

  /**
   * Add exercise to active session
   */
  async addExerciseLog(
    userId: string,
    sessionId: string,
    dto: AddExerciseLogDto,
  ): Promise<WorkoutSessionDto> {
    const session = await this.prisma.workoutSession.findUnique({
      where: { id: sessionId },
      include: { exerciseLogs: true },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundException('Workout session not found');
    }

    const exercise = await this.prisma.exercise.findUnique({
      where: { id: dto.exerciseId },
    });
    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }

    const nextOrder =
      dto.order !== undefined ? dto.order : session.exerciseLogs.length + 1;

    const defaultSets = exercise.defaultSets || 3;
    const defaultReps = exercise.defaultRepsMin || 10;
    const initialSets: any[] = [];

    for (let s = 1; s <= defaultSets; s++) {
      initialSets.push({
        type: SetType.WORKING,
        setNumber: s,
        reps: defaultReps,
        weight: null,
        completed: false,
      });
    }

    await this.prisma.exerciseLog.create({
      data: {
        workoutSessionId: sessionId,
        exerciseId: dto.exerciseId,
        order: nextOrder,
        note: dto.note || null,
        setLogs: {
          create: initialSets,
        },
      },
    });

    return this.getSessionById(userId, sessionId);
  }

  /**
   * Remove exercise from active session
   */
  async removeExerciseLog(
    userId: string,
    sessionId: string,
    exerciseLogId: string,
  ): Promise<WorkoutSessionDto> {
    const session = await this.prisma.workoutSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.userId !== userId) {
      throw new NotFoundException('Workout session not found');
    }

    await this.prisma.exerciseLog.deleteMany({
      where: {
        id: exerciseLogId,
        workoutSessionId: sessionId,
      },
    });

    return this.getSessionById(userId, sessionId);
  }

  /**
   * Add set to an exercise log
   */
  async createSetLog(
    userId: string,
    exerciseLogId: string,
    dto: CreateSetLogDto,
  ): Promise<SetLogDto> {
    const exerciseLog = await this.prisma.exerciseLog.findUnique({
      where: { id: exerciseLogId },
      include: {
        workoutSession: true,
        setLogs: { orderBy: { setNumber: 'desc' } },
      },
    });

    if (!exerciseLog || exerciseLog.workoutSession.userId !== userId) {
      throw new NotFoundException('Exercise log not found');
    }

    const nextSetNumber =
      dto.setNumber !== undefined
        ? dto.setNumber
        : exerciseLog.setLogs.length > 0
          ? exerciseLog.setLogs[0].setNumber + 1
          : 1;

    const created = await this.prisma.setLog.create({
      data: {
        exerciseLogId,
        type: dto.type || SetType.WORKING,
        setNumber: nextSetNumber,
        reps: dto.reps ?? null,
        weight: dto.weight ?? null,
        rpe: dto.rpe ?? null,
        completed: dto.completed ?? false,
        note: dto.note || null,
      },
    });

    return this.formatSetLog(created);
  }

  /**
   * Update individual set metrics (reps, weight, completion, type)
   */
  async updateSetLog(
    userId: string,
    setId: string,
    dto: UpdateSetLogDto,
  ): Promise<SetLogDto> {
    const set = await this.prisma.setLog.findUnique({
      where: { id: setId },
      include: {
        exerciseLog: {
          include: { workoutSession: true },
        },
      },
    });

    if (!set || set.exerciseLog.workoutSession.userId !== userId) {
      throw new NotFoundException('Set log not found');
    }

    const updated = await this.prisma.setLog.update({
      where: { id: setId },
      data: {
        type: dto.type ?? undefined,
        setNumber: dto.setNumber ?? undefined,
        reps: dto.reps !== undefined ? dto.reps : undefined,
        weight: dto.weight !== undefined ? dto.weight : undefined,
        rpe: dto.rpe !== undefined ? dto.rpe : undefined,
        completed: dto.completed !== undefined ? dto.completed : undefined,
        note: dto.note !== undefined ? dto.note : undefined,
      },
    });

    return this.formatSetLog(updated);
  }

  /**
   * Delete a set log
   */
  async deleteSetLog(
    userId: string,
    setId: string,
  ): Promise<{ success: boolean; message: string }> {
    const set = await this.prisma.setLog.findUnique({
      where: { id: setId },
      include: {
        exerciseLog: {
          include: { workoutSession: true },
        },
      },
    });

    if (!set || set.exerciseLog.workoutSession.userId !== userId) {
      throw new NotFoundException('Set log not found');
    }

    await this.prisma.setLog.delete({ where: { id: setId } });
    return { success: true, message: 'Set removed' };
  }

  /**
   * Get previous performance data for an exercise to display progressive overload references
   */
  async getPreviousPerformance(
    userId: string,
    exerciseId: string,
  ): Promise<PreviousExercisePerformanceDto> {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id: exerciseId },
    });

    const recentSessions = await this.prisma.workoutSession.findMany({
      where: {
        userId,
        status: WorkoutSessionStatus.COMPLETED,
        exerciseLogs: {
          some: { exerciseId },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 5,
      include: {
        exerciseLogs: {
          where: { exerciseId },
          include: {
            setLogs: {
              orderBy: { setNumber: 'asc' },
            },
          },
        },
      },
    });

    if (!recentSessions.length) {
      return {
        exerciseId,
        exerciseName: exercise?.name,
        lastPerformedAt: null,
        lastSessionName: null,
        previousNote: null,
        estimated1RM: null,
        bestSet: null,
        sets: [],
        historySnippet: [],
      };
    }

    const lastSession = recentSessions[0];
    const log = lastSession.exerciseLogs[0];

    const sets = (log?.setLogs || []).map((s) => ({
      type: s.type as any,
      setNumber: s.setNumber,
      weight:
        s.weight !== null && s.weight !== undefined ? Number(s.weight) : null,
      reps: s.reps ?? null,
      rpe: s.rpe !== null && s.rpe !== undefined ? Number(s.rpe) : null,
      completed: s.completed,
      note: s.note || null,
    }));

    // Calculate Estimated 1RM & Best Set from completed sets
    let best1RM = 0;
    let bestSetObj: {
      weight: number;
      reps: number;
      estimated1RM: number;
    } | null = null;

    for (const s of sets) {
      if (s.completed && s.weight && s.reps && s.weight > 0 && s.reps > 0) {
        const e1rm = Math.round(s.weight * (1 + s.reps / 30));
        if (e1rm > best1RM) {
          best1RM = e1rm;
          bestSetObj = {
            weight: s.weight,
            reps: s.reps,
            estimated1RM: e1rm,
          };
        }
      }
    }

    const historySnippet = recentSessions.map((sess) => {
      const sessLog = sess.exerciseLogs[0];
      const validSets = sessLog?.setLogs?.filter((s) => s.completed) || [];
      const weights = validSets.map((s) => (s.weight ? Number(s.weight) : 0));
      const maxWeight = weights.length ? Math.max(...weights) : null;
      const totalVolume = validSets.reduce(
        (acc, s) => acc + (s.weight ? Number(s.weight) : 0) * (s.reps || 0),
        0,
      );

      return {
        date: sess.startedAt
          ? new Date(sess.startedAt).toISOString()
          : new Date(sess.createdAt).toISOString(),
        sessionName: sess.name || 'Workout Session',
        maxWeight: maxWeight || null,
        totalVolume: totalVolume > 0 ? totalVolume : null,
        completedSetsCount: validSets.length,
      };
    });

    return {
      exerciseId,
      exerciseName: exercise?.name,
      lastPerformedAt: lastSession.startedAt
        ? new Date(lastSession.startedAt).toISOString()
        : null,
      lastSessionName: lastSession.name || null,
      previousNote: log?.note || null,
      estimated1RM: best1RM > 0 ? best1RM : null,
      bestSet: bestSetObj,
      sets,
      historySnippet,
    };
  }

  /**
   * Get historical performance logs for a single exercise across all completed workouts
   */
  async getExerciseHistory(
    userId: string,
    exerciseId: string,
  ): Promise<ExerciseHistoryItemDto[]> {
    const sessions = await this.prisma.workoutSession.findMany({
      where: {
        userId,
        status: WorkoutSessionStatus.COMPLETED,
        exerciseLogs: {
          some: { exerciseId },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 50,
      include: {
        exerciseLogs: {
          where: { exerciseId },
          include: {
            setLogs: {
              orderBy: { setNumber: 'asc' },
            },
          },
        },
      },
    });

    return sessions.map((sess) => {
      const log = sess.exerciseLogs[0];
      const sets = (log?.setLogs || []).map((s) => ({
        type: s.type as any,
        setNumber: s.setNumber,
        weight:
          s.weight !== null && s.weight !== undefined ? Number(s.weight) : null,
        reps: s.reps ?? null,
        rpe: s.rpe !== null && s.rpe !== undefined ? Number(s.rpe) : null,
        completed: s.completed,
        note: s.note || null,
      }));

      const completedSets = sets.filter((s) => s.completed);
      const weights = completedSets.map((s) => s.weight || 0);
      const maxWeight = weights.length ? Math.max(...weights) : null;
      const totalVolume = completedSets.reduce(
        (acc, s) => acc + (s.weight || 0) * (s.reps || 0),
        0,
      );

      return {
        sessionId: sess.id,
        sessionName: sess.name || 'Workout Session',
        performedAt: sess.startedAt
          ? new Date(sess.startedAt).toISOString()
          : new Date(sess.createdAt).toISOString(),
        durationMinutes: sess.durationMinutes ?? null,
        exerciseNote: log?.note || null,
        maxWeight: maxWeight || null,
        totalVolume: totalVolume > 0 ? totalVolume : null,
        sets,
      };
    });
  }

  // ---------------------------------------------------------------------------
  // FORMATTERS
  // ---------------------------------------------------------------------------
  private formatSession = (raw: any): WorkoutSessionDto => {
    return {
      id: raw.id,
      userId: raw.userId,
      workoutDayId: raw.workoutDayId || null,
      name: raw.name || null,
      status: raw.status as any,
      skipReason: raw.skipReason || null,
      note: raw.note || null,
      startedAt: raw.startedAt ? new Date(raw.startedAt).toISOString() : null,
      endedAt: raw.endedAt ? new Date(raw.endedAt).toISOString() : null,
      durationMinutes: raw.durationMinutes ?? null,
      exerciseLogs: raw.exerciseLogs
        ? raw.exerciseLogs.map(this.formatExerciseLog)
        : [],
      createdAt: new Date(raw.createdAt).toISOString(),
      updatedAt: new Date(raw.updatedAt).toISOString(),
    };
  };

  private formatExerciseLog = (raw: any): ExerciseLogDto => {
    const formattedSets = raw.setLogs ? raw.setLogs.map(this.formatSetLog) : [];
    // Sort warm-up sets first, then working sets by setNumber
    formattedSets.sort((a: SetLogDto, b: SetLogDto) => {
      if (a.type === 'WARMUP' && b.type !== 'WARMUP') return -1;
      if (a.type !== 'WARMUP' && b.type === 'WARMUP') return 1;
      return a.setNumber - b.setNumber;
    });

    return {
      id: raw.id,
      workoutSessionId: raw.workoutSessionId,
      exerciseId: raw.exerciseId,
      exercise: raw.exercise
        ? {
            id: raw.exercise.id,
            name: raw.exercise.name,
            category: raw.exercise.category,
            description: raw.exercise.description,
            instructions: raw.exercise.instructions,
            defaultSets: raw.exercise.defaultSets,
            defaultRepsMin: raw.exercise.defaultRepsMin,
            defaultRepsMax: raw.exercise.defaultRepsMax,
            orderIndex: raw.exercise.orderIndex,
            isActive: raw.exercise.isActive,
            createdAt: new Date(raw.exercise.createdAt).toISOString(),
            updatedAt: new Date(raw.exercise.updatedAt).toISOString(),
          }
        : undefined,
      order: raw.order,
      note: raw.note || null,
      setLogs: formattedSets,
      createdAt: new Date(raw.createdAt).toISOString(),
      updatedAt: new Date(raw.updatedAt).toISOString(),
    };
  };

  private formatSetLog = (raw: any): SetLogDto => {
    return {
      id: raw.id,
      exerciseLogId: raw.exerciseLogId,
      type: raw.type as any,
      setNumber: raw.setNumber,
      reps: raw.reps ?? null,
      weight:
        raw.weight !== null && raw.weight !== undefined
          ? Number(raw.weight)
          : null,
      rpe: raw.rpe !== null && raw.rpe !== undefined ? Number(raw.rpe) : null,
      completed: Boolean(raw.completed),
      note: raw.note || null,
      createdAt: new Date(raw.createdAt).toISOString(),
      updatedAt: new Date(raw.updatedAt).toISOString(),
    };
  };
}
