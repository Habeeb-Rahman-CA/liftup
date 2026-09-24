import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { WorkoutSessionStatus } from '@prisma/client';

export class UpdateSessionDto {
  @ApiPropertyOptional({
    description: 'Updated session name',
    example: 'Leg Hypertrophy Day',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Session status',
    enum: WorkoutSessionStatus,
    example: WorkoutSessionStatus.COMPLETED,
  })
  @IsOptional()
  @IsEnum(WorkoutSessionStatus)
  status?: WorkoutSessionStatus;

  @ApiPropertyOptional({
    description: 'General session notes or reflection',
    example: 'Felt strong on squats, improved depth',
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    description: 'Reason if skipped',
    example: 'Rest needed due to soreness',
  })
  @IsOptional()
  @IsString()
  skipReason?: string;

  @ApiPropertyOptional({
    description: 'Timestamp when session ended',
    example: '2026-09-24T18:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  endedAt?: string;

  @ApiPropertyOptional({
    description: 'Duration in minutes',
    example: 65,
  })
  @IsOptional()
  @IsNumber()
  durationMinutes?: number;
}
