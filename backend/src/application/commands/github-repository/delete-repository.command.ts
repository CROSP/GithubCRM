import { ICommand, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { GitHubRepositoryService } from '@core/services/github-repository.service';
import { ILOGGER_TOKEN } from '@shared/constants/tokens';
import { ILogger } from '@infrastructure/logger/logger.interface';


export class DeleteRepositoryCommand implements ICommand {
  constructor(
    public readonly repositoryId: string,
    public readonly userId: string,
  ) {}
}

@Injectable()
@CommandHandler(DeleteRepositoryCommand)
export class DeleteRepositoryCommandHandler implements ICommandHandler<DeleteRepositoryCommand> {
  constructor(
    private readonly repositoryService: GitHubRepositoryService,
    @Inject(ILOGGER_TOKEN) protected readonly logger: ILogger,
  ) {
    this.logger.setContext(DeleteRepositoryCommandHandler.name);
  }

  async execute(command: DeleteRepositoryCommand): Promise<{ success: boolean; message: string }> {
    const { repositoryId, userId } = command;

    this.logger.log({
      message: 'Deleting repository',
      repositoryId,
      userId,
    });

    const deleted = await this.repositoryService.removeRepository(repositoryId, userId);

    if (deleted) {
      this.logger.log({
        message: 'Repository deleted successfully',
        repositoryId,
      });

      return {
        success: true,
        message: 'Repository deleted successfully',
      };
    } else {
      this.logger.warn({
        message: 'Failed to delete repository',
        repositoryId,
      });

      return {
        success: false,
        message: 'Failed to delete repository',
      };
    }
  }
}
