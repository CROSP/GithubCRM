import { InvalidValueObjectException } from '@core/exceptions/domain-exceptions';

export class GitHubPath {
  private readonly value: string;

  constructor(path: string) {
    this.validatePath(path);
    this.value = path.trim();
  }

  private validatePath(path: string): void {
    if (!path || typeof path !== 'string') {
      throw new InvalidValueObjectException('GitHub path cannot be empty');
    }

    const trimmedPath = path.trim();

    // Should match format: owner/repository
    const pathRegex = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;
    if (!pathRegex.test(trimmedPath)) {
      throw new InvalidValueObjectException(
        'GitHub path must be in format "owner/repository" (e.g., "facebook/react")',
      );
    }

    // Check for valid length
    if (trimmedPath.length > 100) {
      throw new InvalidValueObjectException('GitHub path is too long (max 100 characters)');
    }

    const [owner, repo] = trimmedPath.split('/');

    if (owner.length < 1 || repo.length < 1) {
      throw new InvalidValueObjectException('Both owner and repository name must be provided');
    }
  }

  getValue(): string {
    return this.value;
  }

  getOwner(): string {
    return this.value.split('/')[0];
  }

  getRepository(): string {
    return this.value.split('/')[1];
  }

  equals(other: GitHubPath): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
