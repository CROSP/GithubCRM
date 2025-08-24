import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserService } from '@core/services/user.service';

export class VerifyPasswordCommand {
  constructor(
    public readonly userId: string,
    public readonly password: string,
  ) {}
}

@CommandHandler(VerifyPasswordCommand)
export class VerifyPasswordCommandHandler
  implements ICommandHandler<VerifyPasswordCommand, boolean>
{
  constructor(private readonly userService: UserService) {}

  async execute(command: VerifyPasswordCommand): Promise<boolean> {
    const { userId, password } = command;

    return this.userService.verifyCurrentPassword(userId, password);
  }
}
