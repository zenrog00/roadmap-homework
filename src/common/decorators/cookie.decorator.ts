import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const Cookie = createParamDecorator(
  (name: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const cookies = request.cookies;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return name ? cookies?.[name] : cookies;
  },
);
