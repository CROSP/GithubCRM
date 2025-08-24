import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { UpdateUserDto } from '@application/dtos/user/update-user.dto';
import { ChangePasswordDto } from '@application/dtos/user/change-password.dto';
import { UpdateUserCommand } from '@application/commands/user/update-user.command';
import { ChangePasswordCommand } from '@application/commands/user/change-password.command';
import { GetUserQuery } from '@application/queries/user/get-user.query';
import { IJwtPayload } from '@application/dtos/responses/user.response';

@ApiTags('profile')
@Controller('profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ProfileController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user profile' })
  async getCurrentUserProfile(@CurrentUser() user: IJwtPayload) {
    return this.queryBus.execute(new GetUserQuery(user.sub));
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current user profile' })
  async updateCurrentUserProfile(
    @CurrentUser() user: IJwtPayload,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.commandBus.execute(
      new UpdateUserCommand(
        user.userId,
        updateUserDto.firstName,
        updateUserDto.lastName,
        updateUserDto.email,
      ),
    );
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change current user password' })
  async changeCurrentUserPassword(
    @CurrentUser() user: IJwtPayload,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.commandBus.execute(
      new ChangePasswordCommand(
        user.sub,
        changePasswordDto.newPassword,
        changePasswordDto.currentPassword,
      ),
    );
    return { message: 'Password changed successfully' };
  }
}
