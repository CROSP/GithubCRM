/**
 * Factory function for config service mock
 */

import { mockConfigService } from './config.mock';

/**
 * Create a fresh mock config service for testing
 */
export const createMockConfigService = () => ({
  ...mockConfigService,
  get: jest.fn().mockImplementation(mockConfigService.get),
});
