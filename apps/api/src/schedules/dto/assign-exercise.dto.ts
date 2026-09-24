import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignExerciseDto {
  @ApiProperty({ description: 'ID of the exercise to assign' })
  @IsString()
  @IsNotEmpty()
  exerciseId: string;

  @ApiPropertyOptional({ description: 'Target sets', default: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  targetSets?: number;

  @ApiPropertyOptional({ description: 'Target minimum reps', default: 8 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  targetRepsMin?: number;

  @ApiPropertyOptional({ description: 'Target maximum reps', default: 12 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  targetRepsMax?: number;

  @ApiPropertyOptional({
    description: 'Order index within the day routine',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  orderIndex?: number;

  @ApiPropertyOptional({
    description: 'Custom notes or instructions for this exercise',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
