import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SkipSessionDto {
  @ApiPropertyOptional({
    description: 'ID of the workout day being skipped',
    example: 'clx123abc456',
  })
  @IsOptional()
  @IsString()
  workoutDayId?: string;

  @ApiPropertyOptional({
    description: 'ID of the active workout session being skipped/aborted',
    example: 'clx987xyz654',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiProperty({
    description: 'Reason for skipping the workout',
    example: 'Lack of sleep',
    enum: ['Lack of sleep', 'Feeling unwell', 'Busy', 'Recovery', 'Other'],
  })
  @IsNotEmpty()
  @IsString()
  skipReason: string;

  @ApiPropertyOptional({
    description: 'Optional note or details regarding the skip',
    example: 'Only had 4 hours of sleep and need full recovery',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
