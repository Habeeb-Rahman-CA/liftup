import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMealItemDto {
  @ApiProperty({
    description: 'Name of the food item',
    example: 'Chicken Breast',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Quantity', example: 150 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Unit of measurement', example: 'g' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({
    description: 'Formatted display quantity',
    example: '150g Chicken Breast',
  })
  @IsOptional()
  @IsString()
  displayQuantity?: string;

  @ApiPropertyOptional({ description: 'Display order index', example: 1 })
  @IsOptional()
  @IsNumber()
  orderIndex?: number;
}

export class CreateMealDto {
  @ApiProperty({
    description: 'Meal label (e.g. Meal 1, Lunch)',
    example: 'Meal 1',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Display order index', example: 1 })
  @IsOptional()
  @IsNumber()
  orderIndex?: number;

  @ApiPropertyOptional({
    description: 'Scheduled target time',
    example: '08:00 AM',
  })
  @IsOptional()
  @IsString()
  time?: string;

  @ApiPropertyOptional({
    description: 'List of items in this meal',
    type: [CreateMealItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMealItemDto)
  items?: CreateMealItemDto[];
}

export class CreateMealPlanDto {
  @ApiProperty({
    description: 'Meal plan name',
    example: 'Standard 4-Meal Plan',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Meal plan description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'List of meals', type: [CreateMealDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMealDto)
  meals?: CreateMealDto[];
}
