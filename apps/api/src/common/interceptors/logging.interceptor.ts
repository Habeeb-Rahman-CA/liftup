import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || 'unknown';
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const { statusCode } = response;
          const delay = Date.now() - now;
          this.logger.log(
            `[${method}] ${url} ${statusCode} - ${delay}ms [IP: ${ip}] [Agent: ${userAgent}]`,
          );
        },
        error: (error: Error) => {
          const delay = Date.now() - now;
          this.logger.warn(
            `[${method}] ${url} FAILED - ${delay}ms - ${error.message} [IP: ${ip}]`,
          );
        },
      }),
    );
  }
}
