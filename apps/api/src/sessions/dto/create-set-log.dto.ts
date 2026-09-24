import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SetType } from '@prisma/client';

export class CreateSetLogDto {
  @ApiPropertyOptional({
    description: 'Type of set: WARMUP or WORKING',
    enum: SetType,
    default: SetType.WORKING,
  })
  @IsOptional()
  @IsEnum(SetType)
  type?: SetType;

  @ApiPropertyOptional({
    description: 'Set number sequence (e.g. 1, 2, 3)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  setNumber?: number;

  @ApiPropertyOptional({
    description: 'Reps performed',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  reps?: number;

  @ApiPropertyOptional({
    description: 'Weight lifted (in kg/lbs)',
    example: 80.0,
  })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({
    description: 'Rate of Perceived Exertion (1 to 10)',
    example: 8.5,
  })
  @IsOptional()
  @IsNumber()
  rpe?: number;

  @ApiPropertyOptional({
    description: 'Whether the set is marked as completed',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @ApiPropertyOptional({
    description: 'Optional note for set',
    example: 'RPE 8, smooth lockouts',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
