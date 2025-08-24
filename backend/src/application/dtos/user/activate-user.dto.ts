import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ActivateUserDto {
  @ApiProperty({
    description: 'User activation status',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  active!: boolean;
}
