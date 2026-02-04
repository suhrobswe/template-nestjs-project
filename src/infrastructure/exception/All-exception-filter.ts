import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import * as geoip from 'geoip-lite';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody = exception.getResponse();
      message =
        typeof responseBody === 'object'
          ? (responseBody as any).message || (responseBody as any).error
          : responseBody;
    } else if (exception instanceof QueryFailedError) {
      status = this.handleDatabaseError(exception);
      message =
        status === HttpStatus.CONFLICT
          ? 'Duplicate entry found'
          : 'Database operation failed';
    } else if (this.isCustomErrorObject(exception)) {
      status = (exception as any).statusCode;
      message = (exception as any).message;
    }

    this.logError(exception, request, status, message);

    const responsePayload = {
      statusCode: status,
      message: message,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(request),
      method: request.method,
    };

    httpAdapter.reply(response, responsePayload, status);
  }

  private handleDatabaseError(exception: QueryFailedError): number {
    const errorCode = (exception as any).code;
    switch (errorCode) {
      case '23505':
        return HttpStatus.CONFLICT;
      case '23503':
        return HttpStatus.BAD_REQUEST;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  private logError(
    exception: unknown,
    request: Request,
    status: number,
    message: any,
  ): void {
    if (status >= 500 || status === HttpStatus.TOO_MANY_REQUESTS) {
      const clientIp = this.extractIp(request);
      const geo = geoip.lookup(clientIp);
      const details = {
        status,
        message,
        path: request.url,
        method: request.method,
        ip: clientIp,
        country: geo?.country || 'Local/Unknown',
        userAgent: request.headers['user-agent'],
      };

      if (status === HttpStatus.TOO_MANY_REQUESTS) {
        this.logger.warn(`⚠️ DDoS ALERT | ${JSON.stringify(details)}`);
      } else {
        this.logger.error(
          `❌ SERVER ERROR | ${JSON.stringify(details)}`,
          exception instanceof Error ? exception.stack : null,
        );
      }
    }
  }

  private extractIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    return typeof forwarded === 'string'
      ? forwarded.split(',')[0]
      : request.socket.remoteAddress || '127.0.0.1';
  }

  private isCustomErrorObject(error: any): boolean {
    return (
      error &&
      typeof error === 'object' &&
      'statusCode' in error &&
      'message' in error
    );
  }
}
