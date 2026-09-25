import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ToggleMealCompletionDto {
  @ApiPropertyOptional({
    description:
      'Target completion status (defaults to inverting current state)',
  })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @ApiPropertyOptional({ description: 'Optional note for the meal' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class ToggleMealItemCompletionDto {
  @ApiPropertyOptional({
    description:
      'Target completion status (defaults to inverting current state)',
  })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

export class UpdateMealDayNoteDto {
  @ApiPropertyOptional({ description: 'Daily nutrition note' })
  @IsOptional()
  @IsString()
  note?: string;
}
