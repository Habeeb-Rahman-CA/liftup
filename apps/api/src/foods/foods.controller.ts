import {
  Controller,
  Get,
  Post,
  Put,
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
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FoodsService } from './foods.service.js';
import { CreateFoodDto } from './dto/create-food.dto.js';
import { UpdateFoodDto } from './dto/update-food.dto.js';
import { QueryFoodDto } from './dto/query-food.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('foods')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('foods')
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get food library catalog with category filtering and search',
  })
  @ApiResponse({ status: 200, description: 'List of food items retrieved' })
  findAll(@Query() query: QueryFoodDto, @CurrentUser('id') userId?: string) {
    return this.foodsService.findAll(query, userId);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get distinct food categories with statistics' })
  @ApiResponse({ status: 200, description: 'Category statistics retrieved' })
  getCategories(@CurrentUser('id') userId?: string) {
    return this.foodsService.getCategories(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single food item details' })
  @ApiResponse({ status: 200, description: 'Food details retrieved' })
  @ApiResponse({ status: 404, description: 'Food item not found' })
  findOne(@Param('id') id: string) {
    return this.foodsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new food item in library' })
  @ApiResponse({ status: 201, description: 'Food item created' })
  create(
    @CurrentUser('id') userId: string,
    @Body() createFoodDto: CreateFoodDto,
  ) {
    return this.foodsService.create(userId, createFoodDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing food item' })
  @ApiResponse({ status: 200, description: 'Food item updated' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateFoodDto: UpdateFoodDto,
  ) {
    return this.foodsService.update(id, userId, updateFoodDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete or deactivate a food item' })
  @ApiResponse({ status: 200, description: 'Food item deleted or deactivated' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.foodsService.remove(id, userId);
  }
}
