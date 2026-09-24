import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteSessionDto {
  @ApiPropertyOptional({
    description: 'Post-workout reflection / feedback notes',
    example: 'Great session, energy was 9/10',
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    description: 'Workout duration in minutes',
    example: 52,
  })
  @IsOptional()
  @IsNumber()
  durationMinutes?: number;
}
