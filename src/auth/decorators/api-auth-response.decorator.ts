import { applyDecorators } from '@nestjs/common';
import { ApiCreatedResponse } from '@nestjs/swagger';
import { AuthResponseDto } from '../dtos';

export function ApiAuthResponse(description?: string) {
  return applyDecorators(
    ApiCreatedResponse({
      type: AuthResponseDto,
      ...(description && { description }),
      headers: {
        'Set-Cookie': {
          description:
            'Contains refreshToken for storing user session and ability to refresh tokens',
          schema: {
            type: 'string',
            example:
              'refreshToken=tokenValue; HttpOnly; Path=/auth MaxAge=2592000',
          },
        },
      },
    }),
  );
}
