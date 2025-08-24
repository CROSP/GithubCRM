import { v4 as uuidv4 } from 'uuid';
import { InvalidValueObjectException } from '@core/exceptions/domain-exceptions';

export class RepositoryId {
  private readonly value: string;

  private constructor(value: string) {
    this.validateId(value);
    this.value = value;
  }

  private validateId(id: string): void {
    if (!id || typeof id !== 'string') {
      throw new InvalidValueObjectException('Repository ID cannot be empty');
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new InvalidValueObjectException('Repository ID must be a valid UUID');
    }
  }

  static create(): RepositoryId {
    return new RepositoryId(uuidv4());
  }

  static fromString(id: string): RepositoryId {
    return new RepositoryId(id);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: RepositoryId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
