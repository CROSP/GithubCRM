import { Password } from './password.vo';
import { InvalidValueObjectException } from '@core/exceptions/domain-exceptions';

describe('Password Value Object', () => {
  it('should create a valid password', () => {
    // Arrange & Act
    const password = new Password('StrongPassword123!');

    // Assert
    expect(password).toBeDefined();
    expect(password.getValue()).toBe('StrongPassword123!');
  });

  it('should accept valid complex passwords', () => {
    // Arrange & Act & Assert
    expect(() => new Password('StrongPassword123!')).not.toThrow();
    expect(() => new Password('AnotherValidP@ssw0rd')).not.toThrow();
    expect(() => new Password('P@ssw0rdWithSpecial!Chars')).not.toThrow();
    expect(() => new Password('C0mplex!Pass')).not.toThrow();
  });

  it('should throw for password without uppercase letters', () => {
    // Arrange & Act & Assert
    expect(() => new Password('password123!')).toThrow(InvalidValueObjectException);
  });

  it('should throw for password without lowercase letters', () => {
    // Arrange & Act & Assert
    expect(() => new Password('PASSWORD123!')).toThrow(InvalidValueObjectException);
  });

  it('should throw for password without numbers', () => {
    // Arrange & Act & Assert
    expect(() => new Password('PasswordWithout!')).toThrow(InvalidValueObjectException);
  });

  it('should throw for password without special characters', () => {
    // Arrange & Act & Assert
    expect(() => new Password('Password123')).toThrow(InvalidValueObjectException);
  });

  it('should throw for too short password', () => {
    // Arrange & Act & Assert
    expect(() => new Password('Pa1!')).toThrow(InvalidValueObjectException);
  });

  it('should throw for empty password', () => {
    // Arrange & Act & Assert
    expect(() => new Password('')).toThrow(InvalidValueObjectException);
  });
});
