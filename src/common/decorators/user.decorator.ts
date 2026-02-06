import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthRequest, AuthUser } from 'src/auth/utils/types';

export const User = createParamDecorator(
  (prop: keyof AuthUser, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthRequest>();
    const { user } = request;
    return prop ? user?.[prop] : user;
  },
);
