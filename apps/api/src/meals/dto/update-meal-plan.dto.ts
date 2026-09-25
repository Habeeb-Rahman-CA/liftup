import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateMealPlanDto {
  @ApiPropertyOptional({ description: 'Meal plan name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Meal plan description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Set as active plan' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
