import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GitHubApiService } from './github-api.service';
import { GITHUB_API_SERVICE } from '@shared/constants/tokens';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: GITHUB_API_SERVICE,
      useClass: GitHubApiService,
    },
  ],
  exports: [GITHUB_API_SERVICE],
})
export class InfrastructureServicesModule {}
