import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { UpdateRepositoryDto } from '@application/dtos/github-repository/update-repository.dto';
import { GitHubRepositoryResponse } from '@application/dtos/responses/github-repository.response';
import { GitHubRepositoryService } from '@core/services/github-repository.service';
import { GitHubRepositoryMapper } from '@application/mappers/github-repository.mapper';
import { ILOGGER_TOKEN } from '@shared/constants/tokens';
import { ILogger } from '@infrastructure/logger/logger.interface';

export class UpdateRepositoryCommand implements ICommand {
  constructor(
    public readonly repositoryId: string,
    public readonly updateRepositoryDto: UpdateRepositoryDto,
    public readonly userId: string,
  ) {}
}

@Injectable()
@CommandHandler(UpdateRepositoryCommand)
export class UpdateRepositoryCommandHandler implements ICommandHandler<UpdateRepositoryCommand> {
  constructor(
    private readonly repositoryService: GitHubRepositoryService,
    private readonly mapper: GitHubRepositoryMapper,
    @Inject(ILOGGER_TOKEN) protected readonly logger: ILogger,
  ) {
    this.logger.setContext(UpdateRepositoryCommandHandler.name);
  }

  async execute(command: UpdateRepositoryCommand): Promise<GitHubRepositoryResponse> {
    const { repositoryId, updateRepositoryDto, userId } = command;

    this.logger.log({
      message: 'Updating repository manually',
      repositoryId,
      userId,
      updates: updateRepositoryDto,
    });

    const updatedRepository = await this.repositoryService.updateRepositoryData(
      repositoryId,
      userId,
      updateRepositoryDto,
    );

    this.logger.log({
      message: 'Repository updated successfully',
      repositoryId,
    });

    return this.mapper.toResponse(updatedRepository);
  }
}
