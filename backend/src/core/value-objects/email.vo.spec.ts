import { Email } from './email.vo';
import { InvalidValueObjectException } from '@core/exceptions/domain-exceptions';

describe('Email Value Object', () => {
  it('should create a valid email', () => {
    // Arrange & Act
    const email = new Email('test@example.com');

    // Assert
    expect(email).toBeDefined();
    expect(email.getValue()).toBe('test@example.com');
  });

  it('should normalize email to lowercase', () => {
    // Arrange & Act
    const email = new Email('Test@Example.com');

    // Assert
    expect(email.getValue()).toBe('test@example.com');
  });

  it('should set the value properly', () => {
    // Arrange & Act
    const email = new Email('test@example.com');

    // Assert
    expect(email.getValue()).toBe('test@example.com');
  });

  it('should correctly check equality between emails', () => {
    // Arrange
    const email1 = new Email('test@example.com');
    const email2 = new Email('test@example.com');
    const email3 = new Email('different@example.com');

    // Act & Assert
    expect(email1.equals(email2)).toBe(true);
    expect(email1.equals(email3)).toBe(false);
  });

  it('should throw for invalid email format', () => {
    // Arrange & Act & Assert
    expect(() => new Email('invalid-email')).toThrow(InvalidValueObjectException);
    expect(() => new Email('invalid@')).toThrow(InvalidValueObjectException);
    expect(() => new Email('@example.com')).toThrow(InvalidValueObjectException);
    expect(() => new Email('')).toThrow(InvalidValueObjectException);
    expect(() => new Email('  ')).toThrow(InvalidValueObjectException);
  });
});
