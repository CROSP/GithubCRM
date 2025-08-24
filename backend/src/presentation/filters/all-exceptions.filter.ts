import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

interface IHttpExceptionResponse {
  message: string | string[];
  error?: string;
  statusCode?: number;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}

  catch(exception: Error | HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const typedResponse = exceptionResponse as IHttpExceptionResponse;
        message = typedResponse.message || exception.message;
        error = typedResponse.error || 'Error';
      } else {
        message = (exceptionResponse as string) || exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error('HTTP Request Exception', {
      context: 'AllExceptionsFilter',
      method: request.method,
      url: request.url,
      statusCode: status,
      error,
      errorMessage: Array.isArray(message) ? message.join(', ') : message,
      userId: (request.user && (request.user as any)['sub']) || 'anonymous',
      userAgent: request.headers['user-agent'] || 'unknown',
      ip: request.ip || 'unknown',
      stack: exception.stack,
      timestamp: new Date().toISOString(),
      tags: ['http_exception', 'error', status >= 500 ? 'server_error' : 'client_error'],
    });

    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
