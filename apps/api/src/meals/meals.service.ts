import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateMealPlanDto } from './dto/create-meal-plan.dto.js';
import { UpdateMealPlanDto } from './dto/update-meal-plan.dto.js';
import {
  CreateIndividualMealDto,
  UpdateIndividualMealDto,
  CreateIndividualMealItemDto,
  UpdateIndividualMealItemDto,
} from './dto/meal.dto.js';
import {
  ToggleMealCompletionDto,
  ToggleMealItemCompletionDto,
  UpdateMealDayNoteDto,
} from './dto/toggle-meal.dto.js';
import { INITIAL_MEAL_PLAN } from './default-meal-plan.js';

@Injectable()
export class MealsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ensure user has at least one active meal plan (seeds standard 4-meal plan if none exists)
   */
  async getOrCreateDefaultPlan(userId: string) {
    let plan = await this.prisma.mealPlan.findFirst({
      where: { userId, isActive: true },
      include: {
        meals: {
          orderBy: { orderIndex: 'asc' },
          include: {
            items: { orderBy: { orderIndex: 'asc' } },
          },
        },
      },
    });

    if (!plan) {
      // Check if user has any other inactive plan
      const anyPlan = await this.prisma.mealPlan.findFirst({
        where: { userId },
        include: {
          meals: {
            orderBy: { orderIndex: 'asc' },
            include: { items: { orderBy: { orderIndex: 'asc' } } },
          },
        },
      });

      if (anyPlan) {
        plan = await this.prisma.mealPlan.update({
          where: { id: anyPlan.id },
          data: { isActive: true },
          include: {
            meals: {
              orderBy: { orderIndex: 'asc' },
              include: { items: { orderBy: { orderIndex: 'asc' } } },
            },
          },
        });
      } else {
        // Clone initial 4-meal plan for this user
        plan = await this.prisma.mealPlan.create({
          data: {
            userId,
            name: INITIAL_MEAL_PLAN.name,
            description: INITIAL_MEAL_PLAN.description,
            isActive: true,
            meals: {
              create: INITIAL_MEAL_PLAN.meals.map((m) => ({
                name: m.name,
                orderIndex: m.orderIndex,
                items: {
                  create: m.items.map((it) => ({
                    name: it.name,
                    quantity: it.quantity,
                    unit: it.unit,
                    displayQuantity: it.displayQuantity,
                    orderIndex: it.orderIndex,
                  })),
                },
              })),
            },
          },
          include: {
            meals: {
              orderBy: { orderIndex: 'asc' },
              include: {
                items: { orderBy: { orderIndex: 'asc' } },
              },
            },
          },
        });
      }
    }

    return plan;
  }

  /**
   * Get or initialize today's meal day log for the user
   */
  async getTodayMeals(userId: string, targetDate?: string) {
    const dateStr = targetDate || new Date().toISOString().split('T')[0];

    // Find existing log for this date
    let dayLog = await this.prisma.mealDayLog.findUnique({
      where: {
        userId_date: {
          userId,
          date: dateStr,
        },
      },
      include: {
        mealLogs: {
          orderBy: { orderIndex: 'asc' },
          include: {
            itemLogs: { orderBy: { orderIndex: 'asc' } },
          },
        },
      },
    });

    const activePlan = await this.getOrCreateDefaultPlan(userId);

    if (!dayLog) {
      // Initialize day log from active meal plan template
      dayLog = await this.prisma.mealDayLog.create({
        data: {
          userId,
          mealPlanId: activePlan.id,
          date: dateStr,
          mealLogs: {
            create: activePlan.meals.map((m) => ({
              mealId: m.id,
              name: m.name,
              orderIndex: m.orderIndex,
              completed: false,
              itemLogs: {
                create: m.items.map((it) => ({
                  mealItemId: it.id,
                  name: it.name,
                  quantity: it.quantity,
                  unit: it.unit,
                  displayQuantity: it.displayQuantity,
                  completed: false,
                  orderIndex: it.orderIndex,
                })),
              },
            })),
          },
        },
        include: {
          mealLogs: {
            orderBy: { orderIndex: 'asc' },
            include: {
              itemLogs: { orderBy: { orderIndex: 'asc' } },
            },
          },
        },
      });
    }

    return this.formatTodayMealsResponse(dayLog, activePlan);
  }

  /**
   * Format the today meals response with summary statistics
   */
  private formatTodayMealsResponse(dayLog: any, activePlan: any) {
    const totalMeals = dayLog.mealLogs.length;
    const completedMeals = dayLog.mealLogs.filter(
      (m: any) => m.completed,
    ).length;

    let totalItems = 0;
    let completedItems = 0;

    dayLog.mealLogs.forEach((m: any) => {
      m.itemLogs.forEach((it: any) => {
        totalItems++;
        if (it.completed) completedItems++;
      });
    });

    const completionRate =
      totalMeals > 0 ? Math.round((completedMeals / totalMeals) * 100) : 0;

    const dateObj = new Date(dayLog.date);
    const dateFormatted = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });

    return {
      todayLog: {
        id: dayLog.id,
        userId: dayLog.userId,
        mealPlanId: dayLog.mealPlanId,
        date: dayLog.date,
        dateFormatted,
        note: dayLog.note,
        mealLogs: dayLog.mealLogs,
        totalMealsCount: totalMeals,
        completedMealsCount: completedMeals,
        completionPercentage: completionRate,
      },
      activePlan,
      summary: {
        totalMeals,
        completedMeals,
        totalItems,
        completedItems,
        completionRate,
      },
    };
  }

  /**
   * Toggle a meal's completion status (and update all child food items)
   */
  async toggleMealCompletion(
    userId: string,
    mealLogId: string,
    dto?: ToggleMealCompletionDto,
  ) {
    const mealLog = await this.prisma.mealLog.findUnique({
      where: { id: mealLogId },
      include: {
        mealDayLog: true,
        itemLogs: true,
      },
    });

    if (!mealLog) {
      throw new NotFoundException('Meal log not found');
    }

    if (mealLog.mealDayLog.userId !== userId) {
      throw new ForbiddenException('You do not have access to this meal log');
    }

    const newCompleted =
      dto?.completed !== undefined ? dto.completed : !mealLog.completed;
    const completedAt = newCompleted ? new Date() : null;

    // Update the meal log
    await this.prisma.mealLog.update({
      where: { id: mealLogId },
      data: {
        completed: newCompleted,
        completedAt,
        ...(dto?.note !== undefined ? { note: dto.note } : {}),
      },
    });

    // Also update all item logs within this meal to match
    await this.prisma.mealItemLog.updateMany({
      where: { mealLogId },
      data: {
        completed: newCompleted,
      },
    });

    // Return the updated today meals payload
    return this.getTodayMeals(userId, mealLog.mealDayLog.date);
  }

  /**
   * Toggle an individual meal item's completion status
   */
  async toggleMealItemCompletion(
    userId: string,
    itemLogId: string,
    dto?: ToggleMealItemCompletionDto,
  ) {
    const itemLog = await this.prisma.mealItemLog.findUnique({
      where: { id: itemLogId },
      include: {
        mealLog: {
          include: {
            mealDayLog: true,
            itemLogs: true,
          },
        },
      },
    });

    if (!itemLog) {
      throw new NotFoundException('Meal item log not found');
    }

    if (itemLog.mealLog.mealDayLog.userId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this meal item log',
      );
    }

    const newCompleted =
      dto?.completed !== undefined ? dto.completed : !itemLog.completed;

    // Update this item log
    await this.prisma.mealItemLog.update({
      where: { id: itemLogId },
      data: { completed: newCompleted },
    });

    // Check sibling item logs to see if entire meal is now complete
    const allSiblingLogs = itemLog.mealLog.itemLogs.map((it) =>
      it.id === itemLogId ? { ...it, completed: newCompleted } : it,
    );

    const allCompleted =
      allSiblingLogs.length > 0 && allSiblingLogs.every((it) => it.completed);

    if (itemLog.mealLog.completed !== allCompleted) {
      await this.prisma.mealLog.update({
        where: { id: itemLog.mealLogId },
        data: {
          completed: allCompleted,
          completedAt: allCompleted ? new Date() : null,
        },
      });
    }

    return this.getTodayMeals(userId, itemLog.mealLog.mealDayLog.date);
  }

  /**
   * Update daily nutrition log note
   */
  async updateDayNote(
    userId: string,
    dateStr: string,
    dto: UpdateMealDayNoteDto,
  ) {
    const dayLog = await this.prisma.mealDayLog.findUnique({
      where: {
        userId_date: {
          userId,
          date: dateStr,
        },
      },
    });

    if (!dayLog) {
      throw new NotFoundException('Day log not found');
    }

    await this.prisma.mealDayLog.update({
      where: { id: dayLog.id },
      data: { note: dto.note },
    });

    return this.getTodayMeals(userId, dateStr);
  }

  /**
   * Get meal logging history with daily summaries
   */
  async getMealHistory(userId: string, limit = 30) {
    const dayLogs = await this.prisma.mealDayLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
      include: {
        mealLogs: {
          orderBy: { orderIndex: 'asc' },
          include: {
            itemLogs: { orderBy: { orderIndex: 'asc' } },
          },
        },
      },
    });

    let totalPossibleMeals = 0;
    let totalCompletedMeals = 0;
    let perfectDaysCount = 0;

    const items = dayLogs.map((log) => {
      const totalMeals = log.mealLogs.length;
      const completedMeals = log.mealLogs.filter((m) => m.completed).length;
      const completionPercentage =
        totalMeals > 0 ? Math.round((completedMeals / totalMeals) * 100) : 0;

      totalPossibleMeals += totalMeals;
      totalCompletedMeals += completedMeals;
      if (totalMeals > 0 && completedMeals === totalMeals) {
        perfectDaysCount++;
      }

      const dateObj = new Date(log.date);
      const dateFormatted = dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      return {
        id: log.id,
        date: log.date,
        dateFormatted,
        totalMeals,
        completedMeals,
        completionPercentage,
        note: log.note,
        mealLogs: log.mealLogs,
      };
    });

    const overallCompletionRate =
      totalPossibleMeals > 0
        ? Math.round((totalCompletedMeals / totalPossibleMeals) * 100)
        : 0;

    return {
      items,
      summary: {
        totalLoggedDays: dayLogs.length,
        perfectDaysCount,
        overallCompletionRate,
      },
    };
  }

  /**
   * Get all meal plans for user
   */
  async getMealPlans(userId: string) {
    // Ensure default plan exists
    await this.getOrCreateDefaultPlan(userId);

    return this.prisma.mealPlan.findMany({
      where: { userId },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
      include: {
        meals: {
          orderBy: { orderIndex: 'asc' },
          include: {
            items: { orderBy: { orderIndex: 'asc' } },
          },
        },
      },
    });
  }

  /**
   * Get active meal plan for user
   */
  async getActiveMealPlan(userId: string) {
    return this.getOrCreateDefaultPlan(userId);
  }

  /**
   * Create a new meal plan
   */
  async createMealPlan(userId: string, dto: CreateMealPlanDto) {
    const existingActive = await this.prisma.mealPlan.findFirst({
      where: { userId, isActive: true },
    });

    const isFirstPlan = !existingActive;

    return this.prisma.mealPlan.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        isActive: isFirstPlan,
        meals: dto.meals
          ? {
              create: dto.meals.map((m, mIdx) => ({
                name: m.name,
                orderIndex: m.orderIndex ?? mIdx + 1,
                time: m.time,
                items: m.items
                  ? {
                      create: m.items.map((it, itIdx) => ({
                        name: it.name,
                        quantity: it.quantity,
                        unit: it.unit,
                        displayQuantity:
                          it.displayQuantity ||
                          (it.quantity && it.unit
                            ? `${it.quantity}${it.unit} ${it.name}`
                            : it.name),
                        orderIndex: it.orderIndex ?? itIdx + 1,
                      })),
                    }
                  : undefined,
              })),
            }
          : undefined,
      },
      include: {
        meals: {
          orderBy: { orderIndex: 'asc' },
          include: {
            items: { orderBy: { orderIndex: 'asc' } },
          },
        },
      },
    });
  }

  /**
   * Update a meal plan
   */
  async updateMealPlan(userId: string, planId: string, dto: UpdateMealPlanDto) {
    const plan = await this.prisma.mealPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || plan.userId !== userId) {
      throw new NotFoundException('Meal plan not found');
    }

    if (dto.isActive) {
      // Deactivate all other plans for this user
      await this.prisma.mealPlan.updateMany({
        where: { userId, id: { not: planId } },
        data: { isActive: false },
      });
    }

    return this.prisma.mealPlan.update({
      where: { id: planId },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      include: {
        meals: {
          orderBy: { orderIndex: 'asc' },
          include: {
            items: { orderBy: { orderIndex: 'asc' } },
          },
        },
      },
    });
  }

  /**
   * Set a meal plan as active
   */
  async activateMealPlan(userId: string, planId: string) {
    const plan = await this.prisma.mealPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || plan.userId !== userId) {
      throw new NotFoundException('Meal plan not found');
    }

    await this.prisma.mealPlan.updateMany({
      where: { userId },
      data: { isActive: false },
    });

    return this.prisma.mealPlan.update({
      where: { id: planId },
      data: { isActive: true },
      include: {
        meals: {
          orderBy: { orderIndex: 'asc' },
          include: {
            items: { orderBy: { orderIndex: 'asc' } },
          },
        },
      },
    });
  }

  /**
   * Delete a meal plan
   */
  async deleteMealPlan(userId: string, planId: string) {
    const plan = await this.prisma.mealPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || plan.userId !== userId) {
      throw new NotFoundException('Meal plan not found');
    }

    await this.prisma.mealPlan.delete({
      where: { id: planId },
    });

    // If the deleted plan was active, activate another remaining plan if available
    if (plan.isActive) {
      const remainingPlan = await this.prisma.mealPlan.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (remainingPlan) {
        await this.prisma.mealPlan.update({
          where: { id: remainingPlan.id },
          data: { isActive: true },
        });
      }
    }

    return { message: 'Meal plan deleted successfully', id: planId };
  }

  /**
   * Add a meal to a meal plan
   */
  async addMealToPlan(
    userId: string,
    planId: string,
    dto: CreateIndividualMealDto,
  ) {
    const plan = await this.prisma.mealPlan.findUnique({
      where: { id: planId },
      include: { meals: true },
    });

    if (!plan || plan.userId !== userId) {
      throw new NotFoundException('Meal plan not found');
    }

    const orderIndex = dto.orderIndex ?? plan.meals.length + 1;

    return this.prisma.meal.create({
      data: {
        mealPlanId: planId,
        name: dto.name,
        orderIndex,
        time: dto.time,
      },
      include: {
        items: { orderBy: { orderIndex: 'asc' } },
      },
    });
  }

  /**
   * Update a meal
   */
  async updateMeal(
    userId: string,
    mealId: string,
    dto: UpdateIndividualMealDto,
  ) {
    const meal = await this.prisma.meal.findUnique({
      where: { id: mealId },
      include: { mealPlan: true },
    });

    if (!meal || meal.mealPlan.userId !== userId) {
      throw new NotFoundException('Meal not found');
    }

    return this.prisma.meal.update({
      where: { id: mealId },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.orderIndex !== undefined ? { orderIndex: dto.orderIndex } : {}),
        ...(dto.time !== undefined ? { time: dto.time } : {}),
      },
      include: {
        items: { orderBy: { orderIndex: 'asc' } },
      },
    });
  }

  /**
   * Delete a meal from plan
   */
  async deleteMeal(userId: string, mealId: string) {
    const meal = await this.prisma.meal.findUnique({
      where: { id: mealId },
      include: { mealPlan: true },
    });

    if (!meal || meal.mealPlan.userId !== userId) {
      throw new NotFoundException('Meal not found');
    }

    await this.prisma.meal.delete({
      where: { id: mealId },
    });

    return { success: true, message: 'Meal deleted successfully' };
  }

  /**
   * Add an item to a meal
   */
  async addItemToMeal(
    userId: string,
    mealId: string,
    dto: CreateIndividualMealItemDto,
  ) {
    const meal = await this.prisma.meal.findUnique({
      where: { id: mealId },
      include: { mealPlan: true, items: true },
    });

    if (!meal || meal.mealPlan.userId !== userId) {
      throw new NotFoundException('Meal not found');
    }

    const orderIndex = dto.orderIndex ?? meal.items.length + 1;
    const displayQuantity =
      dto.displayQuantity ||
      (dto.quantity && dto.unit
        ? `${dto.quantity}${dto.unit} ${dto.name}`
        : dto.name);

    return this.prisma.mealItem.create({
      data: {
        mealId,
        name: dto.name,
        quantity: dto.quantity,
        unit: dto.unit,
        displayQuantity,
        orderIndex,
      },
    });
  }

  /**
   * Add multiple food items to a meal in batch
   */
  async addBatchItemsToMeal(
    userId: string,
    mealId: string,
    items: CreateIndividualMealItemDto[],
  ) {
    const meal = await this.prisma.meal.findUnique({
      where: { id: mealId },
      include: { mealPlan: true, items: true },
    });

    if (!meal || meal.mealPlan.userId !== userId) {
      throw new NotFoundException('Meal not found');
    }

    const startingIndex = meal.items.length;
    const createdItems = await this.prisma.$transaction(
      items.map((dto, idx) => {
        const orderIndex = dto.orderIndex ?? startingIndex + idx + 1;
        const displayQuantity =
          dto.displayQuantity ||
          (dto.quantity && dto.unit
            ? `${dto.quantity}${dto.unit} ${dto.name}`
            : dto.name);
        return this.prisma.mealItem.create({
          data: {
            mealId,
            name: dto.name,
            quantity: dto.quantity,
            unit: dto.unit,
            displayQuantity,
            orderIndex,
          },
        });
      }),
    );

    return createdItems;
  }

  /**
   * Update a meal item
   */
  async updateItem(
    userId: string,
    itemId: string,
    dto: UpdateIndividualMealItemDto,
  ) {
    const item = await this.prisma.mealItem.findUnique({
      where: { id: itemId },
      include: { meal: { include: { mealPlan: true } } },
    });

    if (!item || item.meal.mealPlan.userId !== userId) {
      throw new NotFoundException('Meal item not found');
    }

    const name = dto.name || item.name;
    const quantity = dto.quantity !== undefined ? dto.quantity : item.quantity;
    const unit = dto.unit !== undefined ? dto.unit : item.unit;
    const displayQuantity =
      dto.displayQuantity ||
      (quantity && unit ? `${quantity}${unit} ${name}` : name);

    return this.prisma.mealItem.update({
      where: { id: itemId },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.quantity !== undefined ? { quantity: dto.quantity } : {}),
        ...(dto.unit !== undefined ? { unit: dto.unit } : {}),
        displayQuantity,
        ...(dto.orderIndex !== undefined ? { orderIndex: dto.orderIndex } : {}),
      },
    });
  }

  /**
   * Delete an item from a meal
   */
  async deleteItem(userId: string, itemId: string) {
    const item = await this.prisma.mealItem.findUnique({
      where: { id: itemId },
      include: { meal: { include: { mealPlan: true } } },
    });

    if (!item || item.meal.mealPlan.userId !== userId) {
      throw new NotFoundException('Meal item not found');
    }

    await this.prisma.mealItem.delete({
      where: { id: itemId },
    });

    return { success: true, message: 'Meal item deleted successfully' };
  }
}
