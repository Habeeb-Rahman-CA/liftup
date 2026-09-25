import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SetType } from '@prisma/client';

export class UpdateSetLogDto {
  @ApiPropertyOptional({
    description: 'Type of set: WARMUP or WORKING',
    enum: SetType,
  })
  @IsOptional()
  @IsEnum(SetType)
  type?: SetType;

  @ApiPropertyOptional({
    description: 'Set sequence number',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  setNumber?: number;

  @ApiPropertyOptional({
    description: 'Reps performed',
    example: 12,
  })
  @IsOptional()
  @IsNumber()
  reps?: number;

  @ApiPropertyOptional({
    description: 'Weight lifted',
    example: 85.0,
  })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({
    description: 'RPE (1-10)',
    example: 9.0,
  })
  @IsOptional()
  @IsNumber()
  rpe?: number;

  @ApiPropertyOptional({
    description: 'Completed state',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @ApiPropertyOptional({
    description: 'Optional note',
    example: 'Form broke down on rep 11',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
