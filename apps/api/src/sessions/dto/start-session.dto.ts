import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class StartSessionDto {
  @ApiPropertyOptional({
    description: 'Optional workout day ID to initialize routine exercises from',
    example: 'clxxxxxxxxxxxx',
  })
  @IsOptional()
  @IsString()
  workoutDayId?: string;

  @ApiPropertyOptional({
    description: 'Optional custom workout session name',
    example: 'Upper Power Session',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Optional notes for this session',
    example: 'Focused on explosive concentric tempo',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
