import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryExerciseDto {
  @ApiPropertyOptional({ example: 'CHEST', description: 'Filter by category' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    example: 'press',
    description: 'Search by exercise name or description',
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
    enum: ['orderIndex', 'name', 'category', 'createdAt'],
  })
  @IsString()
  @IsOptional()
  @IsIn(['orderIndex', 'name', 'category', 'createdAt'])
  sortBy?: 'orderIndex' | 'name' | 'category' | 'createdAt' = 'orderIndex';

  @ApiPropertyOptional({ example: 'asc', enum: ['asc', 'desc'] })
  @IsString()
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';
}
