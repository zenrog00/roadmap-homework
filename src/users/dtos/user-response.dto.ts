import { ApiProperty, OmitType } from '@nestjs/swagger';
import { UserDto } from './user.dto';

export class UserResponseDto extends OmitType(UserDto, ['password'] as const) {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;
}

export class UserMyResponseDto extends UserResponseDto {
  @ApiProperty({
    type: String,
    example: '1234.56',
    pattern: '^\\d+(\\.\\d{2})$',
  })
  balance: string;
}
