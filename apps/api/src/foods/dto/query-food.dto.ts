import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryFoodDto {
  @ApiPropertyOptional({
    example: 'PROTEIN',
    description:
      'Filter by category (PROTEIN, CARBS, FATS, SUPERFOODS, or ALL)',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    example: 'chicken',
    description: 'Search by food name, category, or description',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: 'true',
    description: 'Filter by active status (true, false, or all)',
  })
  @IsString()
  @IsOptional()
  isActive?: string;

  @ApiPropertyOptional({
    example: 'orderIndex',
    enum: [
      'orderIndex',
      'name',
      'category',
      'calories',
      'protein',
      'carbs',
      'fat',
      'createdAt',
    ],
  })
  @IsString()
  @IsOptional()
  @IsIn([
    'orderIndex',
    'name',
    'category',
    'calories',
    'protein',
    'carbs',
    'fat',
    'createdAt',
  ])
  sortBy?:
    | 'orderIndex'
    | 'name'
    | 'category'
    | 'calories'
    | 'protein'
    | 'carbs'
    | 'fat'
    | 'createdAt' = 'orderIndex';

  @ApiPropertyOptional({ example: 'asc', enum: ['asc', 'desc'] })
  @IsString()
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';
}
