import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { WorkoutSessionStatus, SetType } from '@prisma/client';
import type {
  ExerciseProgressionDto,
  ExerciseProgressionCheckpointDto,
  ProgressOverviewDto,
  WorkoutConsistencyDto,
  StrengthHistoryDto,
  BodyWeightProgressDto,
  ProgressionIndicator,
} from '@liftup/types';

@Injectable()
export class ProgressionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get comprehensive progression data for a single exercise
   */
  async getExerciseProgression(
    userId: string,
    exerciseId: string,
  ): Promise<ExerciseProgressionDto> {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id: exerciseId },
    });

    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }

    const defaultSets = exercise.defaultSets || 3;
    const defaultRepsMin = exercise.defaultRepsMin || 8;
    const defaultRepsMax = exercise.defaultRepsMax || 12;

    // Fetch all completed sessions containing this exercise
    const sessions = await this.prisma.workoutSession.findMany({
      where: {
        userId,
        status: WorkoutSessionStatus.COMPLETED,
        exerciseLogs: {
          some: { exerciseId },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 20,
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

    if (!sessions.length) {
      return {
        exerciseId,
        exerciseName: exercise.name,
        category: exercise.category,
        lastSession: null,
        highestWeight: null,
        highestWeightReps: null,
        highestReps: null,
        previousNote: null,
        todayReference: {
          headline: `Target: ${defaultSets} sets × ${defaultRepsMin}–${defaultRepsMax} reps`,
          suggestion:
            'First time performing this exercise. Focus on controlled form and establishing a baseline weight.',
          targetSets: defaultSets,
          targetRepsMin: defaultRepsMin,
          targetRepsMax: defaultRepsMax,
          recommendedWeight: null,
        },
        overallIndicator: 'FIRST_TIME',
        recentCheckpoints: [],
      };
    }

    const latestSession = sessions[0];
    const latestLog = latestSession.exerciseLogs[0];

    const formattedLastSessionSets = (latestLog?.setLogs || []).map((s) => ({
      type: s.type as any,
      setNumber: s.setNumber,
      weight:
        s.weight !== null && s.weight !== undefined ? Number(s.weight) : null,
      reps: s.reps ?? null,
      completed: s.completed,
    }));

    // Calculate highest weight & highest reps across all recorded sessions
    let allTimeHighestWeight = 0;
    let allTimeHighestWeightReps = 0;
    let allTimeHighestReps = 0;

    for (const sess of sessions) {
      const log = sess.exerciseLogs[0];
      for (const set of log?.setLogs || []) {
        if (set.completed && set.weight) {
          const w = Number(set.weight);
          const r = set.reps || 0;
          if (w > allTimeHighestWeight) {
            allTimeHighestWeight = w;
            allTimeHighestWeightReps = r;
          }
          if (r > allTimeHighestReps) {
            allTimeHighestReps = r;
          }
        }
      }
    }

    // Build checkpoints (ordered chronologically or descending)
    const checkpoints: ExerciseProgressionCheckpointDto[] = [];

    for (let i = 0; i < sessions.length; i++) {
      const sess = sessions[i];
      const log = sess.exerciseLogs[0];
      const validSets = (log?.setLogs || []).filter((s) => s.completed);

      const weights = validSets.map((s) => (s.weight ? Number(s.weight) : 0));
      const reps = validSets.map((s) => s.reps || 0);

      const topWeight = weights.length ? Math.max(...weights) : null;
      const topReps = reps.length ? Math.max(...reps) : null;

      // Compare with the older session (i + 1)
      let weightDelta: number | null = null;
      let repDelta: number | null = null;
      let indicator: ProgressionIndicator = 'FIRST_TIME';

      if (i + 1 < sessions.length) {
        const olderSess = sessions[i + 1];
        const olderValidSets = (
          olderSess.exerciseLogs[0]?.setLogs || []
        ).filter((s) => s.completed);
        const olderWeights = olderValidSets.map((s) =>
          s.weight ? Number(s.weight) : 0,
        );
        const olderReps = olderValidSets.map((s) => s.reps || 0);

        const olderTopWeight = olderWeights.length
          ? Math.max(...olderWeights)
          : 0;
        const olderTopReps = olderReps.length ? Math.max(...olderReps) : 0;

        if (topWeight !== null && olderTopWeight > 0) {
          weightDelta = Math.round((topWeight - olderTopWeight) * 10) / 10;
        }
        if (topReps !== null && olderTopReps > 0) {
          repDelta = topReps - olderTopReps;
        }

        if (
          (weightDelta ?? 0) > 0 ||
          ((weightDelta ?? 0) === 0 && (repDelta ?? 0) > 0)
        ) {
          indicator = 'UP';
        } else if (
          (weightDelta ?? 0) < 0 ||
          ((weightDelta ?? 0) === 0 && (repDelta ?? 0) < 0)
        ) {
          indicator = 'DOWN';
        } else {
          indicator = 'SAME';
        }
      }

      checkpoints.push({
        date: sess.startedAt
          ? new Date(sess.startedAt).toISOString()
          : new Date(sess.createdAt).toISOString(),
        sessionName: sess.name || 'Workout Session',
        topWeight,
        topReps,
        weightDelta,
        repDelta,
        indicator,
        note: log?.note || null,
        sets: (log?.setLogs || []).map((s) => ({
          type: s.type as any,
          setNumber: s.setNumber,
          weight:
            s.weight !== null && s.weight !== undefined
              ? Number(s.weight)
              : null,
          reps: s.reps ?? null,
          completed: s.completed,
        })),
      });
    }

    // Determine overall progression indicator
    const overallIndicator: ProgressionIndicator =
      checkpoints.length > 1 ? checkpoints[0].indicator : 'FIRST_TIME';

    // Calculate "What should I reference today?"
    const lastValidWorkingSets = formattedLastSessionSets.filter(
      (s) => s.completed && s.type !== 'WARMUP',
    );
    const lastTopSet = lastValidWorkingSets.length
      ? lastValidWorkingSets[lastValidWorkingSets.length - 1]
      : formattedLastSessionSets[0];

    const lastWeight = lastTopSet?.weight ?? null;
    const lastReps = lastTopSet?.reps ?? null;

    let headline = '';
    let suggestion = '';
    let recommendedWeight: number | null = lastWeight;

    if (lastWeight && lastReps) {
      headline = `Last Session: ${lastWeight}kg × ${lastReps}`;
      if (lastReps >= defaultRepsMax) {
        recommendedWeight = lastWeight + 2.5;
        suggestion = `Hit target ceiling (${lastReps} reps) last time! Recommended progressive overload: increase to ${recommendedWeight}kg for ${defaultRepsMin}–${defaultRepsMax} reps.`;
      } else {
        suggestion = `Target: Match ${lastWeight}kg and aim for ${lastReps + 1}–${defaultRepsMax} reps with clean technique.`;
      }
    } else {
      headline = `Target: ${defaultSets} sets × ${defaultRepsMin}–${defaultRepsMax} reps`;
      suggestion =
        'Aim to log your completed weight and reps for automatic progressive overload tracking.';
    }

    return {
      exerciseId,
      exerciseName: exercise.name,
      category: exercise.category,
      lastSession: {
        performedAt: latestSession.startedAt
          ? new Date(latestSession.startedAt).toISOString()
          : new Date(latestSession.createdAt).toISOString(),
        sessionName: latestSession.name || 'Previous Workout',
        sets: formattedLastSessionSets,
        note: latestLog?.note || null,
      },
      highestWeight: allTimeHighestWeight > 0 ? allTimeHighestWeight : null,
      highestWeightReps:
        allTimeHighestWeightReps > 0 ? allTimeHighestWeightReps : null,
      highestReps: allTimeHighestReps > 0 ? allTimeHighestReps : null,
      previousNote: latestLog?.note || null,
      todayReference: {
        headline,
        suggestion,
        targetSets: defaultSets,
        targetRepsMin: defaultRepsMin,
        targetRepsMax: defaultRepsMax,
        recommendedWeight,
      },
      overallIndicator,
      recentCheckpoints: checkpoints,
    };
  }

  /**
   * Get overview progress across Workout Consistency, Strength History, and Exercises
   */
  async getOverviewProgress(userId: string): Promise<ProgressOverviewDto> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalCompleted, recentSessions] = await Promise.all([
      this.prisma.workoutSession.count({
        where: { userId, status: WorkoutSessionStatus.COMPLETED },
      }),
      this.prisma.workoutSession.findMany({
        where: { userId, status: WorkoutSessionStatus.COMPLETED },
        orderBy: { startedAt: 'desc' },
        take: 30,
        include: {
          exerciseLogs: {
            include: {
              exercise: true,
              setLogs: true,
            },
          },
        },
      }),
    ]);

    // Workouts count in intervals
    let workoutsThisWeek = 0;
    let workoutsThisMonth = 0;
    let totalVolumeAllTime = 0;
    const uniqueExerciseIds = new Set<string>();

    for (const sess of recentSessions) {
      const sessDate = sess.startedAt
        ? new Date(sess.startedAt)
        : new Date(sess.createdAt);
      if (sessDate >= sevenDaysAgo) workoutsThisWeek++;
      if (sessDate >= thirtyDaysAgo) workoutsThisMonth++;

      for (const el of sess.exerciseLogs) {
        uniqueExerciseIds.add(el.exerciseId);
        for (const s of el.setLogs) {
          if (s.completed && s.weight && s.reps) {
            totalVolumeAllTime += Number(s.weight) * s.reps;
          }
        }
      }
    }

    // Weekly consistency heatmap (last 4 weeks)
    const weeklyHistory: {
      weekLabel: string;
      completedCount: number;
      daysActive: number[];
    }[] = [];
    for (let w = 0; w < 4; w++) {
      const weekStart = new Date(
        now.getTime() - (w * 7 + 6) * 24 * 60 * 60 * 1000,
      );
      const weekEnd = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);

      const weekSessions = recentSessions.filter((s) => {
        const d = s.startedAt ? new Date(s.startedAt) : new Date(s.createdAt);
        return d >= weekStart && d <= weekEnd;
      });

      const daysActive = Array.from(
        new Set(
          weekSessions.map((s) => {
            const d = s.startedAt
              ? new Date(s.startedAt)
              : new Date(s.createdAt);
            const day = d.getDay();
            return day === 0 ? 7 : day; // 1 (Mon) to 7 (Sun)
          }),
        ),
      );

      weeklyHistory.push({
        weekLabel: w === 0 ? 'This Week' : `${w}w ago`,
        completedCount: weekSessions.length,
        daysActive,
      });
    }

    // Calculate top progressed exercises
    const recentExerciseIdsList = Array.from(uniqueExerciseIds).slice(0, 6);
    const recentlyTrainedExercises: ExerciseProgressionDto[] = [];

    for (const exId of recentExerciseIdsList) {
      try {
        const prog = await this.getExerciseProgression(userId, exId);
        recentlyTrainedExercises.push(prog);
      } catch {
        // Skip if error
      }
    }

    const topProgressedExercises = recentlyTrainedExercises
      .filter((e) => e.highestWeight && e.highestWeight > 0)
      .map((e) => {
        const oldestCheckpoint =
          e.recentCheckpoints[e.recentCheckpoints.length - 1];
        const oldestWeight =
          oldestCheckpoint?.topWeight || e.highestWeight || 0;
        const currentWeight =
          e.lastSession?.sets.find((s) => s.weight)?.weight ||
          e.highestWeight ||
          0;
        const weightGain = Math.round((currentWeight - oldestWeight) * 10) / 10;

        return {
          exerciseId: e.exerciseId,
          exerciseName: e.exerciseName,
          category: e.category,
          lastWeight: currentWeight,
          lastReps: e.lastSession?.sets.find((s) => s.reps)?.reps || null,
          indicator: e.overallIndicator,
          weightGain,
        };
      });

    // Body Weight tracking structure (clean foundation for future expansion)
    const bodyWeight: BodyWeightProgressDto = {
      latestWeight: null,
      weightUnit: 'kg',
      lastLoggedAt: null,
      entries: [],
    };

    return {
      consistency: {
        workoutsThisWeek,
        workoutsThisMonth,
        totalCompletedWorkouts: totalCompleted,
        currentStreakWeeks: workoutsThisWeek > 0 ? 1 : 0,
        weeklyHistory,
      },
      strength: {
        totalVolumeAllTime,
        topProgressedExercises,
      },
      bodyWeight,
      recentlyTrainedExercises,
    };
  }
}
