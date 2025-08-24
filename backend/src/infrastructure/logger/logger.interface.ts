export interface ILogger {
  /**
   * Set logging context (e.g., class name, service name)
   */
  setContext(context: string): this;

  /**
   * Log info level message
   */
  log(message: unknown, context?: string): void;

  /**
   * Log error level message
   */
  error(message: unknown, stack?: string, context?: string): void;

  /**
   * Log warning level message
   */
  warn(message: unknown, context?: string): void;

  /**
   * Log debug level message
   */
  debug(message: unknown, context?: string): void;

  /**
   * Log verbose level message
   */
  verbose(message: unknown, context?: string): void;

  /**
   * Log with custom metadata and level
   */
  logWithMeta(
    level: string,
    message: string,
    meta: Record<string, unknown>,
    context?: string,
  ): void;

}
