import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain-exceptions';

export class GitHubRepositoryNotFoundException extends DomainException {
  constructor(githubPath: string) {
    super(
      `GitHub repository '${githubPath}' was not found or is not accessible`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class GitHubApiRateLimitException extends DomainException {
  constructor(resetTime: Date) {
    super(
      `GitHub API rate limit exceeded. Resets at ${resetTime.toISOString()}`,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

export class GitHubApiException extends DomainException {
  constructor(message: string, statusCode?: number) {
    super(
      `GitHub API error: ${message}${statusCode ? ` (HTTP ${statusCode})` : ''}`,
      statusCode || HttpStatus.BAD_GATEWAY,
    );
  }
}

export class RepositorySyncInProgressException extends DomainException {
  constructor(repositoryId: string) {
    super(
      `Repository sync is already in progress for repository: ${repositoryId}`,
      HttpStatus.CONFLICT,
    );
  }
}

export class RepositoryQueueException extends DomainException {
  constructor(message: string) {
    super(`Repository queue error: ${message}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
