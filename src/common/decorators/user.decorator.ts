import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const User = createParamDecorator(
  (prop: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return prop ? user?.[prop] : user;
  },
);
