import { IsArray, ValidateNested, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderItemDto {
  @ApiProperty({ example: 'cuid123' })
  @IsString()
  id: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(0)
  orderIndex: number;
}

export class ReorderExercisesDto {
  @ApiProperty({ type: [ReorderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items: ReorderItemDto[];
}
