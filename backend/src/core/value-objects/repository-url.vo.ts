import { InvalidValueObjectException } from '@core/exceptions/domain-exceptions';

export class RepositoryUrl {
  private readonly value: string;

  constructor(url: string) {
    this.validateUrl(url);
    this.value = url.trim();
  }

  private validateUrl(url: string): void {
    if (!url || typeof url !== 'string') {
      throw new InvalidValueObjectException('Repository URL cannot be empty');
    }

    const trimmedUrl = url.trim();

    try {
      const urlObj = new URL(trimmedUrl);

      // Must be GitHub URL
      if (!urlObj.hostname.includes('github.com')) {
        throw new InvalidValueObjectException('URL must be a GitHub repository URL');
      }

      // Should be HTTPS
      if (urlObj.protocol !== 'https:') {
        throw new InvalidValueObjectException('Repository URL must use HTTPS protocol');
      }

    } catch (error) {
      if (error instanceof InvalidValueObjectException) {
        throw error;
      }
      throw new InvalidValueObjectException('Invalid repository URL format');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: RepositoryUrl): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
