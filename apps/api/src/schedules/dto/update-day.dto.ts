import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDayDto {
  @ApiPropertyOptional({
    description: 'Name of the workout day (e.g. Chest & Triceps, Leg Day)',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Whether this is marked as a Rest Day' })
  @IsOptional()
  @IsBoolean()
  isRestDay?: boolean;

  @ApiPropertyOptional({
    description: 'Optional description or notes for the day',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
