import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAssignedExerciseDto {
  @ApiPropertyOptional({ description: 'Target sets' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  targetSets?: number;

  @ApiPropertyOptional({ description: 'Target minimum reps' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  targetRepsMin?: number;

  @ApiPropertyOptional({ description: 'Target maximum reps' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  targetRepsMax?: number;

  @ApiPropertyOptional({ description: 'Order index within the day routine' })
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
