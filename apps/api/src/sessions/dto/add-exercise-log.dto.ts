import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddExerciseLogDto {
  @ApiProperty({
    description: 'Master exercise catalog ID to add to active session',
    example: 'clxxxxxxxxxxxx',
  })
  @IsNotEmpty()
  @IsString()
  exerciseId: string;

  @ApiPropertyOptional({
    description: 'Order index within session',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiPropertyOptional({
    description: 'Exercise specific notes for this session',
    example: 'Use 2.5kg microplates',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
