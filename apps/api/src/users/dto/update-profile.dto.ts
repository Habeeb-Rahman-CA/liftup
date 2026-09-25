import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'Alex Johnson',
    description: 'Updated full name',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'https://avatar.url/img.png',
    description: 'Avatar URL',
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({
    example: 'America/New_York',
    description: 'Timezone identifier',
  })
  @IsOptional()
  @IsString()
  timezone?: string;
}
