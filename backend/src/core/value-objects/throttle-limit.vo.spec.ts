import { ThrottleLimit } from './throttle-limit.vo';
import { InvalidValueObjectException } from '@core/exceptions/domain-exceptions';

describe('ThrottleLimit', () => {
  describe('create', () => {
    it('should create a valid ThrottleLimit', () => {
      const throttleLimit = ThrottleLimit.create(60, 10);

      expect(throttleLimit.getTtl).toBe(60);
      expect(throttleLimit.getLimit).toBe(10);
    });

    it('should throw an exception when TTL is not positive', () => {
      expect(() => ThrottleLimit.create(0, 10)).toThrow(InvalidValueObjectException);
      expect(() => ThrottleLimit.create(-1, 10)).toThrow(InvalidValueObjectException);

      try {
        ThrottleLimit.create(0, 10);
      } catch (error) {
        expect(error.message).toBe('TTL must be a positive number');
      }
    });

    it('should throw an exception when limit is not positive', () => {
      expect(() => ThrottleLimit.create(60, 0)).toThrow(InvalidValueObjectException);
      expect(() => ThrottleLimit.create(60, -1)).toThrow(InvalidValueObjectException);

      try {
        ThrottleLimit.create(60, 0);
      } catch (error) {
        expect(error.message).toBe('Limit must be a positive number');
      }
    });
  });

  describe('createDefault', () => {
    it('should create a ThrottleLimit with default values', () => {
      const throttleLimit = ThrottleLimit.createDefault();

      expect(throttleLimit.getTtl).toBe(60);
      expect(throttleLimit.getLimit).toBe(10);
    });
  });

  describe('toString', () => {
    it('should return a string representation', () => {
      const throttleLimit = ThrottleLimit.create(60, 10);

      expect(throttleLimit.toString()).toBe('10 requests per 60 seconds');
    });
  });
});
