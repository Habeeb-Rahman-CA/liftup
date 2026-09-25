import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AssignExerciseDto } from './assign-exercise.dto.js';

export class BatchAssignExercisesDto {
  @ApiProperty({
    type: [AssignExerciseDto],
    description: 'List of exercises to assign at once',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssignExerciseDto)
  exercises: AssignExerciseDto[];
}
