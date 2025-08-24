import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma/prisma.module';
import { GitHubRepositoryRepository } from './github-repository.repository';
import { GITHUB_REPOSITORY_REPOSITORY } from '@shared/constants/tokens';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: GITHUB_REPOSITORY_REPOSITORY,
      useClass: GitHubRepositoryRepository,
    },
  ],
  exports: [GITHUB_REPOSITORY_REPOSITORY],
})
export class InfrastructureRepositoriesModule {}
