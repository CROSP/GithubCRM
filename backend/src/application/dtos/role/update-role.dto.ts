import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRoleDto {
  @ApiPropertyOptional({
    description: 'Role name',
    example: 'moderator',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Role description',
    example: 'Moderator role with limited access',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether this role is the default for new users',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
