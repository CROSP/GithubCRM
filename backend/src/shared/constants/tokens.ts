// Repository injection tokens
export const USER_REPOSITORY = Symbol('UserRepository');
export const ROLE_REPOSITORY = Symbol('RoleRepository');
export const PERMISSION_REPOSITORY = Symbol('PermissionRepository');
export const REFRESH_TOKEN_REPOSITORY = Symbol('RefreshTokenRepository');
export const GITHUB_REPOSITORY_REPOSITORY = Symbol('GITHUB_REPOSITORY_REPOSITORY');
export const GITHUB_API_SERVICE = Symbol('GITHUB_API_SERVICE');
export const REPOSITORY_SYNC_QUEUE_SERVICE = Symbol('REPOSITORY_SYNC_QUEUE_SERVICE');
// Service injection tokens
export const THROTTLER_SERVICE = Symbol('ThrottlerService');
export const ILOGGER_TOKEN = Symbol('ILogger');
export const IDOMAIN_EVENT_LOGGER_TOKEN = Symbol('IDomainEventLogger');
