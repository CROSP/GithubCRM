import { CommandBus, CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';
import { RegisterDto } from '@application/dtos/auth/register.dto';
import { AuthResponse } from '@application/dtos/responses/user.response';
import { Injectable } from '@nestjs/common';
import { UserService } from '@core/services/user.service';
import { LoginCommand } from './login.command';

export class RegisterUserCommand implements ICommand {
  constructor(public readonly registerDto: RegisterDto) {}
}

@Injectable()
@CommandHandler(RegisterUserCommand)
export class RegisterUserCommandHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(
    private readonly userService: UserService,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: RegisterUserCommand): Promise<AuthResponse> {
    const { email, password, firstName, lastName } = command.registerDto;

    // Create the user (this already assigns default role)
    await this.userService.createUser(email, password, firstName, lastName);

    // Now immediately login the user to get tokens
    return this.commandBus.execute(new LoginCommand({ email, password }));
  }
}
