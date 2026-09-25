import { PartialType } from '@nestjs/swagger';
import { CreateFoodDto } from './create-food.dto.js';

export class UpdateFoodDto extends PartialType(CreateFoodDto) {}
