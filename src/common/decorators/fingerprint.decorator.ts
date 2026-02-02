import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const Fingerprint = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const ip = request.ip;
    const userAgent = request.headers['user-agent'];
    const separator = '|';
    return ip + separator + userAgent;
  },
);
