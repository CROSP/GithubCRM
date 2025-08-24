import { InvalidValueObjectException } from '@core/exceptions/domain-exceptions';

export class RepositoryStats {
  private readonly stars: number;
  private readonly forks: number;
  private readonly openIssues: number;

  constructor(stars: number, forks: number, openIssues: number) {
    this.validateStats(stars, forks, openIssues);
    this.stars = stars;
    this.forks = forks;
    this.openIssues = openIssues;
  }

  private validateStats(stars: number, forks: number, openIssues: number): void {
    if (stars < 0 || forks < 0 || openIssues < 0) {
      throw new InvalidValueObjectException('Repository stats cannot be negative');
    }

    if (!Number.isInteger(stars) || !Number.isInteger(forks) || !Number.isInteger(openIssues)) {
      throw new InvalidValueObjectException('Repository stats must be integers');
    }
  }

  getStars(): number {
    return this.stars;
  }

  getForks(): number {
    return this.forks;
  }

  getOpenIssues(): number {
    return this.openIssues;
  }

  equals(other: RepositoryStats): boolean {
    return (
      this.stars === other.stars &&
      this.forks === other.forks &&
      this.openIssues === other.openIssues
    );
  }

  static zero(): RepositoryStats {
    return new RepositoryStats(0, 0, 0);
  }

  static create(stars: number, forks: number, openIssues: number): RepositoryStats {
    return new RepositoryStats(stars, forks, openIssues);
  }
}
