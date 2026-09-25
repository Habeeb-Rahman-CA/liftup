import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsInt,
  Min,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateFoodDto {
  @ApiProperty({
    example: 'Chicken',
    description: 'Name of the food item',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'PROTEIN',
    description: 'Category (PROTEIN, CARBS, FATS, SUPERFOODS, etc.)',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({
    example: 'Lean chicken breast high in protein and low in fat',
    description: 'Detailed description of the food item',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 100, description: 'Serving size quantity' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  servingSize?: number = 100;

  @ApiPropertyOptional({
    example: 'g',
    description: 'Serving unit (g, ml, pcs, etc.)',
  })
  @IsString()
  @IsOptional()
  servingUnit?: string = 'g';

  @ApiPropertyOptional({
    example: 165,
    description: 'Calories per serving (kcal)',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  calories?: number;

  @ApiPropertyOptional({ example: 31, description: 'Protein per serving (g)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  protein?: number;

  @ApiPropertyOptional({
    example: 0,
    description: 'Carbohydrates per serving (g)',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  carbs?: number;

  @ApiPropertyOptional({ example: 3.6, description: 'Fat per serving (g)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  fat?: number;

  @ApiPropertyOptional({
    example: 0,
    description: 'Dietary fiber per serving (g)',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  fiber?: number;

  @ApiPropertyOptional({
    example: 'Rich in bioavailable essential amino acids and B-vitamins',
    description: 'Superfood & nutritional health benefits',
  })
  @IsString()
  @IsOptional()
  benefits?: string;

  @ApiPropertyOptional({
    example: 'Cook thoroughly; best weighed raw for consistent tracking.',
    description: 'Culinary and preparation tips',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: 1, description: 'Ordering position' })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  orderIndex?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Is food active in catalog',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
