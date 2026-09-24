import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateExerciseDto {
  @ApiProperty({
    example: 'Incline DB Press',
    description: 'Name of the exercise',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'CHEST',
    description: 'Category (CHEST, BACK, SHOULDERS, LEGS, ARMS, CORE, etc.)',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({
    example: 'Incline dumbbell press targeting upper chest',
    description: 'Short summary',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'Set bench to 30-45 degrees...',
    description: 'Execution instructions',
  })
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiPropertyOptional({ example: 3, description: 'Default number of sets' })
  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  @Type(() => Number)
  defaultSets?: number = 3;

  @ApiPropertyOptional({
    example: 8,
    description: 'Default minimum target reps',
  })
  @IsInt()
  @Min(1)
  @Max(200)
  @IsOptional()
  @Type(() => Number)
  defaultRepsMin?: number = 8;

  @ApiPropertyOptional({
    example: 12,
    description: 'Default maximum target reps',
  })
  @IsInt()
  @Min(1)
  @Max(200)
  @IsOptional()
  @Type(() => Number)
  defaultRepsMax?: number = 12;

  @ApiPropertyOptional({
    example: 1,
    description: 'Display and sort order index',
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  orderIndex?: number = 0;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether exercise is active and selectable',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
