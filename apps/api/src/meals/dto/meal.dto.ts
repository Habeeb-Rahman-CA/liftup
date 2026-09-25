import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateIndividualMealDto {
  @ApiProperty({ description: 'Meal name', example: 'Meal 1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Order index', example: 1 })
  @IsOptional()
  @IsNumber()
  orderIndex?: number;

  @ApiPropertyOptional({ description: 'Scheduled time', example: '08:00 AM' })
  @IsOptional()
  @IsString()
  time?: string;
}

export class UpdateIndividualMealDto {
  @ApiPropertyOptional({ description: 'Meal name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Order index' })
  @IsOptional()
  @IsNumber()
  orderIndex?: number;

  @ApiPropertyOptional({ description: 'Scheduled time' })
  @IsOptional()
  @IsString()
  time?: string;
}

export class CreateIndividualMealItemDto {
  @ApiProperty({ description: 'Food item name', example: 'Chicken Breast' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Quantity', example: 150 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Unit', example: 'g' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({
    description: 'Display quantity',
    example: '150g Chicken Breast',
  })
  @IsOptional()
  @IsString()
  displayQuantity?: string;

  @ApiPropertyOptional({ description: 'Order index', example: 1 })
  @IsOptional()
  @IsNumber()
  orderIndex?: number;
}

export class UpdateIndividualMealItemDto {
  @ApiPropertyOptional({ description: 'Food item name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Quantity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Unit' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Display quantity' })
  @IsOptional()
  @IsString()
  displayQuantity?: string;

  @ApiPropertyOptional({ description: 'Order index' })
  @IsOptional()
  @IsNumber()
  orderIndex?: number;
}

export class BatchCreateMealItemsDto {
  @ApiProperty({
    description: 'Array of meal items to add',
    type: [CreateIndividualMealItemDto],
  })
  @IsNotEmpty()
  items: CreateIndividualMealItemDto[];
}
