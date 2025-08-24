import { Injectable, Inject, Scope } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

/**
 * Wrapper service that provides the same interface as your original LoggerService
 * but uses Winston under the hood. This maintains backward compatibility.
 */
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService {
  private context?: string;

  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}

  setContext(context: string): this {
    this.context = context;
    return this;
  }

  /**
   * Log info level message
   */
  log(message: unknown, context?: string): void {
    const logContext = context || this.context || 'Application';

    if (typeof message === 'object') {
      this.logger.info((message as any).message || 'Log message', {
        context: logContext,
        ...this.extractMessageData(message),
        tags: ['application', 'info'],
      });
    } else {
      this.logger.info(String(message), {
        context: logContext,
        tags: ['application', 'info'],
      });
    }
  }

  /**
   * Log error level message
   */
  error(message: unknown, stack?: string, context?: string): void {
    const logContext = context || this.context || 'Application';

    if (typeof message === 'object') {
      this.logger.error((message as any).message || 'Error occurred', {
        context: logContext,
        ...this.extractMessageData(message),
        stack,
        tags: ['application', 'error'],
      });
    } else {
      this.logger.error(String(message), {
        context: logContext,
        stack,
        tags: ['application', 'error'],
      });
    }
  }

  /**
   * Log warning level message
   */
  warn(message: unknown, context?: string): void {
    const logContext = context || this.context || 'Application';

    if (typeof message === 'object') {
      this.logger.warn((message as any).message || 'Warning', {
        context: logContext,
        ...this.extractMessageData(message),
        tags: ['application', 'warning'],
      });
    } else {
      this.logger.warn(String(message), {
        context: logContext,
        tags: ['application', 'warning'],
      });
    }
  }

  /**
   * Log debug level message
   */
  debug(message: unknown, context?: string): void {
    const logContext = context || this.context || 'Application';

    if (typeof message === 'object') {
      this.logger.debug((message as any).message || 'Debug message', {
        context: logContext,
        ...this.extractMessageData(message),
        tags: ['application', 'debug'],
      });
    } else {
      this.logger.debug(String(message), {
        context: logContext,
        tags: ['application', 'debug'],
      });
    }
  }

  /**
   * Log verbose level message (maps to debug in Winston)
   */
  verbose(message: unknown, context?: string): void {
    this.debug(message, context);
  }

  /**
   * Enhanced Winston-specific methods for better logging
   */

  /**
   * Log with custom metadata
   */
  logWithMeta(level: string, message: string, meta: Record<string, any>, context?: string): void {
    const logContext = context || this.context || 'Application';

    this.logger.log(level, message, {
      context: logContext,
      ...meta,
      tags: ['application', level, ...(meta.tags || [])],
    });
  }

  /**
   * Log repository operation
   */
  logRepositoryOperation(
    operation: string,
    entityType: string,
    duration?: number,
    entityId?: string,
    level: 'info' | 'debug' | 'warn' | 'error' = 'debug',
  ): void {
    const logContext = this.context || 'Repository';

    this.logger[level](`Repository operation: ${operation}`, {
      context: logContext,
      operation,
      entityType,
      entityId,
      duration,
      tags: ['repository', operation, entityType.toLowerCase()],
    });
  }

  /**
   * Log database performance
   */
  logDatabasePerformance(
    operation: string,
    entityType: string,
    duration: number,
    entityId?: string,
  ): void {
    const logContext = this.context || 'Database';
    const level = duration > 1000 ? 'warn' : 'debug';

    this.logger[level](`Database operation performance`, {
      context: logContext,
      operation,
      entityType,
      entityId,
      duration,
      slow: duration > 1000,
      tags: ['database', 'performance', entityType.toLowerCase()],
    });
  }

  /**
   * Extract data from message object for structured logging
   */
  private extractMessageData(message: unknown): Record<string, any> {
    if (typeof message !== 'object' || message === null) {
      return {};
    }

    const data = { ...(message as Record<string, any>) };
    delete data.message; // Remove message field to avoid duplication
    return data;
  }
}
