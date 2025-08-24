import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const { method, url, body, user } = req;
    const userId = user?.sub || 'anonymous';

    this.logger.info('Request received', {
      context: 'LoggingInterceptor',
      userId,
      method,
      url,
      body,
      tags: ['http', 'request'],
    });

    const now = Date.now();

    return next.handle().pipe(
      tap(data => {
        this.logger.info('Request completed', {
          context: 'LoggingInterceptor',
          userId,
          method,
          url,
          processingTime: `${Date.now() - now}ms`,
          responseType: typeof data === 'object' ? 'Object' : typeof data,
          tags: ['http', 'response', 'success'],
        });
      }),
    );
  }
}
