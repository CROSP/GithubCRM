import { AddRepositoryCommandHandler } from '@application/commands/github-repository/add-repository.command';
import { UpdateRepositoryCommandHandler } from '@application/commands/github-repository/update-repository.command';
import { RequestSyncCommandHandler } from '@application/commands/github-repository/request-sync.command';
import { DeleteRepositoryCommandHandler } from '@application/commands/github-repository/delete-repository.command';

export const CommandHandlers = [
  AddRepositoryCommandHandler,
  UpdateRepositoryCommandHandler,
  RequestSyncCommandHandler,
  DeleteRepositoryCommandHandler,
];
