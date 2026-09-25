import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateFoodDto } from './dto/create-food.dto.js';
import { UpdateFoodDto } from './dto/update-food.dto.js';
import { QueryFoodDto } from './dto/query-food.dto.js';
import { INITIAL_FOODS } from './default-foods.js';
import type { FoodDto, FoodCategoryStatsDto } from '@liftup/types';

@Injectable()
export class FoodsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedInitialFoodsIfNeeded();
  }

  /**
   * Seed the default initial food library catalog if not already populated
   */
  async seedInitialFoodsIfNeeded() {
    const count = await this.prisma.food.count();
    if (count > 0) return;

    console.log('[FOODS] Seeding master food library into database...');
    for (const food of INITIAL_FOODS) {
      await this.prisma.food.create({
        data: {
          name: food.name,
          category: food.category,
          description: food.description,
          servingSize: food.servingSize,
          servingUnit: food.servingUnit,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          fiber: food.fiber,
          benefits: food.benefits,
          notes: food.notes,
          orderIndex: food.orderIndex,
          isActive: true,
          isCustom: false,
        },
      });
    }
    console.log(
      `[FOODS] Successfully seeded ${INITIAL_FOODS.length} master food items.`,
    );
  }

  /**
   * Query & search food library items
   */
  async findAll(query: QueryFoodDto, userId?: string): Promise<FoodDto[]> {
    const {
      category,
      search,
      isActive,
      sortBy = 'orderIndex',
      sortOrder = 'asc',
    } = query;

    const where: any = {
      OR: [{ isCustom: false }, ...(userId ? [{ userId }] : [])],
    };

    if (category && category !== 'ALL') {
      where.category = {
        equals: category.trim().toUpperCase(),
        mode: 'insensitive',
      };
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.AND = [
        {
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
            { category: { contains: term, mode: 'insensitive' } },
            { benefits: { contains: term, mode: 'insensitive' } },
            { notes: { contains: term, mode: 'insensitive' } },
          ],
        },
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
    } else if (sortBy === 'calories') {
      orderBy.calories = sortOrder;
    } else if (sortBy === 'protein') {
      orderBy.protein = sortOrder;
    } else if (sortBy === 'carbs') {
      orderBy.carbs = sortOrder;
    } else if (sortBy === 'fat') {
      orderBy.fat = sortOrder;
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else {
      orderBy.orderIndex = sortOrder;
    }

    const foods = await this.prisma.food.findMany({
      where,
      orderBy: [orderBy, { name: 'asc' }],
    });

    return foods.map(this.formatFood);
  }

  /**
   * Get distinct categories with counts and active food item counts
   */
  async getCategories(userId?: string): Promise<FoodCategoryStatsDto[]> {
    const foods = await this.prisma.food.findMany({
      where: {
        OR: [{ isCustom: false }, ...(userId ? [{ userId }] : [])],
      },
      select: {
        category: true,
        isActive: true,
      },
    });

    const standardCategories = ['PROTEIN', 'CARBS', 'FATS', 'SUPERFOODS'];
    const categoryMap = new Map<
      string,
      { count: number; activeCount: number }
    >();

    for (const cat of standardCategories) {
      categoryMap.set(cat, { count: 0, activeCount: 0 });
    }

    for (const f of foods) {
      const cat = f.category.toUpperCase();
      const current = categoryMap.get(cat) || { count: 0, activeCount: 0 };
      current.count += 1;
      if (f.isActive) {
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

  /**
   * Get single food item by ID
   */
  async findOne(id: string): Promise<FoodDto> {
    const food = await this.prisma.food.findUnique({
      where: { id },
    });

    if (!food) {
      throw new NotFoundException(`Food item with ID "${id}" not found`);
    }

    return this.formatFood(food);
  }

  /**
   * Create a new food item
   */
  async create(
    userId: string | undefined,
    dto: CreateFoodDto,
  ): Promise<FoodDto> {
    const existing = await this.prisma.food.findFirst({
      where: {
        name: { equals: dto.name.trim(), mode: 'insensitive' },
        category: {
          equals: dto.category.trim().toUpperCase(),
          mode: 'insensitive',
        },
        OR: [{ isCustom: false }, ...(userId ? [{ userId }] : [])],
      },
    });

    if (existing) {
      throw new ConflictException(
        `A food item named "${dto.name}" in category "${dto.category}" already exists`,
      );
    }

    const highestOrder = await this.prisma.food.findFirst({
      where: {
        category: {
          equals: dto.category.trim().toUpperCase(),
          mode: 'insensitive',
        },
      },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    });

    const nextOrder = (highestOrder?.orderIndex ?? 0) + 1;

    const food = await this.prisma.food.create({
      data: {
        name: dto.name.trim(),
        category: dto.category.trim().toUpperCase(),
        description: dto.description?.trim(),
        servingSize: dto.servingSize ?? 100,
        servingUnit: dto.servingUnit?.trim() ?? 'g',
        calories: dto.calories,
        protein: dto.protein,
        carbs: dto.carbs,
        fat: dto.fat,
        fiber: dto.fiber,
        benefits: dto.benefits?.trim(),
        notes: dto.notes?.trim(),
        orderIndex: dto.orderIndex ?? nextOrder,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        isCustom: !!userId,
        userId: userId || null,
      },
    });

    return this.formatFood(food);
  }

  /**
   * Update existing food item
   */
  async update(
    id: string,
    userId: string | undefined,
    dto: UpdateFoodDto,
  ): Promise<FoodDto> {
    const existing = await this.prisma.food.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Food item with ID "${id}" not found`);
    }

    if (existing.isCustom && existing.userId && existing.userId !== userId) {
      throw new BadRequestException(
        'You do not have permission to edit this custom food item',
      );
    }

    if (dto.name) {
      const duplicate = await this.prisma.food.findFirst({
        where: {
          id: { not: id },
          name: { equals: dto.name.trim(), mode: 'insensitive' },
          category: {
            equals: (dto.category || existing.category).trim().toUpperCase(),
            mode: 'insensitive',
          },
        },
      });

      if (duplicate) {
        throw new ConflictException(
          `Another food item named "${dto.name}" already exists in this category`,
        );
      }
    }

    const updated = await this.prisma.food.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.category
          ? { category: dto.category.trim().toUpperCase() }
          : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() || null }
          : {}),
        ...(dto.servingSize !== undefined
          ? { servingSize: dto.servingSize }
          : {}),
        ...(dto.servingUnit !== undefined
          ? { servingUnit: dto.servingUnit?.trim() || null }
          : {}),
        ...(dto.calories !== undefined ? { calories: dto.calories } : {}),
        ...(dto.protein !== undefined ? { protein: dto.protein } : {}),
        ...(dto.carbs !== undefined ? { carbs: dto.carbs } : {}),
        ...(dto.fat !== undefined ? { fat: dto.fat } : {}),
        ...(dto.fiber !== undefined ? { fiber: dto.fiber } : {}),
        ...(dto.benefits !== undefined
          ? { benefits: dto.benefits?.trim() || null }
          : {}),
        ...(dto.notes !== undefined
          ? { notes: dto.notes?.trim() || null }
          : {}),
        ...(dto.orderIndex !== undefined ? { orderIndex: dto.orderIndex } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });

    return this.formatFood(updated);
  }

  /**
   * Delete or deactivate food item
   */
  async remove(
    id: string,
    userId: string | undefined,
  ): Promise<{ message: string; id: string }> {
    const existing = await this.prisma.food.findUnique({
      where: { id },
      include: {
        mealItems: { select: { id: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Food item with ID "${id}" not found`);
    }

    if (existing.isCustom && existing.userId && existing.userId !== userId) {
      throw new BadRequestException(
        'You do not have permission to delete this food item',
      );
    }

    // If linked to meal items, deactivate rather than hard-delete
    if (existing.mealItems && existing.mealItems.length > 0) {
      await this.prisma.food.update({
        where: { id },
        data: { isActive: false },
      });
      return {
        message:
          'Food item is linked to meal plans and has been deactivated to preserve logs',
        id,
      };
    }

    await this.prisma.food.delete({
      where: { id },
    });

    return {
      message: 'Food item permanently deleted',
      id,
    };
  }

  private formatFood(food: any): FoodDto {
    return {
      id: food.id,
      name: food.name,
      category: food.category,
      description: food.description,
      servingSize: food.servingSize,
      servingUnit: food.servingUnit,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: food.fiber,
      benefits: food.benefits,
      notes: food.notes,
      orderIndex: food.orderIndex,
      isActive: food.isActive,
      isCustom: food.isCustom,
      userId: food.userId,
      createdAt: food.createdAt?.toISOString(),
      updatedAt: food.updatedAt?.toISOString(),
    };
  }
}
