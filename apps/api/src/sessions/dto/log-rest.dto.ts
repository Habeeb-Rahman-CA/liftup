import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LogRestDto {
  @ApiPropertyOptional({
    description: 'ID of the workout day being marked as rest',
    example: 'clx123abc456',
  })
  @IsOptional()
  @IsString()
  workoutDayId?: string;

  @ApiPropertyOptional({
    description: 'Optional note or recovery activity details',
    example: 'Light walking, stretching, and foam rolling',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
