/**
 * Mock implementations for ConfigService used in tests
 */

export const mockConfigService = {
  get: jest.fn().mockImplementation((key, defaultValue) => {
    const config = {
      // App configuration
      PORT: 3000,
      NODE_ENV: 'test',

      // Auth configuration
      JWT_SECRET: 'test-jwt-secret',
      JWT_EXPIRATION: '1h',
      REFRESH_TOKEN_EXPIRATION: '7d',

      // Database configuration
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',

      // Email configuration
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: 587,
      SMTP_USER: 'test@example.com',
      SMTP_PASSWORD: 'test-password',
      SMTP_FROM: 'test@example.com',

      // 2FA configuration
      OTP_ISSUER: 'NestJSTemplate',

      // Frontend configuration
      FRONTEND_URL: 'http://localhost:3000',

      // Email verification configuration
      EMAIL_VERIFICATION_EXPIRATION: '24h',

      // Password reset configuration
      PASSWORD_RESET_EXPIRATION: '1h',
    };

    return config[key] || defaultValue;
  }),
};
