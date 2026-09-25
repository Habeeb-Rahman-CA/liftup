import { IsArray, ValidateNested, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderDayExerciseItemDto {
  @ApiProperty({ description: 'WorkoutDayExercise ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'New order index' })
  @IsInt()
  orderIndex: number;
}

export class ReorderDayExercisesDto {
  @ApiProperty({ type: [ReorderDayExerciseItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderDayExerciseItemDto)
  items: ReorderDayExerciseItemDto[];
}
