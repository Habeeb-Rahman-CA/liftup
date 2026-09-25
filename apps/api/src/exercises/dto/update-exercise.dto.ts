import { PartialType } from '@nestjs/swagger';
import { CreateExerciseDto } from './create-exercise.dto.js';

export class UpdateExerciseDto extends PartialType(CreateExerciseDto) {}
