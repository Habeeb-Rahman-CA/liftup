import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { MealsService } from './meals.service.js';
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

@ApiTags('Meals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('meals')
export class MealsController {
  constructor(private readonly mealsService: MealsService) {}

  // ---------------------------------------------------------------------------
  // TODAY'S MEALS & DAILY TRACKING
  // ---------------------------------------------------------------------------

  @Get('today')
  @ApiOperation({ summary: "Get or initialize today's meals checklist" })
  getTodayMeals(
    @CurrentUser('id') userId: string,
    @Query('date') date?: string,
  ) {
    return this.mealsService.getTodayMeals(userId, date);
  }

  @Patch('today/meal/:mealLogId/toggle')
  @ApiOperation({ summary: 'Toggle completion for an entire meal' })
  toggleMealCompletion(
    @CurrentUser('id') userId: string,
    @Param('mealLogId') mealLogId: string,
    @Body() dto: ToggleMealCompletionDto,
  ) {
    return this.mealsService.toggleMealCompletion(userId, mealLogId, dto);
  }

  @Patch('today/item/:itemLogId/toggle')
  @ApiOperation({ summary: 'Toggle completion for a single meal food item' })
  toggleMealItemCompletion(
    @CurrentUser('id') userId: string,
    @Param('itemLogId') itemLogId: string,
    @Body() dto: ToggleMealItemCompletionDto,
  ) {
    return this.mealsService.toggleMealItemCompletion(userId, itemLogId, dto);
  }

  @Patch('today/note')
  @ApiOperation({ summary: "Update today's nutrition note" })
  updateDayNote(
    @CurrentUser('id') userId: string,
    @Query('date') date: string,
    @Body() dto: UpdateMealDayNoteDto,
  ) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.mealsService.updateDayNote(userId, targetDate, dto);
  }

  // ---------------------------------------------------------------------------
  // MEAL HISTORY
  // ---------------------------------------------------------------------------

  @Get('history')
  @ApiOperation({ summary: 'Get historical meal completion days and logs' })
  getMealHistory(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
  ) {
    const take = limit ? parseInt(limit, 10) : 30;
    return this.mealsService.getMealHistory(userId, take);
  }

  // ---------------------------------------------------------------------------
  // MEAL PLANS CRUD
  // ---------------------------------------------------------------------------

  @Get('plans')
  @ApiOperation({ summary: 'Get all meal plans for user' })
  getMealPlans(@CurrentUser('id') userId: string) {
    return this.mealsService.getMealPlans(userId);
  }

  @Get('plans/active')
  @ApiOperation({ summary: 'Get active meal plan for user' })
  getActiveMealPlan(@CurrentUser('id') userId: string) {
    return this.mealsService.getActiveMealPlan(userId);
  }

  @Post('plans')
  @ApiOperation({ summary: 'Create a new meal plan' })
  createMealPlan(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMealPlanDto,
  ) {
    return this.mealsService.createMealPlan(userId, dto);
  }

  @Put('plans/:id')
  @ApiOperation({ summary: 'Update a meal plan' })
  updateMealPlan(
    @CurrentUser('id') userId: string,
    @Param('id') planId: string,
    @Body() dto: UpdateMealPlanDto,
  ) {
    return this.mealsService.updateMealPlan(userId, planId, dto);
  }

  @Post('plans/:id/activate')
  @ApiOperation({ summary: 'Activate a meal plan' })
  activateMealPlan(
    @CurrentUser('id') userId: string,
    @Param('id') planId: string,
  ) {
    return this.mealsService.activateMealPlan(userId, planId);
  }

  @Delete('plans/:id')
  @ApiOperation({ summary: 'Delete a meal plan' })
  deleteMealPlan(
    @CurrentUser('id') userId: string,
    @Param('id') planId: string,
  ) {
    return this.mealsService.deleteMealPlan(userId, planId);
  }

  // ---------------------------------------------------------------------------
  // INDIVIDUAL MEALS & ITEMS
  // ---------------------------------------------------------------------------

  @Post('plans/:planId/meals')
  @ApiOperation({ summary: 'Add a meal to a plan' })
  addMealToPlan(
    @CurrentUser('id') userId: string,
    @Param('planId') planId: string,
    @Body() dto: CreateIndividualMealDto,
  ) {
    return this.mealsService.addMealToPlan(userId, planId, dto);
  }

  @Put('meals/:mealId')
  @ApiOperation({ summary: 'Update a meal' })
  updateMeal(
    @CurrentUser('id') userId: string,
    @Param('mealId') mealId: string,
    @Body() dto: UpdateIndividualMealDto,
  ) {
    return this.mealsService.updateMeal(userId, mealId, dto);
  }

  @Delete('meals/:mealId')
  @ApiOperation({ summary: 'Delete a meal' })
  deleteMeal(
    @CurrentUser('id') userId: string,
    @Param('mealId') mealId: string,
  ) {
    return this.mealsService.deleteMeal(userId, mealId);
  }

  @Post('meals/:mealId/items')
  @ApiOperation({ summary: 'Add an item to a meal' })
  addItemToMeal(
    @CurrentUser('id') userId: string,
    @Param('mealId') mealId: string,
    @Body() dto: CreateIndividualMealItemDto,
  ) {
    return this.mealsService.addItemToMeal(userId, mealId, dto);
  }

  @Put('items/:itemId')
  @ApiOperation({ summary: 'Update a meal food item' })
  updateItem(
    @CurrentUser('id') userId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateIndividualMealItemDto,
  ) {
    return this.mealsService.updateItem(userId, itemId, dto);
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Delete a meal food item' })
  deleteItem(
    @CurrentUser('id') userId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.mealsService.deleteItem(userId, itemId);
  }
}
