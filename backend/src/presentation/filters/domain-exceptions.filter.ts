import { ExceptionFilter, Catch, ArgumentsHost, Inject } from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainException } from '@core/exceptions/domain-exceptions';
import { ILOGGER_TOKEN } from '@shared/constants/tokens';
import { ILogger } from '@infrastructure/logger/logger.interface';

@Catch(DomainException)
export class DomainExceptionsFilter implements ExceptionFilter {
  constructor(@Inject(ILOGGER_TOKEN) protected readonly logger: ILogger) {
    this.logger.setContext(DomainExceptionsFilter.name);
  }

  catch(exception: DomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // Log the domain exception with structured data
    this.logger.error(
      {
        message: 'Domain exception',
        method: request.method,
        url: request.url,
        status,
        exceptionName: exception.name,
        exceptionMessage: exception.message,
        userId: (request.user && request.user['sub']) || 'anonymous',
      },
      exception.stack,
    );

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      error: exception.name,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
