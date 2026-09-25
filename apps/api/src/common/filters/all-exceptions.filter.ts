import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isProduction = process.env.NODE_ENV === 'production';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      code = exception.name;

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, unknown>;
        message = (body.message as string) || exception.message;
        details = body.error || body.message;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Prisma known client errors - sanitized for client safety
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          code = 'UNIQUE_CONSTRAINT_VIOLATION';
          message = `Unique constraint failed on field(s): ${(exception.meta?.target as string[])?.join(', ')}`;
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          code = 'RECORD_NOT_FOUND';
          message = 'The requested resource was not found';
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          code = 'FOREIGN_KEY_CONSTRAINT_FAILED';
          message = 'Related resource not found or invalid reference';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          code = 'DATABASE_OPERATION_FAILED';
          message = isProduction
            ? 'Unable to process database operation'
            : exception.message.split('\n').pop() || 'Database request failed';
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      code = 'DATABASE_VALIDATION_ERROR';
      message = 'Invalid data provided for database operation';
    } else if (exception instanceof Error) {
      if (status >= 500 && isProduction) {
        message = 'Internal server error';
        code = 'INTERNAL_SERVER_ERROR';
      } else {
        message = exception.message;
        code = exception.name;
      }
    }

    // Always log internal details securely on the server console
    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} - ${status} ${code}: ${exception instanceof Error ? exception.message : message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `[${request.method}] ${request.url} - ${status} ${code}: ${message}`,
      );
    }

    // Return sanitized payload to client without stack traces or sensitive internals
    response.status(status).json({
      success: false,
      statusCode: status,
      error: {
        code,
        message,
        details: isProduction && status >= 500 ? undefined : details,
      },
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
